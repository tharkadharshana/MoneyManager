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
      <div className="relative bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6">
        <div className="flex justify-between items-center h-16 relative">
          
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            if (item.isPrimary) {
              return (
                <div key={item.id} className="relative -top-8 w-16 flex justify-center">
                   <button
                    onClick={() => onTabChange(item.id)}
                    className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 shadow-[0_8px_16px_rgba(16,185,129,0.3)] border-4 border-zinc-950 transition-all duration-300 active:scale-95 hover:shadow-[0_8px_24px_rgba(16,185,129,0.5)] hover:-translate-y-1"
                  >
                    <Icon size={26} strokeWidth={2} />
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30"></div>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="group flex flex-col items-center justify-center w-14 space-y-1 relative"
              >
                <div className={`transition-all duration-300 transform ${isActive ? '-translate-y-1' : ''}`}>
                    <Icon 
                        size={24} 
                        strokeWidth={isActive ? 2.5 : 1.5}
                        className={`transition-colors duration-300 ${
                            isActive ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                    />
                </div>
                
                <span className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? 'text-white opacity-100 translate-y-0' : 'text-zinc-500 opacity-0 translate-y-2 absolute -bottom-2'
                }`}>
                  {item.label}
                </span>

                {/* Active Indicator Dot */}
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};