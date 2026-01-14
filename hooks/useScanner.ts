import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { OCRService } from '../services/ocrService';
import { findBestMatch, ReceiptCandidate } from '../utils/matching';
import { autoCategorize } from '../utils/categorization';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { CATEGORIES, CURRENT_USER_ID } from '../constants';
import { normalizeString, jaroWinkler } from '../utils/stringUtils';

export const useScanner = () => {
    const { transactions, accounts, addTransaction, updateTransaction, categoryRules } = useWallet();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [passwordRequired, setPasswordRequired] = useState(false);
    
    // Changed to array to support bulk parsing
    const [ocrResults, setOcrResults] = useState<ReceiptCandidate[]>([]);
    
    // Only used for single-item processing
    const [matchResult, setMatchResult] = useState<{ tx: Transaction | null, score: number, details: string } | null>(null);
    const [suggestedCategory, setSuggestedCategory] = useState<{ id: string | null, name: string, confidence: number } | null>(null);
    
    const [successMessage, setSuccessMessage] = useState('');
    const [removedCount, setRemovedCount] = useState(0);

    const processFile = async (fileToProcess: File, passwordToUse?: string, selectedAccountId?: string) => {
        setProcessing(true);
        setPasswordRequired(false);
        setMatchResult(null);
        setSuggestedCategory(null);
        setOcrResults([]);
        setRemovedCount(0);

        try {
            let parsedData: ReceiptCandidate[] = [];
            const isPdf = fileToProcess.type === 'application/pdf' || fileToProcess.name.toLowerCase().endsWith('.pdf');

            if (isPdf) {
                try {
                    const account = accounts.find(a => a.id === selectedAccountId);
                    const pass = passwordToUse || account?.defaultPdfPassword;
                    parsedData = await OCRService.processPdf(fileToProcess, pass);
                } catch (error: any) {
                    if (error.message === 'PASSWORD_REQUIRED') {
                        setPasswordRequired(true);
                        setProcessing(false);
                        return;
                    }
                    throw error;
                }
            } else {
                 parsedData = [{
                    amount: 0.00,
                    date: new Date(),
                    merchantName: fileToProcess.name.replace(/\.[^/.]+$/, ""),
                    currency: 'USD'
                }];
            }

            if (parsedData.length === 0) {
                 parsedData = [{
                    amount: 0.00,
                    date: new Date(),
                    merchantName: "Scan Failed",
                    currency: 'USD'
                }];
            }

            // --- AUTO REVERSAL DETECTION LOGIC ---
            const validData: ReceiptCandidate[] = [];
            const removedIndices = new Set<number>();

            for (let i = 0; i < parsedData.length; i++) {
                if (removedIndices.has(i)) continue;

                let reversedFound = false;
                for (let j = i + 1; j < parsedData.length; j++) {
                    if (removedIndices.has(j)) continue;
                    
                    const itemA = parsedData[i];
                    const itemB = parsedData[j];

                    // Check for cancellation
                    const sumsToZero = Math.abs(itemA.amount + itemB.amount) < 0.01;
                    
                    const nameSim = jaroWinkler(normalizeString(itemA.merchantName), normalizeString(itemB.merchantName));
                    
                    if (sumsToZero && nameSim > 0.6) { 
                        removedIndices.add(j);
                        reversedFound = true;
                        break; 
                    }
                }

                if (reversedFound) {
                    removedIndices.add(i);
                } else {
                    // --- AUTO CATEGORIZATION WITH HISTORY & RULES ---
                    const item = parsedData[i];
                    // Pass transaction history AND category rules
                    const catResult = autoCategorize(item.merchantName, transactions, categoryRules);
                    
                    validData.push({
                        ...item,
                        categoryId: catResult.categoryId || undefined // Store predicted category
                    });
                }
            }
            
            if (removedIndices.size > 0) {
                setRemovedCount(removedIndices.size);
            }

            setOcrResults(validData);
            
            if (validData.length === 1) {
                const singleItem = validData[0];
                const result = findBestMatch(singleItem, transactions);
                setMatchResult({
                    tx: result.transaction,
                    score: result.score,
                    details: result.details
                });

                if (singleItem.categoryId) {
                    const catName = CATEGORIES.find(c => c.id === singleItem.categoryId)?.name || 'Unknown';
                    setSuggestedCategory({
                        id: singleItem.categoryId,
                        name: catName,
                        confidence: 0.9
                    });
                }
            } else {
                setMatchResult(null);
            }

        } catch (e) {
            console.error("Scanning error", e);
        } finally {
            setProcessing(false);
        }
    };

    const removeItem = (index: number) => {
        setOcrResults(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, updates: Partial<ReceiptCandidate>) => {
        setOcrResults(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const confirmMatch = async (selectedAccountId: string) => {
        if (ocrResults.length === 1 && matchResult?.tx) {
            await updateTransaction(matchResult.tx.id, {
                status: TransactionStatus.CLEARED,
                receipts: [...(matchResult.tx.receipts || []), {
                    id: `rcpt_${Date.now()}`,
                    storageUrl: 'mock_url',
                    uploadedAt: new Date().toISOString()
                }]
            });
            setSuccessMessage('Receipt linked!');
        } 
        else if (ocrResults.length > 0) {
            let importCount = 0;
            for (const item of ocrResults) {
                // Use the category ID that is already in the item (either auto-detected or manually edited)
                // Fallback to auto-detection if somehow missing, but respect the edit
                let categoryId = item.categoryId;
                
                if (!categoryId) {
                     const catResult = autoCategorize(item.merchantName, transactions, categoryRules);
                     categoryId = catResult.categoryId || undefined;
                }

                const newTx: Transaction = {
                    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: CURRENT_USER_ID,
                    accountId: selectedAccountId || accounts[0]?.id || '',
                    timestamp: item.date.getTime(),
                    date: item.date.toISOString(),
                    amount: item.amount, 
                    currency: item.currency || 'USD',
                    descriptionRaw: item.merchantName,
                    descriptionEnriched: item.merchantName,
                    type: item.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    status: TransactionStatus.CLEARED, 
                    // Safely add categoryId only if it exists
                    ...(categoryId ? { categoryId } : {}),
                    isRecurring: false,
                    isSplit: false,
                    splits: [],
                    items: [],
                    receipts: file ? [{
                        id: `rcpt_${Date.now()}`,
                        storageUrl: 'mock_url',
                        uploadedAt: new Date().toISOString()
                    }] : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await addTransaction(newTx);
                importCount++;
            }
            setSuccessMessage(`Imported ${importCount} transactions!`);
        }
    };

    const reset = () => {
        setFile(null);
        setMatchResult(null);
        setOcrResults([]);
        setSuggestedCategory(null);
        setProcessing(false);
        setPasswordRequired(false);
        setSuccessMessage('');
        setRemovedCount(0);
    };

    return {
        file, setFile,
        processing,
        passwordRequired,
        matchResult,
        suggestedCategory,
        ocrResults, 
        successMessage,
        removedCount,
        processFile,
        confirmMatch,
        removeItem,
        updateItem,
        reset
    };
};