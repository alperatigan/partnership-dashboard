'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const { sidebarOpen } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
