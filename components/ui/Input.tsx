
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">{label}</label>
      <input
        className={`px-4 py-2 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--osmak-green)] transition-all bg-white placeholder:text-gray-300 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
