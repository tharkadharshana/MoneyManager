import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-surface border border-zinc-800 rounded-2xl p-4 shadow-sm ${className} ${onClick ? 'cursor-pointer hover:border-zinc-700 transition-colors' : ''}`}
    >
      {children}
    </div>
  );
};