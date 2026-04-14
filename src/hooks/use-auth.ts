'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/hooks/use-store';
import type { Partner } from '@/types';
import type { Session } from '@supabase/supabase-js';

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const { user, setUser, setLoading, isAuthenticated, isLoading: storeLoading } = useAuthStore();
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: partner } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (partner) {
          setUser(partner as Partner);
        } else {
          setUser(null);
          if (requireAuth) {
            router.push('/login');
          }
        }
      } else {
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, setUser, setLoading, router, requireAuth]);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase, setUser, router, requireAuth]);

  return {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    refreshUser: fetchUser,
  };
}

export function useSignOut() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const supabase = createClient();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  }, [supabase, logout, router]);

  return signOut;
}
