import { db } from '../firebase';
import { Transaction, Account, FinancialSummary, CategoryRule, UserSettings } from '../types';

export const FirestoreService = {
  // Transactions
  subscribeTransactions: (userId: string, callback: (txs: Transaction[]) => void, onError: (err: any) => void) => {
    const qTx = db.collection('users').doc(userId).collection('transactions').orderBy('timestamp', 'desc');
    return qTx.onSnapshot((snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      callback(txData);
    }, onError);
  },

  addTransaction: async (userId: string, tx: Transaction) => {
    const { id, ...data } = tx;
    return await db.collection('users').doc(userId).collection('transactions').add({
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  updateTransaction: async (userId: string, txId: string, updates: Partial<Transaction>) => {
    return await db.collection('users').doc(userId).collection('transactions').doc(txId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // Accounts
  subscribeAccounts: (userId: string, callback: (accs: Account[]) => void, onError: (err: any) => void) => {
    const qAcc = db.collection('users').doc(userId).collection('accounts');
    return qAcc.onSnapshot((snapshot) => {
      const accData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      callback(accData);
    }, onError);
  },

  addAccount: async (userId: string, account: Omit<Account, 'id'>) => {
    return await db.collection('users').doc(userId).collection('accounts').add({
      ...account,
      lastSynced: new Date().toISOString(),
      dataSince: new Date().toISOString(),
      isActive: true
    });
  },

  updateAccount: async (userId: string, accId: string, updates: Partial<Account>) => {
    return await db.collection('users').doc(userId).collection('accounts').doc(accId).update(updates);
  },

  deleteAccount: async (userId: string, accId: string) => {
    return await db.collection('users').doc(userId).collection('accounts').doc(accId).delete();
  },

  // Financial Summary
  getFinancialSummary: async (userId: string): Promise<FinancialSummary | null> => {
    try {
      const docRef = db.collection('users').doc(userId).collection('summary').doc('overview');
      const snap = await docRef.get();
      return snap.exists ? (snap.data() as FinancialSummary) : null;
    } catch (e) {
      console.error("Error fetching summary:", e);
      return null;
    }
  },

  saveFinancialSummary: async (userId: string, summary: FinancialSummary) => {
    try {
      const docRef = db.collection('users').doc(userId).collection('summary').doc('overview');
      await docRef.set(summary, { merge: true });
    } catch (e) {
      console.error("Error saving summary:", e);
    }
  },

  // Categorization Rules
  getCategoryRules: async (userId: string): Promise<CategoryRule[]> => {
    try {
        const docRef = db.collection('users').doc(userId).collection('settings').doc('rules');
        const snap = await docRef.get();
        if (snap.exists && snap.data()?.rules) {
            return snap.data()?.rules as CategoryRule[];
        }
        return [];
    } catch (e) {
        console.error("Error getting rules:", e);
        return [];
    }
  },

  saveCategoryRules: async (userId: string, rules: CategoryRule[]) => {
      try {
          const docRef = db.collection('users').doc(userId).collection('settings').doc('rules');
          await docRef.set({ rules }, { merge: true });
      } catch (e) {
          console.error("Error saving rules:", e);
      }
  },

  // User Settings
  getUserSettings: async (userId: string): Promise<UserSettings | null> => {
    try {
      const docRef = db.collection('users').doc(userId).collection('settings').doc('preferences');
      const snap = await docRef.get();
      return snap.exists ? (snap.data() as UserSettings) : null;
    } catch (e) {
      console.error("Error fetching settings:", e);
      return null;
    }
  },

  saveUserSettings: async (userId: string, settings: UserSettings) => {
    try {
      const docRef = db.collection('users').doc(userId).collection('settings').doc('preferences');
      await docRef.set(settings, { merge: true });
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  }
};