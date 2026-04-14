'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CompanyProvider } from '@/lib/company-context';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (!admin) {
        router.push('/dashboard');
        return;
      }

      setIsReady(true);
    }

    check();
  }, [router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <CompanyProvider>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </CompanyProvider>
  );
}
