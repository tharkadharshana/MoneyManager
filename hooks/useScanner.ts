import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { OCRService } from '../services/ocrService';
import { findBestMatch, ReceiptCandidate } from '../utils/matching';
import { autoCategorize } from '../utils/categorization';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { CATEGORIES, CURRENT_USER_ID } from '../constants';

export const useScanner = () => {
    const { transactions, accounts, addTransaction, updateTransaction } = useWallet();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [matchResult, setMatchResult] = useState<{ tx: Transaction | null, score: number, details: string } | null>(null);
    const [suggestedCategory, setSuggestedCategory] = useState<{ id: string | null, name: string, confidence: number } | null>(null);
    const [ocrResult, setOcrResult] = useState<ReceiptCandidate | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const processFile = async (fileToProcess: File, passwordToUse?: string, selectedAccountId?: string) => {
        setProcessing(true);
        setPasswordRequired(false);
        try {
            let parsedData: ReceiptCandidate;
            const isPdf = fileToProcess.type === 'application/pdf' || fileToProcess.name.toLowerCase().endsWith('.pdf');

            if (isPdf) {
                try {
                    const account = accounts.find(a => a.id === selectedAccountId);
                    const pass = passwordToUse || account?.defaultPdfPassword;
                    // Use new unified processing method
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
                 // Basic Image Handler (Stub - in real app would use Tesseract or Cloud Vision)
                 parsedData = {
                    amount: 0.00,
                    date: new Date(),
                    merchantName: fileToProcess.name.replace(/\.[^/.]+$/, "")
                };
            }

            setOcrResult(parsedData);
            
            // Match Logic
            const result = findBestMatch(parsedData, transactions);
            setMatchResult({
                tx: result.transaction,
                score: result.score,
                details: result.details
            });

            // Categorize Logic
            const catResult = autoCategorize(parsedData.merchantName);
            if (catResult.categoryId) {
                const catName = CATEGORIES.find(c => c.id === catResult.categoryId)?.name || 'Unknown';
                setSuggestedCategory({
                    id: catResult.categoryId,
                    name: catName,
                    confidence: catResult.confidence
                });
            }

        } catch (e) {
            console.error("Scanning error", e);
        } finally {
            setProcessing(false);
        }
    };

    const confirmMatch = async (selectedAccountId: string) => {
        if (matchResult?.tx) {
            await updateTransaction(matchResult.tx.id, {
                status: TransactionStatus.CLEARED,
                receipts: [...(matchResult.tx.receipts || []), {
                    id: `rcpt_${Date.now()}`,
                    storageUrl: 'mock_url',
                    uploadedAt: new Date().toISOString()
                }]
            });
            setSuccessMessage('Receipt linked!');
        } else if (ocrResult) {
            const newTx: Transaction = {
                id: `temp_${Date.now()}`,
                userId: CURRENT_USER_ID,
                accountId: selectedAccountId || accounts[0]?.id || '',
                timestamp: ocrResult.date.getTime(),
                date: ocrResult.date.toISOString(),
                amount: -Math.abs(ocrResult.amount),
                currency: 'USD',
                descriptionRaw: ocrResult.merchantName,
                descriptionEnriched: ocrResult.merchantName,
                type: TransactionType.EXPENSE,
                status: TransactionStatus.PENDING,
                categoryId: suggestedCategory?.id || undefined,
                isRecurring: false,
                isSplit: false,
                splits: [],
                items: [],
                receipts: [{
                    id: `rcpt_${Date.now()}`,
                    storageUrl: 'mock_url',
                    uploadedAt: new Date().toISOString()
                }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await addTransaction(newTx);
            setSuccessMessage('Transaction created!');
        }
    };

    const reset = () => {
        setFile(null);
        setMatchResult(null);
        setOcrResult(null);
        setSuggestedCategory(null);
        setProcessing(false);
        setPasswordRequired(false);
        setSuccessMessage('');
    };

    return {
        file, setFile,
        processing,
        passwordRequired,
        matchResult,
        suggestedCategory,
        ocrResult,
        successMessage,
        processFile,
        confirmMatch,
        reset
    };
};