'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    async function checkAdmin() {
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        alert('Layout: No session found - redirecting to /admin/login');
        router.push('/admin/login');
        return;
      }

      alert('Layout: Session found for user: ' + session.user.id);

      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!admin) {
        alert('Layout: User ' + session.user.id + ' not found in admins table');
        router.push('/dashboard');
        return;
      }

      alert('Layout: Admin found! Redirecting...');
      setIsAdmin(true);
      setIsLoading(false);
    }

    checkAdmin();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You are not authorized to access admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full h-10 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
