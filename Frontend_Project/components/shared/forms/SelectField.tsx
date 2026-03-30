'use client';

import { ReactNode } from 'react';
import { FieldError } from 'react-hook-form';

interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function SelectField({
  label,
  options,
  error,
  required,
  placeholder,
  disabled,
  value,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  );
}
