import React from 'react';
import { TransactionList } from './TransactionList';
import { Card } from './ui/Card';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, AlertCircle, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { TransactionType, TransactionStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { accounts, transactions, loading } = useData();
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  // Empty State Check
  if (!loading && transactions.length === 0 && accounts.length === 0) {
      return (
        <div className="p-6 h-screen flex flex-col items-center justify-center pb-24 text-center">
             <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
                 <Plus size={40} className="text-primary" />
             </div>
             <h1 className="text-2xl font-bold text-white mb-2">Welcome to Flow</h1>
             <p className="text-zinc-400 text-sm max-w-xs mb-8">
                 Your dashboard is looking a little empty. Add your first account or transaction to see your financial analytics.
             </p>
             <div className="flex flex-col gap-3 w-full max-w-xs">
                 <button className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors">
                     Scan Receipt
                 </button>
                 <button className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors">
                     Add Manually
                 </button>
             </div>
        </div>
      );
  }

  // Calculate stats dynamically
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
    
  const expenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const totalFlow = income + expenses;
  const expensePct = totalFlow > 0 ? (expenses / totalFlow) * 100 : 0;
  const incomePct = totalFlow > 0 ? (income / totalFlow) * 100 : 0;

  // Dynamic Insights Calculation
  const pendingCount = transactions.filter(t => t.status === TransactionStatus.PENDING).length;
  const recentlyMatched = transactions.filter(t => t.receipts && t.receipts.length > 0 && t.status !== TransactionStatus.PENDING).length;
  const showInsights = pendingCount > 0 || recentlyMatched > 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Good Morning</h1>
          <p className="text-zinc-400 text-sm">Here's your financial overview</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500" />
      </div>

      {/* Net Worth Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-zinc-400 text-sm font-medium mb-1">Total Net Worth</p>
          <h2 className="text-4xl font-bold text-white mb-4">
            {loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
          </h2>
          
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-400">Spent</span>
                <div className="flex items-center gap-1.5 text-red-500">
                  <ArrowUpRight size={14} />
                  <span className="font-bold text-sm">${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs font-medium text-zinc-400">Income</span>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <span className="font-bold text-sm">${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <ArrowDownLeft size={14} />
                </div>
              </div>
            </div>

            <div className="h-2.5 w-full bg-zinc-950/50 rounded-full overflow-hidden flex">
               {totalFlow > 0 ? (
                 <>
                   <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${expensePct}%` }} />
                   <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${incomePct}%` }} />
                 </>
               ) : (
                  <div className="h-full w-full bg-zinc-800/50" />
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Insights - Only show if there is relevant data */}
      {showInsights && (
        <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-100 font-medium text-sm">Updates</h3>
              <p className="text-blue-200/60 text-xs mt-1">
                {pendingCount > 0 
                  ? `${pendingCount} transaction${pendingCount > 1 ? 's' : ''} need${pendingCount === 1 ? 's' : ''} review. ` 
                  : 'All transactions reviewed. '}
                {recentlyMatched > 0 && `Matched ${recentlyMatched} recent receipt${recentlyMatched > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          {transactions.length > 0 && (
            <button className="text-primary text-sm font-medium">See All</button>
          )}
        </div>
        <TransactionList limit={5} />
      </div>
    </div>
  );
};