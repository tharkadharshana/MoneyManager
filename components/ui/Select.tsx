import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
    return (
        <div className="space-y-1 w-full">
            {label && <label className="text-xs font-medium text-zinc-500 mb-2 uppercase">{label}</label>}
            <select 
                className={`w-full bg-zinc-950 text-white text-sm rounded-lg border border-zinc-700 p-2.5 focus:ring-primary focus:border-primary outline-none ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};