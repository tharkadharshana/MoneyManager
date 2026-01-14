import React from 'react';
import { Home, PieChart, ScanLine, Wallet, History } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'transactions', icon: History, label: 'Activity' },
    { id: 'scan', icon: ScanLine, label: 'Scan', isPrimary: true },
    { id: 'accounts', icon: Wallet, label: 'Accounts' },
    { id: 'analytics', icon: PieChart, label: 'Analytics' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      {/* Main glass bar */}
      <div className="relative bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 pb-safe pt-1 px-4">
        <div className="flex justify-between items-end h-[60px] pb-2 relative">
          
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            if (item.isPrimary) {
              return (
                <div key={item.id} className="relative -top-5 flex justify-center flex-1">
                   <button
                    onClick={() => onTabChange(item.id)}
                    className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-zinc-950 shadow-[0_4px_12px_rgba(16,185,129,0.3)] border-4 border-zinc-950 transition-all duration-300 active:scale-95 hover:brightness-110"
                  >
                    <Icon size={24} strokeWidth={2} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="group flex flex-col items-center justify-center flex-1 space-y-1.5 py-1"
              >
                <div className="relative">
                    <Icon 
                        size={24} 
                        strokeWidth={2}
                        className={`transition-colors duration-300 ${
                            isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                    />
                    {isActive && (
                        <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full opacity-50"></div>
                    )}
                </div>
                
                <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-zinc-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};