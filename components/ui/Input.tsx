import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon: Icon, error, className = '', ...props }) => {
  return (
    <div className="space-y-1 w-full">
      {label && <label className="text-xs font-medium text-zinc-400 ml-1">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-3.5 text-zinc-500" />}
        <input 
            className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl py-3 ${Icon ? 'pl-10' : 'px-4'} pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-zinc-600 ${className}`}
            {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
};