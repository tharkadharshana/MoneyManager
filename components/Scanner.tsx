import React, { useState } from 'react';
import { Upload, FileText, X, Check, BrainCircuit, Tag, Lock, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { CATEGORIES, CURRENT_USER_ID } from '../constants';
import { findBestMatch, ReceiptCandidate } from '../utils/matching';
import { autoCategorize } from '../utils/categorization';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { useData } from '../context/DataContext';

export const Scanner: React.FC = () => {
  const { transactions, accounts, addTransaction, updateTransaction } = useData();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // Processing States
  const [processing, setProcessing] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  
  // Results
  const [matchResult, setMatchResult] = useState<{ tx: Transaction | null, score: number, details: string } | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState<{ id: string | null, name: string, confidence: number } | null>(null);
  const [ocrResult, setOcrResult] = useState<ReceiptCandidate | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isFileProtected = (file: File) => {
      return file.name.toLowerCase().includes('locked') || file.name.toLowerCase().includes('statement');
  };

  const processFile = (fileToProcess: File, passwordToUse?: string) => {
      setProcessing(true);
      setPasswordRequired(false);

      setTimeout(() => {
        // 1. Check for Password Protection Simulation
        if (isFileProtected(fileToProcess)) {
            const account = accounts.find(a => a.id === selectedAccountId);
            const activePassword = passwordToUse || account?.defaultPdfPassword;
            const validMockPassword = "user1234";

            if (!activePassword || (activePassword !== validMockPassword && activePassword !== "correct")) {
                 setProcessing(false);
                 setPasswordRequired(true);
                 setTempPassword('');
                 return;
            }
        }

        // 2. OCR Simulation (Generic Fallback)
        // Since we don't have a real backend, we default to a generic "Scanned Receipt" 
        // using the current time, forcing the user to verify/edit later.
        const now = new Date();
        
        const simulatedReceipt: ReceiptCandidate = {
            amount: 0.00, // Zero amount forces user attention
            date: now, 
            merchantName: fileToProcess.name.replace(/\.[^/.]+$/, "") || "Scanned Receipt" 
        };

        setOcrResult(simulatedReceipt);

        // 3. Run Intelligent Matching against LIVE data
        const result = findBestMatch(simulatedReceipt, transactions);
        setMatchResult({
            tx: result.transaction,
            score: result.score,
            details: result.details
        });

        // 4. Run Auto-Categorization
        const catResult = autoCategorize(simulatedReceipt.merchantName);
        if (catResult.categoryId) {
            const catName = CATEGORIES.find(c => c.id === catResult.categoryId)?.name || 'Unknown';
            setSuggestedCategory({
                id: catResult.categoryId,
                name: catName,
                confidence: catResult.confidence
            });
        }
        
        setProcessing(false);
      }, 1500);
  };

  const startProcessing = () => {
      if (!file) return;
      processFile(file);
  }

  const handlePasswordRetry = () => {
      if (tempPassword && file) {
          processFile(file, tempPassword);
      }
  };

  const handleSave = async () => {
    if (matchResult?.tx) {
        // Update existing transaction
        await updateTransaction(matchResult.tx.id, {
            status: TransactionStatus.CLEARED,
            receipts: [...(matchResult.tx.receipts || []), {
                id: `rcpt_${Date.now()}`,
                storageUrl: 'mock_storage_url_from_firebase', 
                uploadedAt: new Date().toISOString()
            }]
        });
        setSuccessMessage('Receipt linked to transaction!');
    } else if (ocrResult) {
        // Create new transaction in Firestore
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
            status: TransactionStatus.PENDING, // Pending because amount is likely 0.00
            categoryId: suggestedCategory?.id || undefined,
            isRecurring: false,
            isSplit: false,
            splits: [],
            items: [],
            receipts: [{
                id: `rcpt_${Date.now()}`,
                storageUrl: 'mock_storage_url_from_firebase',
                uploadedAt: new Date().toISOString()
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await addTransaction(newTx);
        setSuccessMessage('New transaction created!');
    }

    // Reset after delay
    setTimeout(() => {
        reset();
        setSuccessMessage('');
    }, 2000);
  };

  const reset = () => {
    setFile(null);
    setMatchResult(null);
    setOcrResult(null);
    setSuggestedCategory(null);
    setProcessing(false);
    setPasswordRequired(false);
    setTempPassword('');
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full flex flex-col relative">
      <h1 className="text-2xl font-bold text-white pt-2">Scan & Upload</h1>
      
      {successMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <Check size={40} className="text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white">{successMessage}</h2>
          </div>
      ) : (
      <>
      <p className="text-zinc-400 text-sm">Upload receipts or bank statements. If a file is password protected, we'll try your saved account password first.</p>

      {/* Account Selector - Added z-index to ensure it sits above the file input area */}
      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 relative z-20">
        <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Link to Account (Optional)</label>
        <select 
            className="w-full bg-zinc-950 text-white text-sm rounded-lg border border-zinc-700 p-2.5 focus:ring-primary focus:border-primary outline-none relative z-20"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
        >
            <option value="">Select an account...</option>
            {accounts.length > 0 ? (
                accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))
            ) : (
                <option value="" disabled>No accounts available</option>
            )}
        </select>
      </div>

      {!file && (
        <div 
            className={`relative flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-colors min-h-[200px] z-10 ${
                dragActive ? 'border-primary bg-primary/5' : 'border-zinc-700 bg-zinc-900/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <Upload size={24} className="text-zinc-400" />
            </div>
            <div className="text-center">
                <p className="text-white font-medium">Tap to upload</p>
                <p className="text-zinc-500 text-xs mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
            <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleChange}
                accept="image/*,.pdf"
            />
        </div>
      )}

      {file && !matchResult && !passwordRequired && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-zinc-900/50 rounded-3xl border border-zinc-700 p-8">
            <div className="relative">
                <FileText size={64} className="text-zinc-600" />
                <button 
                    onClick={reset}
                    className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-600"
                >
                    <X size={12} className="text-white" />
                </button>
            </div>
            <div className="text-center">
                <p className="text-white font-medium text-lg">{file.name}</p>
                <p className="text-zinc-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            <Button 
                fullWidth 
                disabled={processing}
                onClick={startProcessing}
            >
                {processing ? 'Processing...' : 'Process File'}
            </Button>
        </div>
      )}

      {/* Password Prompt */}
      {passwordRequired && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6">
              <div className="bg-surface border border-zinc-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                  <div className="flex flex-col items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                          <Lock size={24} className="text-amber-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Password Required</h3>
                      <p className="text-sm text-zinc-400 text-center mt-1">
                          <span className="text-white font-medium">{file?.name}</span> is protected.
                      </p>
                      {selectedAccountId && (
                          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                              <AlertCircle size={12} />
                              Saved account password failed.
                          </p>
                      )}
                  </div>
                  
                  <input 
                    type="password" 
                    placeholder="Enter PDF Password"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4 focus:ring-primary focus:border-primary outline-none"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                  />

                  <div className="flex gap-3">
                      <Button variant="secondary" fullWidth onClick={reset}>Cancel</Button>
                      <Button variant="primary" fullWidth onClick={handlePasswordRetry}>Unlock</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Results View */}
      {matchResult && (
         <div className="flex-1 flex flex-col gap-4">
            <div className="bg-surface rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Analysis</span>
                </div>
                
                {ocrResult && (
                    <div className="mb-4 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                        <p className="font-medium text-zinc-300 mb-1">Extracted Data:</p>
                        <p>Merchant: {ocrResult.merchantName}</p>
                        <p>Amount: ${ocrResult.amount.toFixed(2)}</p>
                        <p>Date: {ocrResult.date.toLocaleDateString()}</p>
                    </div>
                )}

                {/* Match Status */}
                {matchResult.tx ? (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-emerald-500 rounded-full p-1">
                                <Check size={12} className="text-black" />
                            </div>
                            <span className="text-emerald-500 font-bold">Transaction Matched!</span>
                        </div>
                        <div className="space-y-2 mb-3">
                            <p className="text-zinc-300 text-sm">Linked to: <span className="text-white font-medium">{matchResult.tx.descriptionEnriched || matchResult.tx.descriptionRaw}</span></p>
                            <p className="text-zinc-400 text-xs whitespace-pre-line">{matchResult.details}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-3">
                        <p className="text-amber-500 font-bold mb-1">No Match Found</p>
                        <p className="text-zinc-400 text-xs">No pending transaction found. We'll create a new one for you to review.</p>
                    </div>
                )}

                {/* Category Suggestion */}
                {suggestedCategory && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Tag size={14} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Auto-Categorized</p>
                            <p className="text-sm text-white font-medium">{suggestedCategory.name}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                 <Button variant="secondary" onClick={reset} className="flex-1">Discard</Button>
                 <Button variant="primary" onClick={handleSave} className="flex-1">
                     {matchResult.tx ? 'Confirm & Link' : 'Create'}
                 </Button>
            </div>
         </div>
      )}
      </>
      )}
    </div>
  );
};