import React, { useState, useRef } from 'react';
import { TransactionList } from './TransactionList';
import { Card } from './ui/Card';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet, Building2, CreditCard, DollarSign, Plus, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { TransactionType, TransactionStatus } from '../types';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { accounts, transactions, loading } = useData();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to calculate stats for Global or Per-Account
  const calculateStats = (accountId?: string) => {
    const targetTxs = accountId 
      ? transactions.filter(t => t.accountId === accountId)
      : transactions;

    const income = targetTxs
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const expenses = targetTxs
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const totalFlow = income + expenses;
    const expensePct = totalFlow > 0 ? (expenses / totalFlow) * 100 : 0;
    const incomePct = totalFlow > 0 ? (income / totalFlow) * 100 : 0;

    return { income, expenses, expensePct, incomePct };
  };

  const globalStats = calculateStats();
  const totalNetWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  // Handle Scroll for Dots
  const handleScroll = () => {
      if (scrollRef.current) {
          const container = scrollRef.current;
          // Card width is 85vw + 1rem gap approx. 
          // Simple logic: scrollLeft / (window.innerWidth * 0.85)
          const cardWidth = window.innerWidth * 0.85;
          const index = Math.round(container.scrollLeft / cardWidth);
          setActiveIndex(index);
      }
  };

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

  // Render Card Helper
  const renderStatsCard = (title: string, balance: number, stats: any, type: string = 'TOTAL', subtitle?: string) => {
    let bgClass = "bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700";
    let icon = <Wallet size={18} className="text-zinc-400" />;
    
    if (type === 'CREDIT') {
        bgClass = "bg-gradient-to-br from-[#1a1025] to-zinc-900 border-purple-900/50";
        icon = <CreditCard size={18} className="text-purple-400" />;
    } else if (type === 'DEBIT') {
        bgClass = "bg-gradient-to-br from-[#0f172a] to-zinc-900 border-blue-900/50";
        icon = <Building2 size={18} className="text-blue-400" />;
    } else if (type === 'CASH') {
        bgClass = "bg-gradient-to-br from-[#064e3b] to-zinc-900 border-emerald-900/50";
        icon = <DollarSign size={18} className="text-emerald-400" />;
    }

    return (
      <div className={`relative overflow-hidden rounded-3xl border p-6 h-full flex flex-col justify-between ${bgClass} shadow-lg transition-all duration-300`}>
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5">{icon}</div>
                      <div>
                        <p className="text-zinc-200 text-sm font-semibold leading-tight">{title}</p>
                        {subtitle && <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{subtitle}</p>}
                      </div>
                  </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6 mt-2 tracking-tight">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance)}
              </h2>
              
              <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Expenses</span>
                        <div className="flex items-center gap-1.5 text-red-500">
                        <ArrowUpRight size={14} />
                        <span className="font-bold text-sm">${stats.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Income</span>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                        <span className="font-bold text-sm">${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <ArrowDownLeft size={14} />
                        </div>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-zinc-950/50 rounded-full overflow-hidden flex">
                  {(stats.income + stats.expenses) > 0 ? (
                      <>
                      <div className="h-full bg-red-500/80 transition-all duration-500" style={{ width: `${stats.expensePct}%` }} />
                      <div className="h-full bg-emerald-500/80 transition-all duration-500" style={{ width: `${stats.incomePct}%` }} />
                      </>
                  ) : (
                      <div className="h-full w-full bg-zinc-800/50" />
                  )}
                  </div>
              </div>
          </div>
      </div>
    );
  };

  // Prepare cards data including the total card
  const allCards = [
      { id: 'total', type: 'TOTAL', name: 'Total Net Worth', balance: totalNetWorth, stats: globalStats, subtitle: 'Global Balance' },
      ...accounts.map(acc => ({ ...acc, stats: calculateStats(acc.id), subtitle: acc.type }))
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-2 px-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Good Morning</h1>
          <p className="text-zinc-400 text-sm">Here's your financial overview</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 border-2 border-zinc-950 shadow-lg" />
      </div>

      {/* Swappable Cards Carousel */}
      <div className="relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="-mx-4 px-4 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar flex gap-4"
          >
              {allCards.map((card, idx) => (
                  <div key={card.id} className="snap-center shrink-0 w-[85vw] max-w-sm">
                      {renderStatsCard(card.name, card.balance, card.stats, card.type, card.subtitle)}
                  </div>
              ))}
              
              {/* Add Account Card Placeholder */}
              <div className="snap-center shrink-0 w-[20vw] flex items-center justify-center">
                   <button className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 transition-colors">
                       <Plus size={24} className="text-zinc-500" />
                   </button>
              </div>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
              {allCards.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeIndex ? 'bg-white w-4' : 'bg-zinc-700'
                    }`}
                  />
              ))}
              <div className={`w-1.5 h-1.5 rounded-full bg-zinc-700`} /> {/* Dot for add button */}
          </div>
      </div>

      {/* AI Personalized Tips / Insights */}
      <Card 
        className="bg-gradient-to-r from-indigo-900/40 to-blue-900/30 border-indigo-500/30 cursor-pointer hover:border-indigo-500/50 transition-colors"
        onClick={() => onNavigate && onNavigate('analytics')}
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles size={20} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-indigo-100 font-semibold text-sm">AI Personalized Tips</h3>
            <p className="text-indigo-200/60 text-xs mt-0.5">
              Click to chat with Gemini about your finances.
            </p>
          </div>
          <div className="bg-indigo-500/10 p-1 rounded-full">
             <ArrowUpRight size={16} className="text-indigo-400" />
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          {transactions.length > 0 && (
            <button className="text-primary text-sm font-medium hover:text-emerald-400 transition-colors">See All</button>
          )}
        </div>
        <TransactionList limit={5} />
      </div>
    </div>
  );
};