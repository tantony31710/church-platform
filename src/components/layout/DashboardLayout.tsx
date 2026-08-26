import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ListTodo,
  QrCode,
  Trophy,
  LineChart,
  ShieldCheck,
  LogOut,
  Flame,
  Award,
  Sparkles,
  Users,
  Sun,
  Moon,
  Box,
  Layers,
  Menu,
  X,
  ChevronDown,
  RotateCcw,
  Bell,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useThemeStore, ThemeType } from '@/lib/theme-manager';
import { DataService } from '@/lib/data-service';
import { DataFlowBackground } from '../three/DataFlowBackground';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import { CommunityAnnouncement, Task, ChurchOrganizationSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const { user, profile, role, loading, switchUser, toggleRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, show3D, toggle3D } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<CommunityAnnouncement | null>(null);
  const [openTasksCount, setOpenTasksCount] = useState<number>(0);
  const [organization, setOrganization] = useState<ChurchOrganizationSettings>(() =>
    DataService.getOrganizationSettings()
  );
  const allUsers = DataService.getUsers();

  useEffect(() => {
    // Read announcement and open tasks count
    setAnnouncement(DataService.getAnnouncement());
    const tasks = DataService.getTasks();
    setOpenTasksCount(tasks.filter((t) => t.status === 'open').length);
    setOrganization(DataService.getOrganizationSettings());

    const unsubAnn = DataService.subscribe<CommunityAnnouncement>('announcement', (ann) => {
      setAnnouncement(ann);
    });
    const unsubTasks = DataService.subscribe<Task[]>('tasks', (newTasks) => {
      setOpenTasksCount(newTasks.filter((t) => t.status === 'open').length);
    });
    const unsubOrg = DataService.subscribe<ChurchOrganizationSettings>('organization', (org) => {
      setOrganization(org);
    });

    return () => {
      unsubAnn();
      unsubTasks();
      unsubOrg();
    };
  }, []);

  const navItems = [
    { to: '/tasks', label: 'Tasks', icon: ListTodo, badge: openTasksCount > 0 ? openTasksCount : null },
    { to: '/attendance', label: 'Attendance', icon: QrCode, badge: profile?.streak ? `🔥 ${profile.streak}` : null },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/insights', label: 'Insights & AI', icon: LineChart, adminOnly: false },
    { to: '/admin', label: 'Admin Hub', icon: ShieldCheck, adminOnly: true },
  ];

  const themesList: { id: ThemeType; label: string; icon: string }[] = [
    { id: 'cool', label: 'Cool Cyan (Dark)', icon: '🌊' },
    { id: 'energetic', label: 'Amber Flame (Dark)', icon: '🔥' },
    { id: 'emerald', label: 'Grace Emerald (Dark)', icon: '🌿' },
    { id: 'light', label: 'Clean Sanctuary (Light)', icon: '☀️' },
  ];

  return (
    <div className={`min-h-screen theme-${theme} relative flex flex-col font-sans selection:bg-glow/30 selection:text-foreground`}>
      {show3D && <DataFlowBackground />}

      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/80 px-4 sm:px-6 h-16 flex items-center justify-between transition-colors">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-accent/40 via-glow/30 to-white/10 flex items-center justify-center border border-glow/30 shadow-[0_0_12px_hsl(var(--glow)/0.2)] group-hover:scale-105 transition-transform">
              <HeartHandshake className="h-5 w-5 text-glow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-bold tracking-tight text-foreground">Church<span className="text-glow">Connect</span></span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-glow/15 text-glow font-semibold tracking-wide border border-glow/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-foreground/50 tracking-normal hidden sm:block truncate max-w-[200px]">
                {organization?.churchName || 'Grace Community Church'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-border/70 pl-5">
            {navItems
              .filter((item) => !item.adminOnly || role === 'admin')
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive: active }) =>
                      `relative px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        active
                          ? 'text-foreground bg-white/10 shadow-sm'
                          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                      }`
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 rounded-lg border border-glow/40 bg-glow/10 -z-10 shadow-[0_0_15px_hsl(var(--glow)/0.15)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 ${isActive ? 'text-glow' : 'text-foreground/50'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-glow text-background font-black'
                            : 'bg-white/10 text-foreground/70'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3D Visualizer Toggle */}
          <button
            onClick={toggle3D}
            title={show3D ? 'Disable 3D Background' : 'Enable 3D Background'}
            className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              show3D
                ? 'border-glow/40 bg-glow/10 text-glow'
                : 'border-border text-foreground/50 hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>3D {show3D ? 'ON' : 'OFF'}</span>
          </button>

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border text-foreground/70 hover:text-foreground hover:bg-white/5 transition-colors"
              title="Change Theme Palette"
            >
              <Sun className="h-3.5 w-3.5 text-glow" />
              <span className="hidden sm:inline capitalize">{theme}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {themeDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl glass-strong border border-border-strong p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setThemeDropdownOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-foreground/40 tracking-wider">
                  Color Theme
                </div>
                {themesList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                      theme === t.id
                        ? 'bg-glow/20 text-glow font-medium'
                        : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </span>
                    {theme === t.id && <span className="h-1.5 w-1.5 rounded-full bg-glow" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Persona & Role Selector */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border hover:border-glow/50 bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent/50 to-glow/40 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-glow/30">
                {profile?.name ? profile.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                    {profile?.name || 'Volunteer'}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/50 mt-0.5">
                  <span className="text-glow font-semibold">{profile?.points || 0} pts</span>
                  {profile?.streak ? (
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <Flame className="h-2.5 w-2.5" />
                      {profile.streak}w streak
                    </span>
                  ) : null}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 opacity-50 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl glass-strong border border-border-strong p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="p-2 border-b border-border/70 mb-1.5">
                  <p className="text-xs font-bold text-foreground">{profile?.name}</p>
                  <p className="text-[11px] text-foreground/50 truncate">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-glow/15 text-glow font-semibold border border-glow/30">
                      🏆 {profile?.points || 0} Total Points
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRole();
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 border border-border text-foreground transition-colors ml-auto"
                    >
                      Switch to {role === 'admin' ? 'Volunteer' : 'Admin'}
                    </button>
                  </div>
                </div>

                <div className="px-2 py-1 text-[10px] uppercase font-bold text-foreground/40 tracking-wider">
                  Quick Switch Persona
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                        profile?.id === u.id
                          ? 'bg-glow/20 text-glow font-medium'
                          : 'text-foreground/70 hover:bg-white/10 hover:text-foreground'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-[10px] text-foreground/40 capitalize">{u.role} · {u.skills?.[0] || 'Member'}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-glow shrink-0">{u.points} pts</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-1.5 border-t border-border/70 flex gap-1">
                  <button
                    onClick={() => {
                      DataService.resetToDefaultData();
                      window.location.reload();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-foreground/50 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Data
                  </button>
                  <button
                    onClick={logout}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-border bg-white/5 text-foreground hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border glass-strong px-4 py-3 z-30 overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems
                .filter((item) => !item.adminOnly || role === 'admin')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-glow/20 text-glow border border-glow/30'
                          : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Mode Subheader / Quick Actions Banner */}
      <div className="bg-gradient-to-r from-glow/10 via-accent/10 to-transparent border-b border-border/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-foreground/80">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-foreground">Active Session:</span>
          <span className="text-foreground/70">Sunday Morning Celebration & Community Fellowship</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-foreground/50 hidden sm:inline">
            Logged in as <strong className="text-foreground">{profile?.name}</strong> ({role})
          </span>
          <button
            onClick={toggleRole}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-border text-foreground font-semibold text-[11px] transition-colors"
          >
            Switch to {role === 'admin' ? 'Volunteer View' : 'Leadership View'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {announcement && announcement.active && (
          <div className="mb-6">
            <AnnouncementBanner message={announcement.message} />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 glass px-6 py-4 text-center text-xs text-foreground/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ChurchConnect Volunteer & Engagement Platform</span>
          <div className="flex items-center gap-4 text-foreground/60">
            <span>Points & Rewards</span>
            <span>·</span>
            <span>QR Attendance</span>
            <span>·</span>
            <span>AI Matchmaking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
