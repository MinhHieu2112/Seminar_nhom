'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  breadcrumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  children,
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-2">
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-200 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span>/</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && <p className="text-slate-400 mt-2">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              action.variant === 'secondary'
                ? 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {action.label}
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
