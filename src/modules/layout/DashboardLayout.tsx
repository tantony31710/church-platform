import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, QrCode, Trophy, LineChart, ShieldCheck, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth-context';
import { AmbientBackground } from '@/modules/ui/ambient-background';

const navItems = [
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/attendance', label: 'Attendance', icon: QrCode },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/insights', label: 'Insights', icon: LineChart, adminOnly: true },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

// In Next.js this was split across layout.tsx (persistent nav) and
// template.tsx (per-route enter animation, since layout.tsx doesn't
// re-mount on navigation). React Router's <Outlet key={pathname}>
// gets both in one file: the nav below persists across routes, while
// AnimatePresence + the keyed Outlet re-triggers the motion.div's
// enter animation on every route change.
export default function DashboardLayout() {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

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
      <AmbientBackground />
      <nav className="sticky top-0 z-20 glass-strong px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="mr-4 text-sm font-semibold text-foreground/90 tracking-tight">
            Church<span className="text-glow">Connect</span>
          </span>
          {navItems
            .filter((item) => !item.adminOnly || role === 'admin')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md bg-white/8 glow-ring"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <item.icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
        </div>
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </nav>
      <main className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
