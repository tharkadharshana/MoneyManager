import { Transaction, CategoryRule } from '../types';
import { normalizeString } from './stringUtils';
import { CATEGORIES } from '../constants';

// Basic fallback rules if no custom rules are provided
const FALLBACK_RULES: CategoryRule[] = [
  { pattern: 'STARBUCKS', category: 'Food & Drink' },
  { pattern: 'UBER', category: 'Transport' },
  { pattern: 'AMAZON', category: 'Shopping' },
  { pattern: 'PAYROLL', category: 'Salary' },
];

export function autoCategorize(text: string, history: Transaction[] = [], customRules: CategoryRule[] = []): { categoryId: string | null; confidence: number; method: 'HISTORY' | 'RULE' | 'ML' } {
  const normalizedText = normalizeString(text);
  
  // 1. Custom Rule-Based Engine (Highest Priority)
  // Check user-defined rules first
  const rulesToUse = customRules.length > 0 ? customRules : FALLBACK_RULES;
  
  for (const rule of rulesToUse) {
      // Simple substring match (case-insensitive due to normalization logic inside loop or regex)
      // Since rules might be case sensitive in user input, let's normalize rule pattern too
      const normalizedPattern = normalizeString(rule.pattern);
      
      if (normalizedText.includes(normalizedPattern) || normalizedPattern.includes(normalizedText)) {
          // Map rule category string (e.g. "Bank Fee") to internal ID (e.g. "cat_10")
          const categoryId = mapCategoryNameToId(rule.category);
          if (categoryId) {
              return { categoryId, confidence: 0.95, method: 'RULE' };
          }
      }
  }

  // 2. History-Based Learning (Medium Priority)
  if (history.length > 0) {
      const matches = history.filter(tx => {
          const txDesc = normalizeString(tx.descriptionEnriched || tx.descriptionRaw);
          return txDesc.includes(normalizedText) || normalizedText.includes(txDesc) || txDesc === normalizedText;
      });

      if (matches.length > 0) {
          const catCounts: Record<string, number> = {};
          matches.forEach(m => {
              if (m.categoryId) {
                  catCounts[m.categoryId] = (catCounts[m.categoryId] || 0) + 1;
              }
          });

          let bestCat = null;
          let maxCount = 0;
          for (const [catId, count] of Object.entries(catCounts)) {
              if (count > maxCount) {
                  maxCount = count;
                  bestCat = catId;
              }
          }

          if (bestCat) {
              return { categoryId: bestCat, confidence: 0.85, method: 'HISTORY' };
          }
      }
  }

  return { categoryId: null, confidence: 0, method: 'ML' };
}

// Helper to find ID from Name
function mapCategoryNameToId(name: string): string | null {
    // 1. Exact Match
    const exact = CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exact) return exact.id;

    // 2. Partial Match (e.g. "Dining" -> "Food & Drink")
    // This simple map handles common variations found in the provided rules JSON
    const MAPPINGS: Record<string, string> = {
        'Dining': 'Food & Drink',
        'Restaurant': 'Food & Drink',
        'Food Delivery': 'Food & Drink',
        'Wallet Topup': 'Transfers',
        'Fund Transfer': 'Transfers',
        'Cash Settlement': 'Transfers',
        'Transfer': 'Transfers',
        'Cash Withdrawal': 'Transfers',
        'Mobile Utility Bill': 'Utilities',
        'Telecom': 'Utilities',
        'Internet': 'Utilities',
        'Online Shopping': 'Shopping',
        'Ride Hailing': 'Transport',
        'Ride Hailing Reversal': 'Transport',
        'Loan Payment': 'Loans',
        'Installment Payment': 'Loans',
        'Loan': 'Loans',
        'Loan Conversion': 'Loans',
        'Bank Fee': 'Bank Fees',
        'Interest Charge': 'Bank Fees',
        'Medical': 'Health',
        'Grocery': 'Groceries',
        'Payment': 'Shopping', // Fallback for generic
        'Personal Expense': 'Shopping', // Fallback
        'Personal Payment': 'Shopping',
        'Miscellaneous Payment': 'Shopping',
        'Government Service': 'Bank Fees', // Or Fees
        'Art/Photography': 'Shopping',
        'Hospitality': 'Food & Drink',
        'Subscription': 'Entertainment'
    };

    const mappedName = MAPPINGS[name] || name;
    const mappedCat = CATEGORIES.find(c => c.name.toLowerCase() === mappedName.toLowerCase());
    
    return mappedCat ? mappedCat.id : null;
}