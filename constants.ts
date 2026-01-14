import { Category, Account, Transaction, TransactionType, TransactionStatus, CategoryRule } from './types';

export const CURRENT_USER_ID = 'user_123';

// System Categories (Expanded to match common bank statement rules)
export const CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Food & Drink', color: '#f59e0b', icon: 'coffee' }, // Dining, Restaurants
  { id: 'cat_2', name: 'Transport', color: '#3b82f6', icon: 'car' }, // Ride Hailing, Fuel
  { id: 'cat_3', name: 'Shopping', color: '#ec4899', icon: 'shopping-bag' }, 
  { id: 'cat_4', name: 'Salary', color: '#10b981', icon: 'banknote' }, // Income
  { id: 'cat_5', name: 'Utilities', color: '#6366f1', icon: 'zap' }, // Mobile Bill, Internet
  { id: 'cat_6', name: 'Entertainment', color: '#8b5cf6', icon: 'film' },
  { id: 'cat_7', name: 'Health', color: '#ef4444', icon: 'activity' }, // Medical
  { id: 'cat_8', name: 'Housing', color: '#14b8a6', icon: 'home' }, // Rent
  { id: 'cat_9', name: 'Groceries', color: '#84cc16', icon: 'shopping-cart' },
  { id: 'cat_10', name: 'Bank Fees', color: '#64748b', icon: 'receipt' },
  { id: 'cat_11', name: 'Loans', color: '#f97316', icon: 'credit-card' },
  { id: 'cat_12', name: 'Transfers', color: '#06b6d4', icon: 'refresh-cw' },
];

// Default Rules to seed into Firestore for new users
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
    { pattern: "Annual Fee", category: "Bank Fees", company: "Bank" },
    { pattern: "ATMCASH", category: "Transfers", company: "Bank" },
    { pattern: "Cash Advance", category: "Bank Fees", company: "Bank" },
    { pattern: "WEPAY TOPUP", category: "Transfers", company: "WePay" },
    { pattern: "CONVERT TO CIP", category: "Loans", company: "Bank" },
    { pattern: "LATE PAYMENT FEE", category: "Bank Fees", company: "Bank" },
    { pattern: "Processing Fee", category: "Bank Fees", company: "Bank" },
    { pattern: "Installment", category: "Loans", company: "Bank" },
    { pattern: "PickMe", category: "Transport", company: "PickMe" },
    { pattern: "UBER", category: "Transport", company: "Uber" },
    { pattern: "FUTURE GEN", category: "Shopping", company: "Future Gen" },
    { pattern: "CEFT CARD", category: "Transfers", company: "Bank" },
    { pattern: "INTEREST CHARGE", category: "Bank Fees", company: "Bank" },
    { pattern: "Dialog", category: "Utilities", company: "Dialog" },
    { pattern: "AIRTEL", category: "Utilities", company: "Airtel" },
    { pattern: "Salary", category: "Salary", company: "Employer" },
    { pattern: "SPAR", category: "Groceries", company: "SPAR" },
    { pattern: "KEELLS", category: "Groceries", company: "Keells" },
    { pattern: "GREEN BLOOM", category: "Shopping", company: "Green Bloom" },
    { pattern: "C/Card Payment", category: "Transfers", company: "Bank" },
    { pattern: "RESTAURANT", category: "Food & Drink", company: "Restaurant" },
    { pattern: "TRADERS", category: "Shopping", company: "Traders" },
    { pattern: "HUTCHISON", category: "Utilities", company: "Hutch" },
    { pattern: "PUSSELLA MEAT", category: "Groceries", company: "Pussella" },
    { pattern: "student loan", category: "Loans", company: "Loan Provider" },
    { pattern: "dfcc", category: "Transfers", company: "DFCC" },
    { pattern: "hnb", category: "Transfers", company: "HNB" },
    { pattern: "KOKO", category: "Food & Drink", company: "Koko" },
    { pattern: "rent for", category: "Housing", company: "Landlord" },
    { pattern: "Google CLOUD", category: "Utilities", company: "Google" },
    { pattern: "loan on card", category: "Loans", company: "Bank" },
    { pattern: "ARCADIA", category: "Entertainment", company: "Arcadia" },
    { pattern: "MOVIE WORKS", category: "Entertainment", company: "Movie Works" },
    { pattern: "EMPIRE CARPETS", category: "Shopping", company: "Empire" },
    { pattern: "RED LANTERN", category: "Food & Drink", company: "Red Lantern" },
    { pattern: "LADY J", category: "Shopping", company: "Lady J" },
    { pattern: "APPLE.COM", category: "Entertainment", company: "Apple" },
    { pattern: "DEPARTMENT OF IMMIGRATION", category: "Bank Fees", company: "Gov" },
    { pattern: "MEDICAL", category: "Health", company: "Medical" },
    { pattern: "DARAZ", category: "Shopping", company: "Daraz" },
    { pattern: "WATERS EDGE", category: "Food & Drink", company: "Waters Edge" },
    { pattern: "STUDIO UDAYA", category: "Shopping", company: "Studio Udaya" }
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