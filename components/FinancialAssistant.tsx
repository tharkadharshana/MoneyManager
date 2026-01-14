import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Sparkles, User, Bot, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CATEGORIES } from '../constants';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface FinancialAssistantProps {
    onClose: () => void;
}

export const FinancialAssistant: React.FC<FinancialAssistantProps> = ({ onClose }) => {
    const { transactions, accounts, financialSummary } = useData();
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'model', text: "Hello! I'm your financial assistant. Ask me anything about your spending, budget, or savings goals." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            let contextData = "";
            
            // Prefer using the pre-calculated summary from Firestore if available
            if (financialSummary) {
                contextData = `
                User Financial Summary (Pre-calculated):
                ${JSON.stringify(financialSummary, null, 2)}
                `;
            } else {
                // Fallback to raw data calculation if summary is missing
                const accountSummary = accounts.map(a => `${a.name}: ${a.balance} ${a.currency}`).join(', ');
                contextData = `User's Current Accounts: ${accountSummary}`;
            }

            // Always add a few recent transactions for immediate context
            const recentTx = transactions.slice(0, 5).map(t => 
                `${t.date.split('T')[0]}: ${t.descriptionEnriched} (${t.amount} ${t.currency})`
            ).join('\n');

            const systemPrompt = `
                You are a helpful personal finance assistant.
                
                ${contextData}

                Most Recent 5 Transactions:
                ${recentTx}
                
                Analyze the user's question based on this data. Be concise, friendly, and helpful.
                If they ask about spending trends, look at the summary data provided.
                Do not make up data.
            `;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + userMsg.text }] }
                ]
            });

            const text = response.text || "I couldn't process that request right now.";
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "Sorry, I'm having trouble connecting to the AI service." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full h-full sm:h-[600px] sm:max-w-md bg-zinc-950 sm:rounded-2xl border border-zinc-800 flex flex-col shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <Sparkles size={18} className="text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-white">Financial Assistant</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950" ref={scrollRef}>
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-primary text-zinc-950 rounded-tr-sm font-medium' 
                                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 mb-safe">
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-full py-3.5 pl-5 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="Ask about your finances..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};