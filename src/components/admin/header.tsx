'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminUser {
  name: string;
  email: string;
  avatar_url?: string;
}

export function AdminHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: admin } = await supabase
          .from('admins')
          .select('name, email')
          .eq('user_id', session.user.id)
          .single();
        
        if (admin) {
          setUser({
            name: admin.name,
            email: admin.email,
          });
        } else {
          setUser({
            name: session.user.email?.split('@')[0] || 'Admin',
            email: session.user.email || '',
          });
        }
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="h-16 bg-background border-b px-6 flex items-center justify-between">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search partners, leads, demos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-background border rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-2">
                <button 
                  onClick={() => { setShowUserMenu(false); router.push('/admin/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
