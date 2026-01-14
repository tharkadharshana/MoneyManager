import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Building2, Wallet, Calendar, Database, Lock, X, Landmark, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { Account } from '../types';
import { useWallet } from '../context/WalletContext';

const SRI_LANKAN_BANKS = [
    "Bank of Ceylon",
    "People's Bank",
    "Commercial Bank",
    "Hatton National Bank",
    "Sampath Bank",
    "Seylan Bank",
    "National Savings Bank",
    "Nations Trust Bank",
    "DFCC Bank",
    "National Development Bank",
    "Pan Asia Bank",
    "Union Bank",
    "Amana Bank",
    "Cargills Bank",
    "Standard Chartered Bank",
    "HSBC",
    "Other"
];

export const AccountsView: React.FC = () => {
    const { accounts, updateAccount, addAccount, deleteAccount, error, clearError } = useWallet();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [pdfPassword, setPdfPassword] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Add Account Form State
    const [newName, setNewName] = useState('');
    const [newInstitution, setNewInstitution] = useState('');
    const [newType, setNewType] = useState<'CREDIT' | 'DEBIT' | 'CASH' | 'INVESTMENT' | 'LOAN' | 'SAVINGS' | 'CURRENT'>('SAVINGS');
    const [newBalance, setNewBalance] = useState('');

    useEffect(() => {
        if (error) setLocalError(error);
    }, [error]);

    const handleSaveSettings = () => {
        if (editingAccount) {
            updateAccount(editingAccount.id, { defaultPdfPassword: pdfPassword });
            setEditingAccount(null);
        }
    };

    const handleDeleteAccount = async () => {
        if (editingAccount) {
            setIsDeleting(true);
            try {
                await deleteAccount(editingAccount.id);
                setEditingAccount(null);
            } catch (e) {
                // error handled by context
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleCreateAccount = async () => {
        if (!newName) return;
        setLocalError(null);
        clearError();
        try {
            await addAccount({
                name: newName,
                type: newType,
                balance: parseFloat(newBalance) || 0,
                currency: 'USD',
                lastSynced: new Date().toISOString(),
                dataSince: new Date().toISOString(),
                institution: newInstitution,
                isActive: true
            });
            setIsAdding(false);
            setNewName('');
            setNewInstitution('');
            setNewType('SAVINGS');
            setNewBalance('');
        } catch (e) {
            // Error is handled in context and set to 'error' state, which we watch
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'CREDIT': return 'bg-purple-500/10 text-purple-400';
            case 'DEBIT': return 'bg-blue-500/10 text-blue-400';
            case 'SAVINGS': return 'bg-emerald-500/10 text-emerald-400';
            case 'CURRENT': return 'bg-indigo-500/10 text-indigo-400';
            case 'INVESTMENT': return 'bg-amber-500/10 text-amber-400';
            default: return 'bg-zinc-800 text-zinc-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'CREDIT': return <CreditCard size={20} />;
            case 'INVESTMENT': return <Landmark size={20} />;
            case 'SAVINGS': 
            case 'CURRENT':
            case 'DEBIT': return <Building2 size={20} />;
            default: return <Wallet size={20} />;
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 relative">
            <div className="flex justify-between items-center pt-2">
                <h1 className="text-2xl font-bold text-white">Accounts</h1>
                <Button size="sm" className="bg-primary text-black" onClick={() => setIsAdding(true)}>
                    <Plus size={16} className="mr-1" /> Add
                </Button>
            </div>

            {localError && !isAdding && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400 text-xs mb-4">
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                    <button onClick={() => setLocalError(null)} className="ml-auto"><X size={14} /></button>
                </div>
            )}

            <div className="grid gap-4">
                {accounts.map((acc) => (
                    <Card key={acc.id} className="relative overflow-hidden group bg-surface border-zinc-800">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${getTypeColor(acc.type)}`}>
                                    {getTypeIcon(acc.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-base">{acc.name}</h3>
                                    <div className="flex flex-col">
                                        <p className="text-xs text-zinc-500 capitalize">{acc.type.toLowerCase()}</p>
                                        {acc.institution && (
                                            <p className="text-xs text-zinc-400 font-medium">{acc.institution}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={`font-bold text-lg block ${acc.balance < 0 ? 'text-white' : 'text-emerald-400'}`}>
                                ${acc.balance.toFixed(2)}
                            </span>
                        </div>
                        
                        <div className="flex gap-2">
                             <Button variant="secondary" size="sm" fullWidth className="text-xs">History</Button>
                             <Button variant="ghost" size="sm" fullWidth className="text-xs" 
                                onClick={() => { setEditingAccount(acc); setPdfPassword(acc.defaultPdfPassword || ''); }}>
                                Settings
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isAdding} onClose={() => { setIsAdding(false); setLocalError(null); }} title="Add Account">
                <div className="space-y-4">
                    {localError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-red-400 text-xs">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{localError}</span>
                        </div>
                    )}

                    <Select 
                        label="BANK / INSTITUTION"
                        value={newInstitution}
                        onChange={(e) => {
                            setNewInstitution(e.target.value);
                            // Auto-fill nickname if empty
                            if (!newName && e.target.value) {
                                setNewName(`${e.target.value} Account`);
                            }
                        }}
                        options={[
                            { value: '', label: 'Select Bank...' },
                            ...SRI_LANKAN_BANKS.map(bank => ({ value: bank, label: bank }))
                        ]}
                    />

                    <Input 
                        label="ACCOUNT NICKNAME" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        placeholder="e.g. My Savings" 
                    />
                    
                    <Input 
                        label="CURRENT BALANCE" 
                        type="number" 
                        value={newBalance} 
                        onChange={e => setNewBalance(e.target.value)} 
                        placeholder="0.00" 
                    />
                    
                    <div>
                        <label className="text-xs font-medium text-zinc-400 ml-1">ACCOUNT TYPE</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {['SAVINGS', 'CURRENT', 'CREDIT', 'DEBIT', 'CASH', 'INVESTMENT', 'LOAN'].map(t => (
                                <button key={t} onClick={() => setNewType(t as any)} 
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                        newType === t 
                                        ? 'bg-primary/10 border-primary text-primary' 
                                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button variant="primary" fullWidth onClick={handleCreateAccount}>Create Account</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Settings" description={editingAccount?.name}>
                <div className="space-y-4">
                     <Input 
                        label="PDF Password" 
                        icon={Lock} 
                        value={pdfPassword} 
                        onChange={e => setPdfPassword(e.target.value)} 
                        placeholder="Statement Password"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setEditingAccount(null)}>Cancel</Button>
                        <Button variant="primary" fullWidth onClick={handleSaveSettings}>Save</Button>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-800">
                        <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                            <Trash2 size={16} className="mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                        <p className="text-[10px] text-zinc-500 text-center mt-2">
                            This will permanently remove the account from your dashboard.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};