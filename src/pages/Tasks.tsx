import { Suspense, lazy, useState } from 'react';
import { TaskList } from '@/components/tasks/task-list';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  Award,
  Flame,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  Box,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useThemeStore } from '@/lib/theme-manager';

const InteractionHub = lazy(() =>
  import('@/components/three/interaction-hub').then((m) => ({ default: m.InteractionHub }))
);

export default function TasksPage() {
  const { profile } = useUserProfile();
  const { role } = useAuth();
  const { show3D } = useThemeStore();
  const [showNetworkViz, setShowNetworkViz] = useState(true);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner & Personal Stats Summary */}
      <div className="glass-strong rounded-2xl border border-border-strong p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-glow/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
                VOLUNTEER HUB
              </span>
              <span className="text-xs text-foreground/50">
                Sunday & Mid-Week Ministry Opportunities
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, <span className="text-glow">{profile?.name || 'Volunteer'}</span>
            </h1>
            <p className="text-sm text-foreground/60 mt-1 max-w-xl">
              Match your spiritual gifts and technical skills with critical community needs. Earn points, build streaks, and make a tangible impact.
            </p>
          </div>

          {/* Quick Stats Badges */}
          {profile && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Points Card */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-border">
                <div className="h-9 w-9 rounded-lg bg-glow/20 text-glow flex items-center justify-center font-bold">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-wider">Service Points</p>
                  <p className="text-base font-extrabold text-glow">{profile.points || 0}</p>
                </div>
              </div>

              {/* Streak Card */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-border">
                <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-wider">Service Streak</p>
                  <p className="text-base font-extrabold text-amber-400">{profile.streak || 1} weeks</p>
                </div>
              </div>

              {/* Skills Card */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-border">
                <div className="h-9 w-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-wider">My Skills</p>
                  <p className="text-base font-extrabold text-foreground">{profile.skills?.length || 0} active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Skill Tags Pill Bar */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-xs text-foreground/70">
            <span className="text-[11px] text-foreground/40 font-semibold uppercase tracking-wider mr-1">
              Your Registered Skills:
            </span>
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-md bg-white/5 border border-border text-[11px] font-medium text-foreground/80"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3D Community Interaction Hub / Network Sculpture Toggle */}
      {show3D && (
        <div className="glass rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-glow" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                3D Community Ministry Topology
              </h2>
              <span className="text-[10px] text-foreground/40 hidden sm:inline">
                Interactive real-time volunteer connection sphere
              </span>
            </div>
            <button
              onClick={() => setShowNetworkViz(!showNetworkViz)}
              className="text-xs text-foreground/50 hover:text-foreground flex items-center gap-1"
            >
              {showNetworkViz ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showNetworkViz ? 'Collapse' : 'Expand'}</span>
            </button>
          </div>

          {showNetworkViz && (
            <Suspense
              fallback={
                <div className="h-64 rounded-xl glass animate-pulse-glow flex items-center justify-center">
                  <span className="text-xs text-foreground/40">Loading 3D network topology...</span>
                </div>
              }
            >
              <InteractionHub />
            </Suspense>
          )}
        </div>
      )}

      {/* Main Task List Engine */}
      <TaskList />
    </div>
  );
}
