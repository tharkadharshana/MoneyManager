import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Account, FinancialSummary, TransactionType, TransactionStatus, CategoryRule, UserSettings } from '../types';
import { MOCK_TRANSACTIONS, MOCK_ACCOUNTS, CATEGORIES, DEFAULT_CATEGORY_RULES } from '../constants';
import { useAuth } from './AuthContext';
import { FirestoreService } from '../services/firestoreService';

interface WalletContextType {
  transactions: Transaction[];
  accounts: Account[];
  financialSummary: FinancialSummary | null;
  categoryRules: CategoryRule[];
  settings: UserSettings;
  dataLoading: boolean;
  error: string | null;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refreshFinancialSummary: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ currency: 'USD' });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setAccounts([]);
        setFinancialSummary(null);
        setCategoryRules([]);
        setSettings({ currency: 'USD' });
        setDataLoading(false);
        return;
    }

    if (isDemoMode) {
        setTransactions(MOCK_TRANSACTIONS);
        setAccounts(MOCK_ACCOUNTS);
        setCategoryRules(DEFAULT_CATEGORY_RULES);
        setSettings({ currency: 'USD' });
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
    setError(null);

    const unsubTx = FirestoreService.subscribeTransactions(
        user.uid, 
        setTransactions, 
        (err) => {
            console.error("Tx Subscribe Error:", err);
            if (err.code === 'permission-denied') {
                setError("Permission denied. Check Firestore Rules in Firebase Console.");
            }
        }
    );

    const unsubAcc = FirestoreService.subscribeAccounts(
        user.uid, 
        setAccounts, 
        (err) => {
            console.error("Acc Subscribe Error:", err);
            if (err.code === 'permission-denied') {
                setError("Permission denied. Check Firestore Rules in Firebase Console.");
            }
        }
    );
    
    // Load summary once on init
    FirestoreService.getFinancialSummary(user.uid).then((summary) => {
        if (summary) setFinancialSummary(summary);
    }).catch(err => console.error(err));

    // Load Rules
    FirestoreService.getCategoryRules(user.uid).then(async (rules) => {
        if (rules.length > 0) {
            setCategoryRules(rules);
        } else {
            // Seed default rules if none exist
            await FirestoreService.saveCategoryRules(user.uid, DEFAULT_CATEGORY_RULES);
            setCategoryRules(DEFAULT_CATEGORY_RULES);
        }
    });

    // Load Settings
    FirestoreService.getUserSettings(user.uid).then((s) => {
        if (s) setSettings(s);
    }).catch(err => console.error(err));

    return () => {
        unsubTx();
        unsubAcc();
    };
  }, [user, isDemoMode]);

  const addTransaction = async (tx: Transaction) => {
    try {
        if (isDemoMode) {
            setTransactions(prev => [tx, ...prev]);
            if (tx.accountId) {
                setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a));
            }
            return;
        }
        if (user) await FirestoreService.addTransaction(user.uid, tx);
    } catch (e: any) {
        console.error("Add Transaction Error:", e);
        setError(e.message);
        throw e;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
        if (isDemoMode) {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            return;
        }
        if (user) await FirestoreService.updateTransaction(user.uid, id, updates);
    } catch (e: any) {
        console.error("Update Transaction Error:", e);
        setError(e.message);
        throw e;
    }
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    try {
        if (isDemoMode) {
            const newAcc = { id: `acc_${Date.now()}`, ...account };
            setAccounts(prev => [...prev, newAcc]);
            // In demo mode, we also simulate the initial transaction
            if (account.balance !== 0) {
                const initTx: Transaction = {
                    id: `tx_init_${Date.now()}`,
                    userId: 'guest',
                    accountId: newAcc.id,
                    timestamp: Date.now(),
                    date: new Date().toISOString(),
                    amount: account.balance,
                    currency: account.currency,
                    descriptionRaw: 'Initial Balance',
                    descriptionEnriched: 'Opening Balance',
                    type: account.balance > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    status: TransactionStatus.CLEARED,
                    isRecurring: false,
                    isSplit: false,
                    splits: [],
                    items: [],
                    receipts: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setTransactions(prev => [initTx, ...prev]);
            }
            return;
        }
        
        if (user) {
            const docRef = await FirestoreService.addAccount(user.uid, account);
            
            // Logic: If there is a starting balance, create a corresponding transaction
            // so the history matches the account total.
            if (account.balance !== 0) {
                const initTx: Transaction = {
                    id: `temp_${Date.now()}`, // ID will be auto-gen by firestore add
                    userId: user.uid,
                    accountId: docRef.id,
                    timestamp: Date.now(),
                    date: new Date().toISOString(),
                    amount: account.balance,
                    currency: account.currency,
                    descriptionRaw: 'Initial Balance',
                    descriptionEnriched: 'Opening Balance',
                    type: TransactionType.ADJUSTMENT, // Use Adjustment for opening balances
                    status: TransactionStatus.CLEARED,
                    isRecurring: false,
                    isSplit: false,
                    splits: [],
                    items: [],
                    receipts: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await FirestoreService.addTransaction(user.uid, initTx);
            }
        }
    } catch (e: any) {
        console.error("Add Account Error:", e);
        if (e.code === 'permission-denied') {
            setError("Permission denied. Please ensure your Firestore Rules allow writes to /users/{userId}/accounts.");
        } else {
            setError(e.message);
        }
        throw e;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
        if (isDemoMode) {
            setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
            return;
        }
        if (user) await FirestoreService.updateAccount(user.uid, id, updates);
    } catch (e: any) {
        console.error("Update Account Error:", e);
        setError(e.message);
        throw e;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
        if (isDemoMode) {
            setAccounts(prev => prev.filter(a => a.id !== id));
            // Also cleanup transactions for this account in demo
            setTransactions(prev => prev.filter(t => t.accountId !== id));
            return;
        }
        if (user) {
            await FirestoreService.deleteAccount(user.uid, id);
            // Note: In a real production app, we should probably batch delete transactions associated with this account.
            // For now, we leave them or filter them out in UI.
        }
    } catch (e: any) {
        console.error("Delete Account Error:", e);
        setError(e.message);
        throw e;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      if (user && !isDemoMode) {
          await FirestoreService.saveUserSettings(user.uid, updated);
      }
  };

  const refreshFinancialSummary = async () => {
    try {
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
    } catch (e: any) {
        console.error("Summary Refresh Error:", e);
    }
  };

  return (
    <WalletContext.Provider value={{
      transactions,
      accounts,
      financialSummary,
      categoryRules,
      settings,
      dataLoading,
      error,
      addTransaction,
      updateTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      refreshFinancialSummary,
      updateSettings,
      clearError: () => setError(null)
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