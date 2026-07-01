'use client';

// Every dashboard route is nested under this layout, so the auth/role
// check happens exactly once instead of being duplicated on every page.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/tasks', label: 'Tasks' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/insights', label: 'Insights', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return <p className="p-8 text-sm text-neutral-500">Loading...</p>;
  if (!user) return null; // redirect in flight

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-6 px-6 h-14 border-b border-border">
        {navItems
          .filter((item) => !item.adminOnly || role === 'admin')
          .map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium">
              {item.label}
            </a>
          ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
