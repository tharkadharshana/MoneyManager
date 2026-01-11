import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { CATEGORIES } from '../constants';
import { Card } from './ui/Card';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';

export const Analytics: React.FC = () => {
  const { transactions } = useData();

  // 1. Calculate Category Spending
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const catMap = new Map<string, number>();

    expenses.forEach(tx => {
      if (tx.categoryId) {
        const current = catMap.get(tx.categoryId) || 0;
        catMap.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    });

    const data = Array.from(catMap.entries()).map(([catId, value]) => {
      const catDef = CATEGORIES.find(c => c.id === catId);
      return {
        name: catDef ? catDef.name : 'Uncategorized',
        value: value,
        color: catDef ? catDef.color : '#71717a'
      };
    }).sort((a, b) => b.value - a.value);

    return data;
  }, [transactions]);

  // 2. Calculate Spending Trend (Last 6 Months)
  const trendData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const monthMap = new Map<string, number>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short' });
        monthMap.set(key, 0);
    }

    expenses.forEach(tx => {
        const d = new Date(tx.date);
        const key = d.toLocaleString('default', { month: 'short' });
        if (monthMap.has(key)) {
            monthMap.set(key, (monthMap.get(key) || 0) + Math.abs(tx.amount));
        }
    });

    return Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  if (transactions.length === 0) {
      return (
          <div className="p-4 space-y-6 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-xl font-bold text-white">No Data Yet</h2>
              <p className="text-zinc-400 text-sm max-w-xs mt-2">
                 Please add data to show analytics.
              </p>
          </div>
      );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-white pt-2">Analytics</h1>

      {/* Spending Trend */}
      <Card>
        <h3 className="text-zinc-400 text-sm font-medium mb-4">Spending Trend (6 Mo)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }} 
                tickFormatter={(val) => `$${val}`}
                width={40}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <h3 className="text-zinc-400 text-sm font-medium mb-4">Spending by Category</h3>
        <div className="h-48 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    width={90}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                />
                <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">No expense data</div>
          )}
        </div>
      </Card>
    </div>
  );
};