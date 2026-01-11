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
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { Transaction, Account } from '../types';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from '../constants';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  loading: boolean;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | null;
  user: User | null;
  isDemoMode: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | any | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. Handle Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Real User Logged In
        setUser(currentUser);
        setIsDemoMode(false);
      } else if (!isDemoMode) {
        // No user and not in demo mode
        setUser(null);
        setTransactions([]);
        setAccounts([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  // 2. Auth Actions
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Google Sign In Error:", error);
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Login Error:", error);
      setLoading(false);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Signup Error:", error);
      setLoading(false);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    // Simulate a network delay for better UX
    setTimeout(() => {
        setIsDemoMode(true);
        // Create a fake user object for the app to function
        setUser({ 
            uid: 'guest_demo', 
            displayName: 'Guest User', 
            email: null, 
            photoURL: null 
        });
        
        // Load Mock Data
        setTransactions(MOCK_TRANSACTIONS);
        setAccounts(MOCK_ACCOUNTS);
        
        setLoading(false);
    }, 600);
  };

  const logout = async () => {
    try {
      if (isDemoMode) {
          setIsDemoMode(false);
          setUser(null);
          setTransactions([]);
          setAccounts([]);
      } else {
          await signOut(auth);
      }
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  // 3. Data Logic 
  useEffect(() => {
    // If we are in demo mode or no user, do not setup Firestore listeners
    if (!user || isDemoMode) return;

    const userId = user.uid;
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
        });

      } catch (error) {
        console.error("Error setting up listeners:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeListeners();

    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeAccounts) unsubscribeAccounts();
    };
  }, [user, isDemoMode]);

  // --- CRUD OPERATIONS (Handle Both Real & Mock) ---

  const addTransaction = async (tx: Transaction) => {
    // 1. Update Local State (Optimistic or Demo)
    setTransactions(prev => [tx, ...prev]);
    
    // Update local account balance
    if (tx.accountId) {
        const acc = accounts.find(a => a.id === tx.accountId);
        if (acc) {
            const newBalance = acc.balance + tx.amount;
            // Update local account state immediately
            setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balance: newBalance } : a));
            
            // If in demo mode, stop here (we updated state above)
            if (isDemoMode) return;

            // If real, sync account update to Firestore
            try {
                await updateDoc(doc(db, 'users', user.uid, 'accounts', acc.id), { balance: newBalance });
            } catch(e) { console.error(e); }
        }
    }

    if (isDemoMode) return;

    // 2. Update Firestore (Real)
    if (!user) return;
    try {
      const { id, ...data } = tx;
      const userDocRef = doc(db, 'users', user.uid);
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
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (isDemoMode || !user) return;

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
    // Generate a temporary ID for local state
    const tempId = `acc_${Date.now()}`;
    const newAccount = { id: tempId, ...account };
    
    setAccounts(prev => [...prev, newAccount]);

    if (isDemoMode || !user) return;

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
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    if (isDemoMode || !user) return;

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
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      loginAsGuest,
      logout,
      userId: user ? user.uid : null,
      user,
      isDemoMode
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