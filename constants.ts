import { Category, Account, Transaction, TransactionType, TransactionStatus } from './types';

export const CURRENT_USER_ID = 'user_123';

// System Categories (Configuration, not fake user data)
export const CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Food & Drink', color: '#f59e0b', icon: 'coffee' },
  { id: 'cat_2', name: 'Transport', color: '#3b82f6', icon: 'car' },
  { id: 'cat_3', name: 'Shopping', color: '#ec4899', icon: 'shopping-bag' },
  { id: 'cat_4', name: 'Salary', color: '#10b981', icon: 'banknote' },
  { id: 'cat_5', name: 'Utilities', color: '#6366f1', icon: 'zap' },
  { id: 'cat_6', name: 'Entertainment', color: '#8b5cf6', icon: 'film' },
  { id: 'cat_7', name: 'Health', color: '#ef4444', icon: 'activity' },
  { id: 'cat_8', name: 'Housing', color: '#14b8a6', icon: 'home' },
];

// --- MOCK DATA FOR GUEST MODE ---

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'Chase Checking',
    type: 'DEBIT',
    balance: 2450.00,
    currency: 'USD',
    lastSynced: new Date().toISOString(),
    dataSince: '2023-01-01',
    isActive: true
  },
  {
    id: 'acc_2',
    name: 'Amex Gold',
    type: 'CREDIT',
    balance: -450.20,
    currency: 'USD',
    lastSynced: new Date().toISOString(),
    dataSince: '2023-03-15',
    isActive: true
  },
  {
    id: 'acc_3',
    name: 'Cash Wallet',
    type: 'CASH',
    balance: 120.00,
    currency: 'USD',
    lastSynced: new Date().toISOString(),
    dataSince: '2023-01-01',
    isActive: true
  }
];

const now = new Date();
const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2);
const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
const lastMonth = new Date(now); lastMonth.setDate(now.getDate() - 25);

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    userId: 'guest',
    accountId: 'acc_1',
    timestamp: now.getTime(),
    date: now.toISOString(),
    amount: -5.40,
    currency: 'USD',
    descriptionRaw: 'STARBUCKS STORE 2301',
    descriptionEnriched: 'Starbucks',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CLEARED,
    categoryId: 'cat_1',
    isRecurring: false,
    isSplit: false,
    splits: [],
    items: [],
    receipts: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  {
    id: 'tx_2',
    userId: 'guest',
    accountId: 'acc_1',
    timestamp: yesterday.getTime(),
    date: yesterday.toISOString(),
    amount: -24.50,
    currency: 'USD',
    descriptionRaw: 'UBER TRIP 8291',
    descriptionEnriched: 'Uber',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CLEARED,
    categoryId: 'cat_2',
    isRecurring: false,
    isSplit: false,
    splits: [],
    items: [],
    receipts: [],
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString()
  },
  {
    id: 'tx_3',
    userId: 'guest',
    accountId: 'acc_2',
    timestamp: twoDaysAgo.getTime(),
    date: twoDaysAgo.toISOString(),
    amount: -129.99,
    currency: 'USD',
    descriptionRaw: 'AMZN Mktp US',
    descriptionEnriched: 'Amazon',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CLEARED,
    categoryId: 'cat_3',
    isRecurring: false,
    isSplit: false,
    splits: [],
    items: [],
    receipts: [],
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: twoDaysAgo.toISOString()
  },
  {
    id: 'tx_4',
    userId: 'guest',
    accountId: 'acc_1',
    timestamp: lastWeek.getTime(),
    date: lastWeek.toISOString(),
    amount: 3200.00,
    currency: 'USD',
    descriptionRaw: 'GUSTO PAYROLL',
    descriptionEnriched: 'Salary - Tech Corp',
    type: TransactionType.INCOME,
    status: TransactionStatus.CLEARED,
    categoryId: 'cat_4',
    isRecurring: true,
    isSplit: false,
    splits: [],
    items: [],
    receipts: [],
    createdAt: lastWeek.toISOString(),
    updatedAt: lastWeek.toISOString()
  },
  {
    id: 'tx_5',
    userId: 'guest',
    accountId: 'acc_2',
    timestamp: lastMonth.getTime(),
    date: lastMonth.toISOString(),
    amount: -45.00,
    currency: 'USD',
    descriptionRaw: 'SHELL OIL 123',
    descriptionEnriched: 'Shell Station',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CLEARED,
    categoryId: 'cat_2',
    isRecurring: false,
    isSplit: false,
    splits: [],
    items: [],
    receipts: [],
    createdAt: lastMonth.toISOString(),
    updatedAt: lastMonth.toISOString()
  }
];