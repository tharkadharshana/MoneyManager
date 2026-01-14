import React, { useState } from 'react';
import { Upload, FileText, X, Check, BrainCircuit, Tag, Lock, Trash2, PlusCircle, AlertCircle, Edit2, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { useScanner } from '../hooks/useScanner';
import { useWallet } from '../context/WalletContext';
import { CATEGORIES } from '../constants';

export const Scanner: React.FC = () => {
  const { accounts } = useWallet();
  const { 
      file, setFile, processing, passwordRequired, matchResult, 
      ocrResults, successMessage, removedCount,
      processFile, confirmMatch, removeItem, reset,
      updateItem
  } = useScanner();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [tempPassword, setTempPassword] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Edit Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ merchantName: '', amount: '', currency: '', categoryId: '' });

  const targetAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // UI Helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const onConfirm = async () => {
      if (isConfirming) return;
      setIsConfirming(true);
      try {
          await confirmMatch(selectedAccountId);
          setTimeout(() => {
              setIsConfirming(false);
              reset();
          }, 2000);
      } catch (e) {
          setIsConfirming(false);
          console.error("Confirmation failed", e);
      }
  };
  
  const startEdit = (index: number) => {
      const item = ocrResults[index];
      setEditForm({
          merchantName: item.merchantName,
          amount: Math.abs(item.amount).toString(),
          currency: item.currency || 'USD',
          categoryId: item.categoryId || ''
      });
      setEditingIndex(index);
  };

  const saveEdit = () => {
      if (updateItem && editingIndex !== null) {
          updateItem(editingIndex, {
              merchantName: editForm.merchantName,
              amount: parseFloat(editForm.amount) * (ocrResults[editingIndex].amount < 0 ? -1 : 1), // Preserve sign
              currency: editForm.currency,
              categoryId: editForm.categoryId || undefined
          });
      }
      setEditingIndex(null);
  };

  const isBulk = ocrResults.length > 1;

  // Prepare categories for dropdown
  const categoryOptions = [
      { value: '', label: 'Select Category...' },
      ...CATEGORIES.map(c => ({ value: c.id, label: c.name }))
  ];

  const getCategoryName = (id?: string) => {
      return CATEGORIES.find(c => c.id === id)?.name || 'Uncategorized';
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
              {targetAccount && (
                  <p className="text-zinc-400 text-sm mt-2">Added to {targetAccount.name}</p>
              )}
          </div>
      ) : (
      <>
      {!file && <p className="text-zinc-400 text-sm">Upload receipts or bank statements for a specific account.</p>}

      {/* Account Selector - Only show if not processing results yet */}
      {ocrResults.length === 0 && (
        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 relative z-20">
            <Select 
                label="Select Account for Import"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={[
                    { value: '', label: 'Select an account...' },
                    ...accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.type})` }))
                ]}
            />
        </div>
      )}

      {/* Upload Zone */}
      {!file && (
        <div 
            className={`relative flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-colors min-h-[200px] z-10 ${
                dragActive ? 'border-primary bg-primary/5' : 'border-zinc-700 bg-zinc-900/50'
            }`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
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
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                accept="image/*,.pdf"
            />
        </div>
      )}

      {/* Processing State */}
      {file && ocrResults.length === 0 && !passwordRequired && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-zinc-900/50 rounded-3xl border border-zinc-700 p-8">
            <div className="relative">
                <FileText size={64} className="text-zinc-600" />
                <button onClick={reset} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-600">
                    <X size={12} className="text-white" />
                </button>
            </div>
            <div className="text-center">
                <p className="text-white font-medium text-lg">{file.name}</p>
                <p className="text-zinc-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button fullWidth disabled={processing} onClick={() => processFile(file, undefined, selectedAccountId)}>
                {processing ? 'Scanning...' : 'Process File'}
            </Button>
        </div>
      )}

      {/* Password Modal Overlay */}
      {passwordRequired && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6">
              <div className="bg-surface border border-zinc-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                  <div className="flex flex-col items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                          <Lock size={24} className="text-amber-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Password Required</h3>
                      <p className="text-sm text-zinc-400 text-center mt-1">File is encrypted.</p>
                  </div>
                  <Input 
                    type="password" 
                    placeholder="Enter PDF Password" 
                    value={tempPassword} 
                    onChange={(e) => setTempPassword(e.target.value)} 
                    className="mb-4"
                  />
                  <div className="flex gap-3">
                      <Button variant="secondary" fullWidth onClick={reset}>Cancel</Button>
                      <Button variant="primary" fullWidth onClick={() => processFile(file!, tempPassword, selectedAccountId)}>Unlock</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Results View */}
      {ocrResults.length > 0 && (
         <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
            <div className="bg-surface rounded-2xl p-4 border border-zinc-800 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BrainCircuit size={16} className="text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Review Data</span>
                    </div>
                    {/* Target Account Badge */}
                    {targetAccount && (
                        <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700">
                            <span className="text-[10px] text-zinc-400">To:</span>
                            <span className="text-[10px] font-medium text-white truncate max-w-[100px]">{targetAccount.name}</span>
                        </div>
                    )}
                </div>

                {removedCount > 0 && (
                    <div className="mb-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-500">
                        <AlertCircle size={14} />
                        <span>{removedCount} reversed transactions were auto-removed.</span>
                    </div>
                )}

                {isBulk ? (
                    // BULK LIST VIEW
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar pb-16">
                        {ocrResults.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="font-medium text-zinc-200 text-sm truncate">{item.merchantName}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs text-zinc-500">{item.date.toLocaleDateString()}</p>
                                        <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800 rounded">{item.currency || 'USD'}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.categoryId ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                                            {getCategoryName(item.categoryId)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`font-mono text-sm ${item.amount < 0 ? 'text-white' : 'text-emerald-400'}`}>
                                        {item.amount < 0 ? '-' : '+'}{Math.abs(item.amount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex gap-1 ml-2">
                                    <button 
                                        onClick={() => startEdit(idx)}
                                        className="p-2 text-zinc-600 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Edit transaction"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => removeItem(idx)}
                                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Delete transaction"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // SINGLE ITEM VIEW
                    <>
                        <div className="mb-4 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-zinc-300 mb-1">Extracted:</p>
                                <p>Merchant: {ocrResults[0].merchantName}</p>
                                <p>Amount: {Math.abs(ocrResults[0].amount).toFixed(2)} {ocrResults[0].currency}</p>
                                <p className="mt-1 text-indigo-400">Category: {getCategoryName(ocrResults[0].categoryId)}</p>
                            </div>
                            <button 
                                onClick={() => startEdit(0)}
                                className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>

                        {matchResult?.tx ? (
                            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-3">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-emerald-500 rounded-full p-1"><Check size={12} className="text-black" /></div>
                                    <span className="text-emerald-500 font-bold">Matched!</span>
                                </div>
                                <p className="text-zinc-300 text-sm">Linked to: {matchResult.tx.descriptionEnriched}</p>
                            </div>
                        ) : (
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-3">
                                <div className="flex items-center gap-3 mb-1">
                                    <PlusCircle size={16} className="text-blue-400" />
                                    <p className="text-blue-400 font-bold">New Transaction</p>
                                </div>
                                <p className="text-zinc-400 text-xs pl-7">Ready to create new entry.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-zinc-800 flex gap-3 z-30">
                 <Button variant="secondary" onClick={reset} className="flex-1" disabled={isConfirming}>Discard</Button>
                 <Button variant="primary" onClick={onConfirm} className="flex-1" disabled={isConfirming}>
                     {isConfirming ? 'Saving...' : (isBulk ? `Confirm & Import (${ocrResults.length})` : 'Confirm')}
                 </Button>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editingIndex !== null} onClose={() => setEditingIndex(null)} title="Edit Transaction">
         <div className="space-y-4">
             <Input 
                label="Merchant" 
                value={editForm.merchantName} 
                onChange={e => setEditForm(prev => ({...prev, merchantName: e.target.value}))} 
             />
             
             <Select 
                label="Category"
                value={editForm.categoryId}
                onChange={e => setEditForm(prev => ({...prev, categoryId: e.target.value}))}
                options={categoryOptions}
             />

             <div className="flex gap-4">
                 <div className="flex-1">
                    <Input 
                        label="Amount" 
                        type="number"
                        value={editForm.amount} 
                        onChange={e => setEditForm(prev => ({...prev, amount: e.target.value}))} 
                    />
                 </div>
                 <div className="w-24">
                    <Input 
                        label="Currency" 
                        value={editForm.currency} 
                        onChange={e => setEditForm(prev => ({...prev, currency: e.target.value}))} 
                    />
                 </div>
             </div>
             <div className="flex gap-3 pt-2">
                 <Button variant="secondary" fullWidth onClick={() => setEditingIndex(null)}>Cancel</Button>
                 <Button variant="primary" fullWidth onClick={saveEdit}>Save</Button>
             </div>
         </div>
      </Modal>

      </>
      )}
    </div>
  );
};