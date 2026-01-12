import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-surface border border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-500">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
                {description && <p className="text-sm text-zinc-400 mb-4">{description}</p>}
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};