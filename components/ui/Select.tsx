
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, placeholder = "Select...", value, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          className="w-full px-4 py-2 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--osmak-green)] appearance-none bg-white cursor-pointer"
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default Select;
