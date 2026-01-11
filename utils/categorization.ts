import { Transaction } from '../types';
import { normalizeString } from './stringUtils';

interface CategoryRule {
  keywords: string[];
  merchantPatterns: RegExp[];
  categoryId: string;
  priority: number;
}

// 100+ Rules would reside here in a full DB, this is a simulated Rules Engine
const RULES: CategoryRule[] = [
  {
    keywords: ['STARBUCKS', 'COFFEE', 'CAFE', 'BAKERY'],
    merchantPatterns: [/STARBUCKS/i, /DUNKIN/i],
    categoryId: 'cat_1', // Food & Drink
    priority: 10,
  },
  {
    keywords: ['UBER', 'LYFT', 'TAXI', 'SHELL', 'FUEL', 'GAS'],
    merchantPatterns: [/UBER/i, /LYFT/i, /TRIP/i],
    categoryId: 'cat_2', // Transport
    priority: 10,
  },
  {
    keywords: ['WHOLE FOODS', 'TRADER JOES', 'MARKET', 'GROCERY'],
    merchantPatterns: [/WHOLEFDS/i, /MARKET/i],
    categoryId: 'cat_3', // Shopping/Groceries
    priority: 10,
  },
  {
    keywords: ['PAYROLL', 'SALARY', 'GUSTO', 'ADP'],
    merchantPatterns: [/DIRECT DEP/i],
    categoryId: 'cat_4', // Salary
    priority: 20,
  },
  {
    keywords: ['ELECTRIC', 'WATER', 'POWER', 'INTERNET', 'ATT', 'VERIZON'],
    merchantPatterns: [/UTIL/i],
    categoryId: 'cat_5', // Utilities
    priority: 10,
  }
];

export function autoCategorize(text: string): { categoryId: string | null; confidence: number; method: 'RULE' | 'ML' } {
  const normalizedText = normalizeString(text);
  
  // 1. Rule-Based Engine
  // Sort rules by priority (high priority first)
  const matchedRule = RULES.sort((a, b) => b.priority - a.priority).find(rule => 
    rule.keywords.some(k => normalizedText.includes(k)) || 
    rule.merchantPatterns.some(p => p.test(normalizedText))
  );

  if (matchedRule) {
    return { categoryId: matchedRule.categoryId, confidence: 1.0, method: 'RULE' };
  }

  // 2. Probabilistic Fallback (Stub for Naive Bayes)
  // In a real backend, this would query a trained Bayes classifier based on user history.
  // P(Category | Words) ~ P(Words | Category) * P(Category)
  
  return { categoryId: null, confidence: 0, method: 'ML' };
}