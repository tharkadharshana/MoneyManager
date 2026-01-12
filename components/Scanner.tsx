import React, { useState } from 'react';
import { Upload, FileText, X, Check, BrainCircuit, Tag, Lock, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useScanner } from '../hooks/useScanner';
import { useWallet } from '../context/WalletContext';

export const Scanner: React.FC = () => {
  const { accounts } = useWallet();
  const { 
      file, setFile, processing, passwordRequired, matchResult, 
      suggestedCategory, ocrResult, successMessage, 
      processFile, confirmMatch, reset 
  } = useScanner();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [tempPassword, setTempPassword] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
      await confirmMatch(selectedAccountId);
      setTimeout(reset, 2000);
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
      <p className="text-zinc-400 text-sm">Upload receipts or bank statements.</p>

      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 relative z-20">
         <Select 
            label="Link to Account (Optional)"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            options={[
                { value: '', label: 'Select an account...' },
                ...accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.type})` }))
            ]}
         />
      </div>

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

      {file && !matchResult && !passwordRequired && (
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
      {matchResult && (
         <div className="flex-1 flex flex-col gap-4">
            <div className="bg-surface rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Analysis</span>
                </div>
                
                {ocrResult && (
                    <div className="mb-4 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                        <p className="font-medium text-zinc-300 mb-1">Extracted:</p>
                        <p>Merchant: {ocrResult.merchantName}</p>
                        <p>Amount: ${ocrResult.amount.toFixed(2)}</p>
                    </div>
                )}

                {matchResult.tx ? (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-emerald-500 rounded-full p-1"><Check size={12} className="text-black" /></div>
                            <span className="text-emerald-500 font-bold">Matched!</span>
                        </div>
                        <p className="text-zinc-300 text-sm">Linked to: {matchResult.tx.descriptionEnriched}</p>
                    </div>
                ) : (
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-3">
                        <p className="text-amber-500 font-bold mb-1">No Match</p>
                        <p className="text-zinc-400 text-xs">Creating new transaction.</p>
                    </div>
                )}
            </div>
            <div className="flex gap-3">
                 <Button variant="secondary" onClick={reset} className="flex-1">Discard</Button>
                 <Button variant="primary" onClick={onConfirm} className="flex-1">Confirm</Button>
            </div>
         </div>
      )}
      </>
      )}
    </div>
  );
};