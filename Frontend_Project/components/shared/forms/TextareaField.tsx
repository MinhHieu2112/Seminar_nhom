'use client';

import { ReactNode } from 'react';
import { FieldError } from 'react-hook-form';

interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  children?: ReactNode;
}

export function TextareaField({
  label,
  placeholder,
  error,
  required,
  disabled,
  maxLength,
  rows = 4,
  value,
  onChange,
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {maxLength && value && (
          <span className="text-xs text-slate-400">
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
      />
      {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  );
}
