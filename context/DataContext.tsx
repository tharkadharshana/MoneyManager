import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { WalletProvider, useWallet } from './WalletContext';

// Adapter Hook to maintain API compatibility for existing components
export const useData = () => {
  const auth = useAuth();
  const wallet = useWallet();
  
  return {
    ...auth,
    ...wallet,
    // Map loading states
    loading: auth.loading || wallet.dataLoading
  };
};

// Composite Provider
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </AuthProvider>
  );
};