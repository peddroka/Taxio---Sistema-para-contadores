import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar - hidden on mobile */}
      <Sidebar />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar - mobile only */}
        <TopBar />
        
        {/* Page content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>
      
      {/* Bottom navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
