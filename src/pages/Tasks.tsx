import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';
import { TaskList } from '@/components/tasks/task-list';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Card } from '@/components/ui/button';

const InteractionHub = lazy(() =>
  import('@/components/three/interaction-hub').then((m) => ({ default: m.InteractionHub }))
);

export default function TasksPage() {
  const { profile, loading } = useUserProfile();

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">
            {profile ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Available tasks'}
          </h1>
          <p className="text-sm text-foreground/50">Pick a task that matches your skills.</p>
        </div>

        {!loading && profile && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <Card className="px-4 py-2.5 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-glow" />
              <span className="text-sm font-medium text-foreground">{profile.points} pts</span>
            </Card>
            {profile.skills.length > 0 && (
              <Card className="px-4 py-2.5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-glow" />
                <span className="text-sm text-foreground/70">{profile.skills.length} skills listed</span>
              </Card>
            )}
          </motion.div>
        )}
      </div>

      <Suspense
        fallback={
          <div className="h-72 rounded-lg glass animate-pulse-glow flex items-center justify-center">
            <span className="text-xs text-foreground/40">Loading community view...</span>
          </div>
        }
      >
        <InteractionHub />
      </Suspense>
      <TaskList />
    </div>
  );
}
