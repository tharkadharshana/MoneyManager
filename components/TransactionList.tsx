import React, { useState } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { Card } from './ui/Card';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Receipt, Split, FileCheck } from 'lucide-react';
import { useData } from '../context/DataContext';

interface TransactionListProps {
  limit?: number;
  showFilters?: boolean;
  searchQuery?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ limit, showFilters, searchQuery = '' }) => {
  const { transactions } = useData();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXPENSE' | 'INCOME'>('ALL');

  // Helper to format currency
  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getFilteredTransactions = () => {
    let result = transactions;

    // 1. Apply Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(tx => 
        (tx.descriptionRaw && tx.descriptionRaw.toLowerCase().includes(lowerQuery)) ||
        (tx.descriptionEnriched && tx.descriptionEnriched.toLowerCase().includes(lowerQuery)) ||
        tx.amount.toString().includes(lowerQuery)
      );
    }

    // 2. Apply Category/Status Filter
    if (filter === 'PENDING') {
      result = result.filter(t => t.status === TransactionStatus.PENDING);
    } else if (filter === 'EXPENSE') {
      result = result.filter(t => t.type === TransactionType.EXPENSE);
    } else if (filter === 'INCOME') {
      result = result.filter(t => t.type === TransactionType.INCOME);
    }

    // 3. Apply Limit
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  };
  
  const displayTransactions = getFilteredTransactions();

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          {['ALL', 'PENDING', 'EXPENSE', 'INCOME'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {displayTransactions.length === 0 ? (
          <div className="text-center py-10 opacity-50">
             <p className="text-sm">No transactions found</p>
          </div>
      ) : (
          displayTransactions.map((tx) => {
            const isExpense = tx.type === TransactionType.EXPENSE;
            const category = tx.categoryId ? CATEGORIES.find(c => c.id === tx.categoryId) : null;
            
            // Smart Matching Visual Logic
            const isMatched = tx.status === TransactionStatus.RECONCILED || (tx.receipts && tx.receipts.length > 0);
            const needsReview = tx.status === TransactionStatus.PENDING;

            return (
              <Card key={tx.id} className="flex items-center justify-between group hover:bg-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {category ? (
                      <span className="text-lg capitalize">{category.name[0]}</span>
                    ) : (
                      isExpense ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-100 text-sm">
                      {tx.descriptionEnriched || tx.descriptionRaw}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      
                      {isMatched && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <FileCheck size={10} /> Receipt Linked
                        </span>
                      )}
                      
                      {needsReview && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <AlertCircle size={10} /> Review
                      </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`font-semibold text-sm ${
                    isExpense ? 'text-zinc-100' : 'text-emerald-500'
                  }`}>
                    {isExpense ? '' : '+'}{formatMoney(tx.amount, tx.currency)}
                  </span>
                </div>
              </Card>
            );
          })
      )}
    </div>
  );
};