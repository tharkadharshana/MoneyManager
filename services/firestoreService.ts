import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Account } from '../types';

export const FirestoreService = {
  // Transactions
  subscribeTransactions: (userId: string, callback: (txs: Transaction[]) => void, onError: (err: any) => void) => {
    const qTx = query(collection(doc(db, 'users', userId), 'transactions'), orderBy('timestamp', 'desc'));
    return onSnapshot(qTx, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      callback(txData);
    }, onError);
  },

  addTransaction: async (userId: string, tx: Transaction) => {
    const { id, ...data } = tx; // Remove local ID if letting Firestore gen it, or keep if manual
    // We strictly use the collection reference
    return await addDoc(collection(doc(db, 'users', userId), 'transactions'), {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  updateTransaction: async (userId: string, txId: string, updates: Partial<Transaction>) => {
    const txRef = doc(db, 'users', userId, 'transactions', txId);
    return await updateDoc(txRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // Accounts
  subscribeAccounts: (userId: string, callback: (accs: Account[]) => void, onError: (err: any) => void) => {
    const qAcc = query(collection(doc(db, 'users', userId), 'accounts'));
    return onSnapshot(qAcc, (snapshot) => {
      const accData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      callback(accData);
    }, onError);
  },

  addAccount: async (userId: string, account: Omit<Account, 'id'>) => {
    return await addDoc(collection(doc(db, 'users', userId), 'accounts'), {
      ...account,
      lastSynced: new Date().toISOString(),
      dataSince: new Date().toISOString(),
      isActive: true
    });
  },

  updateAccount: async (userId: string, accId: string, updates: Partial<Account>) => {
    const accRef = doc(db, 'users', userId, 'accounts', accId);
    return await updateDoc(accRef, updates);
  }
};