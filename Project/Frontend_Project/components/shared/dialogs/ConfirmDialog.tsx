'use client';

import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive,
  isLoading,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="text-red-400 mt-1">
              <AlertCircle size={20} />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
        </div>

        {children && <div className="text-sm text-slate-300">{children}</div>}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-slate-600 hover:bg-slate-800"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
