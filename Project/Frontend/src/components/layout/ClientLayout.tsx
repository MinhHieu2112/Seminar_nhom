'use client';

import { MainLayout } from './MainLayout';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}
