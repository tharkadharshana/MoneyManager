import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Account, FinancialSummary, TransactionType } from '../types';
import { MOCK_TRANSACTIONS, MOCK_ACCOUNTS, CATEGORIES } from '../constants';
import { useAuth } from './AuthContext';
import { FirestoreService } from '../services/firestoreService';

interface WalletContextType {
  transactions: Transaction[];
  accounts: Account[];
  financialSummary: FinancialSummary | null;
  dataLoading: boolean;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  refreshFinancialSummary: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Load Data
  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setAccounts([]);
        setFinancialSummary(null);
        setDataLoading(false);
        return;
    }

    if (isDemoMode) {
        setTransactions(MOCK_TRANSACTIONS);
        setAccounts(MOCK_ACCOUNTS);
        // Mock summary generation
        setFinancialSummary({
            totalIncome: 3200,
            totalExpenses: 200,
            netWorth: 2120,
            topCategories: [{name: 'Food', amount: 50}, {name: 'Transport', amount: 30}],
            topMerchants: [{name: 'Starbucks', amount: 50}],
            monthlySpending: [],
            lastUpdated: new Date().toISOString()
        });
        setDataLoading(false);
        return;
    }

    setDataLoading(true);
    const unsubTx = FirestoreService.subscribeTransactions(user.uid, setTransactions, console.error);
    const unsubAcc = FirestoreService.subscribeAccounts(user.uid, setAccounts, console.error);
    
    // Load summary once on init
    FirestoreService.getFinancialSummary(user.uid).then((summary) => {
        if (summary) setFinancialSummary(summary);
    });

    return () => {
        unsubTx();
        unsubAcc();
    };
  }, [user, isDemoMode]);

  const addTransaction = async (tx: Transaction) => {
    if (isDemoMode) {
        setTransactions(prev => [tx, ...prev]);
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

  const refreshFinancialSummary = async () => {
    // 1. Calculate Stats Locally
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const netWorth = accounts.reduce((acc, a) => acc + a.balance, 0);

    // Top Categories
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        if(t.categoryId) catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + Math.abs(t.amount));
    });
    const topCategories = Array.from(catMap.entries())
        .map(([id, val]) => ({ name: CATEGORIES.find(c => c.id === id)?.name || 'Unknown', amount: val }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0, 5);

    // Top Merchants
    const merchMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
         const name = t.descriptionEnriched || t.descriptionRaw || 'Unknown';
         merchMap.set(name, (merchMap.get(name) || 0) + Math.abs(t.amount));
    });
    const topMerchants = Array.from(merchMap.entries())
        .map(([name, val]) => ({ name, amount: val }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0, 5);

    // Monthly Spending (Approx based on available transactions)
    const monthMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        const d = new Date(t.date);
        const k = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthMap.set(k, (monthMap.get(k) || 0) + Math.abs(t.amount));
    });
    const monthlySpending = Array.from(monthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .slice(0, 6); // Keep last 6 months

    const summary: FinancialSummary = {
        totalIncome: income,
        totalExpenses: expenses,
        netWorth,
        topCategories,
        topMerchants,
        monthlySpending,
        lastUpdated: new Date().toISOString()
    };

    // 2. Update State
    setFinancialSummary(summary);
    
    // 3. Persist to Firestore
    if (user && !isDemoMode) {
        await FirestoreService.saveFinancialSummary(user.uid, summary);
    }
  };

  return (
    <WalletContext.Provider value={{
      transactions,
      accounts,
      financialSummary,
      dataLoading,
      addTransaction,
      updateTransaction,
      addAccount,
      updateAccount,
      refreshFinancialSummary
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