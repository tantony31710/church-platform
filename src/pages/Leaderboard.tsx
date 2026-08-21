import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { LeaderboardEntry } from '@/lib/types';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  Star,
  Crown
} from 'lucide-react';

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => DataService.getLeaderboard());
  const [filterRole, setFilterRole] = useState<'all' | 'volunteer' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = DataService.subscribe<LeaderboardEntry[]>('leaderboard', (newEntries) => {
      setEntries(newEntries);
    });
    setEntries(DataService.getLeaderboard());
    return () => unsub();
  }, []);

  const filteredEntries = entries.filter((e) => {
    if (filterRole !== 'all' && e.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchSkill = e.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchSkill) return false;
    }
    return true;
  });

  const topThree = entries.slice(0, 3);
  const totalCommunityPoints = entries.reduce((acc, curr) => acc + (curr.points || 0), 0);
  const communityGoal = 2500;
  const goalProgress = Math.min(100, Math.round((totalCommunityPoints / communityGoal) * 100));

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
                HONOR ROLL
              </span>
              <span className="text-xs text-foreground/50">Celebrating Faithful Service & Ministry Leadership</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Volunteer Community Leaderboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-border text-foreground/80 font-medium">
              🌟 {entries.length} Active Volunteers
            </span>
          </div>
        </div>

        {/* Community Goal Progress Bar */}
        <div className="mt-5 pt-4 border-t border-border/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-glow" />
              Community Goal: {communityGoal.toLocaleString()} Service Points
            </span>
            <span className="text-glow font-bold">{totalCommunityPoints} / {communityGoal} pts ({goalProgress}%)</span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent via-glow to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Top 3 Podium Visualizer */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 sm:order-1"
          >
            <Card className="p-5 text-center flex flex-col items-center border-slate-400/30 bg-white/5 relative">
              <div className="h-10 w-10 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-bold text-base mb-2 border border-slate-300/40">
                🥈 2
              </div>
              <h3 className="font-bold text-base text-foreground mb-0.5 truncate max-w-full">
                {topThree[1].name}
              </h3>
              <p className="text-xs text-foreground/50 mb-3 capitalize">{topThree[1].skills?.[0] || 'Volunteer'}</p>
              <div className="px-3 py-1 rounded-full bg-slate-300/15 text-slate-200 text-xs font-bold border border-slate-300/30">
                {topThree[1].points} pts
              </div>
            </Card>
          </motion.div>

          {/* 1st Place (Champion) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.0 }}
            className="order-1 sm:order-2"
          >
            <Card className="p-6 text-center flex flex-col items-center border-amber-400/40 bg-amber-500/10 relative glow-ring-strong sm:-translate-y-2">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-background font-black text-[10px] tracking-wider uppercase shadow-md">
                CHAMPION
              </div>
              <div className="h-14 w-14 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-2xl mb-2 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                👑 1
              </div>
              <h3 className="font-extrabold text-lg text-foreground mb-0.5 truncate max-w-full">
                {topThree[0].name}
              </h3>
              <p className="text-xs text-amber-200/70 mb-3 capitalize">{topThree[0].skills?.[0] || 'Leader'}</p>
              <div className="px-4 py-1.5 rounded-full bg-amber-400 text-background text-sm font-black shadow-lg">
                {topThree[0].points} pts
              </div>
            </Card>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3"
          >
            <Card className="p-5 text-center flex flex-col items-center border-amber-700/30 bg-white/5 relative">
              <div className="h-10 w-10 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-bold text-base mb-2 border border-amber-700/40">
                🥉 3
              </div>
              <h3 className="font-bold text-base text-foreground mb-0.5 truncate max-w-full">
                {topThree[2].name}
              </h3>
              <p className="text-xs text-foreground/50 mb-3 capitalize">{topThree[2].skills?.[0] || 'Volunteer'}</p>
              <div className="px-3 py-1 rounded-full bg-amber-700/15 text-amber-500 text-xs font-bold border border-amber-700/30">
                {topThree[2].points} pts
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search volunteers by name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-white/5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-glow/50"
          />
        </div>

        <div className="flex p-1 rounded-xl glass border border-border self-start sm:self-auto">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
              filterRole === 'all' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setFilterRole('volunteer')}
            className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
              filterRole === 'volunteer' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Volunteers
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
              filterRole === 'admin' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Pastoral & Leads
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredEntries.map((entry, index) => {
            const isMe = profile && profile.id === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card
                  className={`p-4 flex items-center justify-between gap-4 transition-all ${
                    isMe
                      ? 'border-glow bg-glow/10 shadow-[0_0_20px_hsl(var(--glow)/0.15)]'
                      : 'hover:border-border-strong hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        entry.rank === 1
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : entry.rank === 2
                          ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                          : entry.rank === 3
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                          : 'bg-white/5 text-foreground/60 border border-border'
                      }`}
                    >
                      #{entry.rank}
                    </div>

                    {/* Member Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">
                          {entry.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-glow text-background font-black">
                            YOU
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                            entry.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-white/10 text-foreground/50'
                          }`}
                        >
                          {entry.role}
                        </span>
                      </div>

                      {/* Skills snippet */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-foreground/50">
                        {entry.skills && entry.skills.slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] text-foreground/60">
                            • {s}
                          </span>
                        ))}
                        {entry.streak && entry.streak > 1 ? (
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold text-[10px] ml-1">
                            <Flame className="h-2.5 w-2.5" /> {entry.streak}w streak
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Points & Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] text-foreground/40 uppercase font-semibold">Service Impact</p>
                      <p className="text-xs text-foreground/70 font-medium">
                        {entry.tasksCompleted} tasks · {entry.attendanceCount} services
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-right min-w-[80px]">
                      <p className="text-sm font-extrabold text-glow">{entry.points}</p>
                      <p className="text-[9px] text-foreground/40 uppercase font-semibold">Points</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
