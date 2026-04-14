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
    async function checkAdmin() {
      if (pathname === '/admin/login') {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!admin) {
        router.push('/dashboard');
        return;
      }

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
