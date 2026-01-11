import React, { useState } from 'react';
import { Plus, CreditCard, Building2, Wallet, Calendar, Database, Lock, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Account } from '../types';
import { useData } from '../context/DataContext';

export const AccountsView: React.FC = () => {
    const { accounts, updateAccount, addAccount } = useData();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [pdfPassword, setPdfPassword] = useState('');
    
    // Add Account State
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'CREDIT' | 'DEBIT' | 'CASH' | 'INVESTMENT' | 'LOAN'>('DEBIT');
    const [newBalance, setNewBalance] = useState('');

    const openSettings = (acc: Account) => {
        setEditingAccount(acc);
        setPdfPassword(acc.defaultPdfPassword || '');
    };

    const closeSettings = () => {
        setEditingAccount(null);
        setPdfPassword('');
    };

    const saveSettings = () => {
        if (editingAccount) {
            updateAccount(editingAccount.id, { defaultPdfPassword: pdfPassword });
            closeSettings();
        }
    };

    const handleAddAccount = async () => {
        if (!newName) return;
        
        await addAccount({
            name: newName,
            type: newType,
            balance: parseFloat(newBalance) || 0,
            currency: 'USD',
            lastSynced: new Date().toISOString(),
            dataSince: new Date().toISOString(),
            isActive: true
        });

        setIsAdding(false);
        setNewName('');
        setNewType('DEBIT');
        setNewBalance('');
    };

    // Helper to calculate duration
    const getDurationString = (startDateStr?: string) => {
        if (!startDateStr) return 'No historical data';
        const start = new Date(startDateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            const years = (diffDays / 365).toFixed(1);
            return `${years} years of history`;
        }
        return `${diffDays} days of history`;
    }

    return (
        <div className="p-4 space-y-6 pb-24 relative">
            <div className="flex justify-between items-center pt-2">
                <h1 className="text-2xl font-bold text-white">Accounts</h1>
                <Button 
                    size="sm" 
                    className="bg-primary text-black hover:bg-emerald-400 border-none"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus size={16} className="mr-1" /> Add
                </Button>
            </div>

            <div className="grid gap-4">
                {accounts.map((acc) => (
                    <Card key={acc.id} className="relative overflow-hidden group bg-surface border-zinc-800">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${
                                    acc.type === 'CREDIT' ? 'bg-purple-500/10 text-purple-400' :
                                    acc.type === 'DEBIT' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-zinc-800 text-zinc-400'
                                }`}>
                                    {acc.type === 'CREDIT' ? <CreditCard size={20} /> : 
                                     acc.type === 'DEBIT' ? <Building2 size={20} /> : <Wallet size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-base">{acc.name}</h3>
                                    <p className="text-xs text-zinc-500 capitalize">{acc.type.toLowerCase()} • {acc.currency}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-bold text-lg block ${acc.balance < 0 ? 'text-white' : 'text-emerald-400'}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: acc.currency }).format(acc.balance)}
                                </span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Current Balance</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 rounded-lg p-3 flex items-center justify-between border border-zinc-800/50">
                            <div className="flex items-center gap-2">
                                <Database size={14} className="text-primary/70" />
                                <span className="text-xs text-zinc-300 font-medium">
                                    {getDurationString(acc.dataSince)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-zinc-600" />
                                <span className="text-xs text-zinc-600">
                                    Since {acc.dataSince ? new Date(acc.dataSince).getFullYear() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        {acc.defaultPdfPassword && (
                             <div className="mt-2 flex items-center gap-1.5 px-1">
                                <Lock size={12} className="text-emerald-500" />
                                <span className="text-[10px] text-zinc-400">PDF Password Saved</span>
                             </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                             <Button variant="secondary" size="sm" fullWidth className="text-xs h-9 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">Add Data</Button>
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                fullWidth 
                                className="text-xs h-9"
                                onClick={() => openSettings(acc)}
                            >
                                Settings
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
            
            <button 
                onClick={() => setIsAdding(true)}
                className="w-full border-dashed border-2 border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-900/30 hover:border-zinc-700 transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={24} className="text-zinc-500 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Link new account</p>
            </button>

            {/* Add Account Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-surface border border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-500"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-6">Add New Account</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">Account Name</label>
                                <input 
                                    type="text" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Chase Checking"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">Account Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                     {['DEBIT', 'CREDIT', 'CASH', 'INVESTMENT', 'LOAN'].map(type => (
                                         <button
                                            key={type}
                                            onClick={() => setNewType(type as any)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                                newType === type 
                                                ? 'bg-primary/10 border-primary text-primary' 
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                         >
                                             {type}
                                         </button>
                                     ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">Initial Balance</label>
                                 <input 
                                    type="number" 
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button variant="secondary" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button variant="primary" fullWidth onClick={handleAddAccount}>Create Account</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Settings Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-surface border border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <button 
                            onClick={closeSettings}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-500"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-1">Account Settings</h2>
                        <p className="text-sm text-zinc-400 mb-6">{editingAccount.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                                    Default PDF Password
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={pdfPassword}
                                        onChange={(e) => setPdfPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <Lock size={16} className="absolute right-4 top-3.5 text-zinc-600" />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2">
                                    We'll automatically use this password when you upload statement PDFs for this account.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button variant="secondary" fullWidth onClick={closeSettings}>Cancel</Button>
                                <Button variant="primary" fullWidth onClick={saveSettings}>Save</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}