'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-glow border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-20 glass-strong px-6 h-16 flex items-center gap-1">
        {navItems
          .filter((item) => !item.adminOnly || role === 'admin')
          .map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md bg-white/8 glow-ring"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
      </nav>
      <main className="p-6 md:p-8">{children}</main>
    </div>
  );
}
