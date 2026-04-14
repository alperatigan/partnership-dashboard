'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkAdmin(sessionUserId: string) {
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', sessionUserId)
        .single();

      if (!admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    }

    async function initAuth() {
      await new Promise(resolve => setTimeout(resolve, 200));
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await checkAdmin(session.user.id);
      } else {
        router.push('/admin/login');
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await checkAdmin(session.user.id);
      } else if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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
