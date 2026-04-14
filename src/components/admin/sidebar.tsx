'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Bell, 
  BarChart3, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { CompanySwitcher } from './company-switcher';
import { useCompany } from '@/lib/company-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/partners', icon: Users, label: 'Partners' },
  { href: '/admin/demos', icon: Calendar, label: 'Demos' },
  { href: '/admin/alerts', icon: Bell, label: 'Alerts' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { selectedCompany } = useCompany();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 h-screen bg-background border-r flex flex-col">
      {/* Logo & Company Switcher */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: selectedCompany?.primary_color || '#3B82F6' }}
          >
            {selectedCompany?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>
        <CompanySwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? '' : 'opacity-60'}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
