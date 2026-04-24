'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Pages that don't need the sidebar layout
const noLayoutPages = ['/login', '/register', '/forgot-password', '/reset-password'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  // Check if current page should not have layout (exact match or starts with)
  const shouldHideLayout = !pathname || noLayoutPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );

  // On auth pages, render without layout
  if (shouldHideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <Header />

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-64 pt-16">
        <div className="min-h-[calc(100vh-4rem)] p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
