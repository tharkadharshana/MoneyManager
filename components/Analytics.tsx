import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { CATEGORIES } from '../constants';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';
import { Sparkles, BrainCircuit, Cpu } from 'lucide-react';
import { FinancialAssistant } from './FinancialAssistant';
import { GoogleGenAI } from "@google/genai";

export const Analytics: React.FC = () => {
  const { transactions, financialSummary, refreshFinancialSummary } = useData();
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tokenUsage, setTokenUsage] = useState({ prompt: 0, output: 0, total: 0 });

  // 1. Calculate Category Spending (for Pie Chart)
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const catMap = new Map<string, number>();

    expenses.forEach(tx => {
      if (tx.categoryId) {
        const current = catMap.get(tx.categoryId) || 0;
        catMap.set(tx.categoryId, current + Math.abs(tx.amount));
      }
    });

    return Array.from(catMap.entries()).map(([catId, value]) => {
      const catDef = CATEGORIES.find(c => c.id === catId);
      return {
        name: catDef ? catDef.name : 'Uncategorized',
        value: value,
        color: catDef ? catDef.color : '#9ca3af'
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions]);

  // 2. Calculate Spending Trend (Last 6 Months)
  const trendData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const monthMap = new Map<string, number>();
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthMap.set(key, 0);
    }

    expenses.forEach(tx => {
        const d = new Date(tx.date);
        const diffTime = Math.abs(today.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 180) {
            const key = d.toLocaleString('default', { month: 'short' });
            if (monthMap.has(key)) {
                monthMap.set(key, (monthMap.get(key) || 0) + Math.abs(tx.amount));
            }
        }
    });

    return Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  // 3. Top Merchants (Vendor per Costing)
  const merchantData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const merchMap = new Map<string, number>();

    expenses.forEach(tx => {
        const name = tx.descriptionEnriched || tx.descriptionRaw || 'Unknown';
        merchMap.set(name, (merchMap.get(name) || 0) + Math.abs(tx.amount));
    });

    return Array.from(merchMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  }, [transactions]);

  // 4. Spending by Time of Day
  const timeOfDayData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const timeMap = {
        'Morning': 0,
        'Afternoon': 0,
        'Evening': 0,
        'Night': 0
    };

    expenses.forEach(tx => {
        const hour = new Date(tx.date).getHours();
        if (hour >= 5 && hour <= 11) timeMap['Morning'] += Math.abs(tx.amount);
        else if (hour >= 12 && hour <= 16) timeMap['Afternoon'] += Math.abs(tx.amount);
        else if (hour >= 17 && hour <= 21) timeMap['Evening'] += Math.abs(tx.amount);
        else timeMap['Night'] += Math.abs(tx.amount);
    });

    return Object.entries(timeMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Generate AI Tips
  const generateInsights = async () => {
    setIsAnalyzing(true);
    try {
        await refreshFinancialSummary();
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let promptData = "";
        if (financialSummary) {
            promptData = JSON.stringify(financialSummary, null, 2);
        } else {
            const topMerchants = merchantData.map(m => `${m.name}: $${m.value.toFixed(0)}`).join(', ');
            const totalSpent = trendData.reduce((acc, curr) => acc + curr.amount, 0);
            promptData = `Total Spend: ${totalSpent}, Top Merchants: ${topMerchants}, Categories: ${categoryData.map(c => c.name).join(', ')}`;
        }
        
        const prompt = `
            Analyze this financial summary JSON for a user:
            ${promptData}
            
            Provide 3 specific, short, and actionable tips to save money. 
            Identify unnecessary buying patterns if visible.
            Format as a simple list.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: prompt }] }]
        });

        setAiTips(response.text || "Could not generate insights.");
        
        if (response.usageMetadata) {
            setTokenUsage(prev => ({
                prompt: prev.prompt + response.usageMetadata.promptTokenCount,
                output: prev.output + response.usageMetadata.candidatesTokenCount,
                total: prev.total + response.usageMetadata.totalTokenCount
            }));
        }

    } catch (e) {
        console.error(e);
        setAiTips("Error connecting to AI service.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // Custom Label Renderer for Pie Charts
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#e4e4e7" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={10}
        fontWeight={500}
      >
        {`${name}`}
      </text>
    );
  };

  const MERCHANT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  return (
    <div className="p-4 space-y-6 pb-28 relative min-h-screen">
      <div className="flex justify-between items-center pt-2">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <button 
            onClick={() => setShowAssistant(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-lg shadow-indigo-500/20"
          >
              <Sparkles size={14} />
              Ask AI
          </button>
      </div>

      {transactions.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center min-h-[40vh] text-center opacity-50">
              <p className="text-zinc-400 text-sm">Add transactions to see analytics.</p>
          </div>
      ) : (
      <>
        {/* 1. Spending Trend (Area Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-1">Spending Trend (6 Mo)</h3>
            <p className="text-2xl font-bold text-white mb-6">
                ${trendData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </p>
            <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
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
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [`$${value.toFixed(0)}`, 'Spent']}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* 2. Spending by Category (Pie Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-4">Category Breakdown</h3>
            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, bottom: 20 }}>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={renderCustomLabel}
                            labelLine={{ stroke: '#52525b', strokeWidth: 1 }}
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                             contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                             formatter={(value: number) => [`$${value.toFixed(0)}`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                     <div className="flex flex-col items-center">
                        <span className="text-white text-sm font-bold tracking-tight">Expenses</span>
                        <span className="text-zinc-500 text-[10px] font-medium">Top 5</span>
                     </div>
                </div>
            </div>
        </div>

        {/* 3. Top Merchants (Pie Chart - Replaced Bar Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-4">Top Spending by Merchant (Top 10)</h3>
            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, bottom: 20 }}>
                        <Pie
                            data={merchantData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={renderCustomLabel}
                            labelLine={{ stroke: '#52525b', strokeWidth: 1 }}
                        >
                            {merchantData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={MERCHANT_COLORS[index % MERCHANT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                            formatter={(value: number) => [`$${value.toFixed(0)}`, 'Spent']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                     <div className="flex flex-col items-center">
                        <span className="text-white text-sm font-bold tracking-tight">Merchants</span>
                        <span className="text-zinc-500 text-[10px] font-medium">Top 10</span>
                     </div>
                </div>
            </div>
        </div>

        {/* 4. Spending by Time of Day (Bar Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-4">Spending Habits (Time of Day)</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeOfDayData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                             cursor={{fill: '#27272a'}}
                             contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                             formatter={(value: number) => [`$${value.toFixed(0)}`, 'Spent']}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 5. AI Tips & Token Stats */}
        <div className="grid grid-cols-1 gap-6">
            {/* AI Tips Card */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="text-indigo-400" size={20} />
                        <h3 className="text-indigo-200 font-semibold">AI Smart Tips</h3>
                    </div>
                    <button 
                        onClick={generateInsights}
                        disabled={isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                    </button>
                </div>
                
                <div className="relative z-10 min-h-[60px]">
                    {aiTips ? (
                        <div className="prose prose-invert prose-sm text-indigo-100/90 whitespace-pre-wrap leading-relaxed">
                            {aiTips}
                        </div>
                    ) : (
                        <p className="text-indigo-300/50 text-sm italic">
                            Tap "Analyze Now" to let Gemini review your spending habits and suggest ways to save money.
                        </p>
                    )}
                </div>
            </div>

            {/* API Token Usage Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-emerald-500/10 rounded-lg">
                         <Cpu size={18} className="text-emerald-500" />
                     </div>
                     <div>
                         <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">AI Token Usage</p>
                         <div className="flex items-center gap-2">
                             <span className="text-zinc-200 font-mono text-sm">{tokenUsage.total.toLocaleString()}</span>
                             <span className="text-[10px] text-zinc-600">Session Total</span>
                         </div>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="text-[10px] text-zinc-500">Left to use</p>
                     <p className="text-xs text-emerald-400 font-medium">Unlimited (Free Tier)</p>
                 </div>
            </div>
        </div>

      </>
      )}

      {/* Assistant Modal */}
      {showAssistant && <FinancialAssistant onClose={() => setShowAssistant(false)} />}
    </div>
  );
};