import React, { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Scanner } from './components/Scanner';
import { TransactionList } from './components/TransactionList';
import { AccountsView } from './components/AccountsView';
import { LoginView } from './components/LoginView';
import { DataProvider, useData } from './context/DataContext';
import { Search } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useData();

  // Show loading spinner while auth initializes
  if (loading && !user) {
      return (
          <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  // Show login if not authenticated
  if (!user) {
      return <LoginView />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'scan':
        return <Scanner />;
      case 'accounts':
        return <AccountsView />;
      case 'transactions':
        return (
          <div className="p-4 space-y-6 pb-24">
             <div className="flex flex-col gap-4">
                 <h1 className="text-2xl font-bold text-white pt-2">All Activity</h1>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
            </div>
            <TransactionList showFilters searchQuery={searchQuery} />
          </div>
        );
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans selection:bg-primary/30">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-background border-x border-zinc-800">
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}