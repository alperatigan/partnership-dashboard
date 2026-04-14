'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth(true);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkAdmin() {
      if (!user || !isLoading) return;

      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (!admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [user, isLoading, router]);

  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to access admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => router.push('/login')}
              className="w-full h-10 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
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
