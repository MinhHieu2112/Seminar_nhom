'use client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui-store';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Trang chủ là landing page công khai, không cần navigation
const noLayoutPages = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUIStore();

  const shouldHideLayout = !pathname || noLayoutPages.some(page =>
    pathname === page || pathname.startsWith(page + '/')
  );
  const shouldShowGlobalHeader = !shouldHideLayout;

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {shouldShowGlobalHeader && <Header />}
        <div className={`${shouldShowGlobalHeader ? 'min-h-[calc(100vh-4rem)] pt-4' : 'min-h-screen pt-6'} px-4 pb-8 lg:px-8`}>
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
