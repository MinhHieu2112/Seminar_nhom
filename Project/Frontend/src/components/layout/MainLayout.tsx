'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

// FIX: thêm '/' để trang chủ không hiển thị sidebar/header layout
// Trang chủ là landing page công khai, không cần navigation
const noLayoutPages = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  const shouldHideLayout = !pathname || noLayoutPages.some(page =>
    pathname === page || pathname.startsWith(page + '/')
  );

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