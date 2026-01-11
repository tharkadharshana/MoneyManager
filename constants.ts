import { Category } from './types';

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
