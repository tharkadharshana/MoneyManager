import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoMode(false);
      } else if (!isDemoMode) {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const loginAsGuest = async () => {
    setLoading(true);
    setTimeout(() => {
        setIsDemoMode(true);
        setUser(AuthService.getMockUser());
        setLoading(false);
    }, 600);
  };

  const logout = async () => {
    if (isDemoMode) {
        setIsDemoMode(false);
        setUser(null);
    } else {
        await AuthService.logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemoMode,
      loginWithGoogle: async () => { await AuthService.loginWithGoogle(); },
      loginWithEmail: async (email: string, pass: string) => { await AuthService.loginWithEmail(email, pass); },
      signupWithEmail: async (email: string, pass: string) => { await AuthService.signupWithEmail(email, pass); },
      loginAsGuest,
      logout,
      userId: user ? user.uid : null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};