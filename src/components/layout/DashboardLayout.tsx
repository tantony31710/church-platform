import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, QrCode, Trophy, LineChart, ShieldCheck, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth-context';
import { NavigationHub } from '../three/NavigationHub';
import { DataFlowBackground } from '../three/DataFlowBackground';
import { useThemeStore } from '@/lib/theme-manager';

const navItems = [
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/attendance', label: 'Attendance', icon: QrCode },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/insights', label: 'Insights', icon: LineChart, adminOnly: true },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

export default function DashboardLayout() {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

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
    <div className={`min-h-screen theme-${theme}`}>
      <DataFlowBackground />
      <nav className="sticky top-0 z-20 glass-strong px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="mr-4 text-sm font-semibold text-foreground/90 tracking-tight">
            Church<span className="text-glow">Connect</span>
          </span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </nav>
      <div className="px-6 md:px-8 pt-4">
        <NavigationHub />
      </div>
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
