import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Wallet, Mail, Lock, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleError = (err: any) => {
    console.error(err);
    if (err.code === 'auth/operation-not-allowed') {
        setError('Login provider is not enabled in Firebase Console. Please use "Continue as Guest" for demo.');
    } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed.');
    } else {
        setError(err.message || 'Authentication failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
          if (mode === 'login') await loginWithEmail(email, password);
          else await signupWithEmail(email, password);
      } catch (err: any) {
          handleError(err);
      }
  };

  const handleGoogleLogin = async () => {
      setError('');
      try {
          await loginWithGoogle();
      } catch (err: any) {
          handleError(err);
      }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet size={32} className="text-white" />
          </div>
          <div className="text-center">
             <h1 className="text-3xl font-bold tracking-tight mb-1">Flow Finance</h1>
             <p className="text-zinc-400 text-sm">Master your money, effortlessly.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <Card className="bg-zinc-900/50 border-zinc-800 p-3 flex flex-col items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wide">Secure Data</span>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800 p-3 flex flex-col items-center gap-2">
                <Zap size={20} className="text-amber-400" />
                <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wide">Instant Sync</span>
            </Card>
        </div>

        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                
                <Input label="Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                <Input label="Password" icon={Lock} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

                <Button fullWidth className="mt-2" disabled={loading}>
                    {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </Button>
            </form>

            <div className="mt-4 text-center">
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs text-zinc-400 hover:text-white transition-colors">
                    {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </div>
        </div>

        <div className="w-full space-y-3">
          <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-all">
             <span>Continue with Google</span>
          </button>
          <button onClick={loginAsGuest} disabled={loading} className="w-full text-zinc-500 font-medium text-sm hover:text-zinc-300 transition-colors py-2">
             Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};