import React, { useState } from 'react';
import { Plus, CreditCard, Building2, Wallet, Calendar, Database, Lock, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Account } from '../types';
import { useWallet } from '../context/WalletContext';

export const AccountsView: React.FC = () => {
    const { accounts, updateAccount, addAccount } = useWallet();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [pdfPassword, setPdfPassword] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // Add Account Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'CREDIT' | 'DEBIT' | 'CASH' | 'INVESTMENT' | 'LOAN'>('DEBIT');
    const [newBalance, setNewBalance] = useState('');

    const handleSaveSettings = () => {
        if (editingAccount) {
            updateAccount(editingAccount.id, { defaultPdfPassword: pdfPassword });
            setEditingAccount(null);
        }
    };

    const handleCreateAccount = async () => {
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

    return (
        <div className="p-4 space-y-6 pb-24 relative">
            <div className="flex justify-between items-center pt-2">
                <h1 className="text-2xl font-bold text-white">Accounts</h1>
                <Button size="sm" className="bg-primary text-black" onClick={() => setIsAdding(true)}>
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
                                    {acc.type === 'CREDIT' ? <CreditCard size={20} /> : <Building2 size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-base">{acc.name}</h3>
                                    <p className="text-xs text-zinc-500 capitalize">{acc.type.toLowerCase()}</p>
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

            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Account">
                <div className="space-y-4">
                    <Input label="NAME" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Chase" />
                    <Input label="BALANCE" type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="0.00" />
                    <div>
                        <label className="text-xs font-medium text-zinc-400 ml-1">TYPE</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {['DEBIT', 'CREDIT', 'CASH', 'INVESTMENT'].map(t => (
                                <button key={t} onClick={() => setNewType(t as any)} 
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${newType === t ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button variant="primary" fullWidth onClick={handleCreateAccount}>Create</Button>
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
                </div>
            </Modal>
        </div>
    );
};