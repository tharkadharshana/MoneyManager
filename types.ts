// Domain Entities based on requirements

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CLEARED = 'CLEARED',
  RECONCILED = 'RECONCILED',
  DISPUTED = 'DISPUTED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  UPI = 'UPI',
  CHECK = 'CHECK',
  OTHER = 'OTHER'
}

export interface Merchant {
  id: string;
  name: string;
  normalizedName: string;
  logoUrl?: string;
  categorySuggestions?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
  isTaxRelevant?: boolean;
}

export interface Receipt {
  id: string;
  storageUrl: string;
  uploadedAt: string;
  ocrRawText?: string;
  ocrParsed?: Record<string, any>; // JSON extracted data
  thumbnailUrl?: string;
}

export interface TransactionItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  categoryId?: string;
}

export interface TransactionSplit {
  amount: number;
  categoryId: string;
  notes?: string;
}

export interface RecurringTemplate {
  id: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  amountApprox: number;
  merchantId?: string;
}

export interface Transaction {
  // Core Identifiers
  id: string;
  userId: string;
  accountId: string; // ref
  
  // Temporal & Monetary
  timestamp: number; // Unix timestamp
  date: string; // ISO Date for display
  amount: number; // Signed decimal (stored as number for UI, processed as Decimal)
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;

  // Description & Entities
  descriptionRaw: string;
  descriptionEnriched: string;
  merchantId?: string; // ref
  categoryId?: string; // ref
  
  // Classification
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  status: TransactionStatus;
  
  // Transfers
  transferPartnerId?: string; // self-ref
  
  // Recurring
  isRecurring: boolean;
  recurringTemplateId?: string; // ref
  
  // Metadata
  notes?: string;
  tags?: string[];
  location?: string; // GeoJSON or string
  
  // Splits & Items
  isSplit: boolean;
  splits: TransactionSplit[];
  items: TransactionItem[];
  
  // Evidence
  receipts: Receipt[];
  sources?: string[]; // "statement_2026-01", "receipt_...", "manual"
  
  // Audit & Tax
  originalData?: any; // JSON for audit
  reconciliationNotes?: string;
  taxAmount?: number;
  isTaxDeductible?: boolean;
  
  // System
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  isDeleted?: boolean;

  // Frontend helper
  matchScore?: number;
  matchDetails?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CREDIT' | 'DEBIT' | 'CASH' | 'INVESTMENT' | 'LOAN' | 'SAVINGS' | 'CURRENT';
  balance: number;
  currency: string;
  lastSynced: string;
  institution?: string;
  isActive?: boolean;
  dataSince?: string; // ISO Date string for tracking data duration
  defaultPdfPassword?: string; // Optional password for decrypting statements
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  topCategories: { name: string; amount: number }[];
  topMerchants: { name: string; amount: number }[];
  monthlySpending: { month: string; amount: number }[];
  lastUpdated: string;
}