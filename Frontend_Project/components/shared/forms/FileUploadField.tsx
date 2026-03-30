'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  maxSize?: number; // in bytes
  required?: boolean;
  onFileSelect: (file: File) => void;
  error?: string;
}

export function FileUploadField({
  label,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  required,
  onFileSelect,
  error,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (file.size > maxSize) {
      setFileError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setFileName(file.name);
    onFileSelect(file);
  };

  const handleClear = () => {
    setFileName(null);
    setFileError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg bg-slate-800/50 hover:bg-slate-800 hover:border-purple-500 transition-colors flex items-center justify-center gap-2 text-slate-300 hover:text-slate-100"
        >
          <Upload size={18} />
          <span className="text-sm">{fileName ? 'Change File' : 'Select File'}</span>
        </button>
      </div>

      {fileName && (
        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-3">
          <span className="text-sm text-slate-300 truncate">{fileName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
      {fileError && <p className="text-xs text-red-400">{fileError}</p>}
    </div>
  );
}
