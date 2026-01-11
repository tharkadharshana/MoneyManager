import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Transaction, Account } from '../types';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  loading: boolean;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  userId: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 1. Handle Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Attempt Anonymous Auth
        signInAnonymously(auth).catch((error) => {
          console.error("Authentication failed:", error);
          setLoading(false); 
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Logic (Only runs when user is authenticated)
  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setAccounts([]);
        // If we aren't waiting on auth, stop loading
        if (!auth.currentUser) setLoading(false); 
        return;
    }

    const userId = user.uid;
    // Changed from 'moneyApp' to 'users' as requested
    const userDocRef = doc(db, 'users', userId);
    
    let unsubscribeTransactions: () => void;
    let unsubscribeAccounts: () => void;

    const initializeListeners = async () => {
      setLoading(true);
      try {
        // Transactions Listener
        const qTx = query(collection(userDocRef, 'transactions'), orderBy('timestamp', 'desc'));
        unsubscribeTransactions = onSnapshot(qTx, (snapshot) => {
          const txData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];
          setTransactions(txData);
        }, (error) => {
             console.error("Transaction listener error:", error);
             setTransactions([]);
        });

        // Accounts Listener
        const qAcc = query(collection(userDocRef, 'accounts'));
        unsubscribeAccounts = onSnapshot(qAcc, (snapshot) => {
          const accData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Account[];
          setAccounts(accData);
        }, (error) => {
            console.error("Account listener error:", error);
            setAccounts([]);
        });

      } catch (error) {
        console.error("Error setting up listeners:", error);
        setTransactions([]);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    initializeListeners();

    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeAccounts) unsubscribeAccounts();
    };
  }, [user]);

  const addTransaction = async (tx: Transaction) => {
    if (!user) return;
    
    // Optimistic Update
    setTransactions(prev => [tx, ...prev]);

    try {
      const { id, ...data } = tx;
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update Account Balance
      if (data.accountId) {
        const acc = accounts.find(a => a.id === data.accountId);
        if (acc) {
           await updateAccount(acc.id, { 
             balance: acc.balance + data.amount 
           });
        }
      }

      await addDoc(collection(userDocRef, 'transactions'), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error adding transaction:", e);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', id);
      await updateDoc(txRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error updating transaction:", e);
    }
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await addDoc(collection(userDocRef, 'accounts'), {
        ...account,
        lastSynced: new Date().toISOString(),
        dataSince: new Date().toISOString(),
        isActive: true
      });
    } catch (e) {
      console.error("Error adding account:", e);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (!user) return;
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    try {
      const accRef = doc(db, 'users', user.uid, 'accounts', id);
      await updateDoc(accRef, {
        ...updates
      });
    } catch (e) {
      console.error("Error updating account:", e);
    }
  };

  return (
    <DataContext.Provider value={{ 
      transactions, 
      accounts, 
      loading, 
      addTransaction, 
      updateTransaction, 
      updateAccount,
      addAccount,
      userId: user ? user.uid : null
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};