'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/';

  if (isAuthPage) {
    return (
      <div className="auth-layout">
        <main className="auth-main-content">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
