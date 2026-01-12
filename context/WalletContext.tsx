import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Account } from '../types';
import { MOCK_TRANSACTIONS, MOCK_ACCOUNTS } from '../constants';
import { useAuth } from './AuthContext';
import { FirestoreService } from '../services/firestoreService';

interface WalletContextType {
  transactions: Transaction[];
  accounts: Account[];
  dataLoading: boolean;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load Data
  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setAccounts([]);
        setDataLoading(false);
        return;
    }

    if (isDemoMode) {
        setTransactions(MOCK_TRANSACTIONS);
        setAccounts(MOCK_ACCOUNTS);
        setDataLoading(false);
        return;
    }

    setDataLoading(true);
    const unsubTx = FirestoreService.subscribeTransactions(user.uid, setTransactions, console.error);
    const unsubAcc = FirestoreService.subscribeAccounts(user.uid, setAccounts, console.error);

    return () => {
        unsubTx();
        unsubAcc();
    };
  }, [user, isDemoMode]);

  const addTransaction = async (tx: Transaction) => {
    if (isDemoMode) {
        setTransactions(prev => [tx, ...prev]);
        // Update mock balance
        if (tx.accountId) {
             setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a));
        }
        return;
    }
    if (user) await FirestoreService.addTransaction(user.uid, tx);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (isDemoMode) {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        return;
    }
    if (user) await FirestoreService.updateTransaction(user.uid, id, updates);
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    if (isDemoMode) {
        const newAcc = { id: `acc_${Date.now()}`, ...account };
        setAccounts(prev => [...prev, newAcc]);
        return;
    }
    if (user) await FirestoreService.addAccount(user.uid, account);
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (isDemoMode) {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        return;
    }
    if (user) await FirestoreService.updateAccount(user.uid, id, updates);
  };

  return (
    <WalletContext.Provider value={{
      transactions,
      accounts,
      dataLoading,
      addTransaction,
      updateTransaction,
      addAccount,
      updateAccount
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};