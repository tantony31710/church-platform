import { Suspense, lazy, useEffect, useState } from 'react';
import { TaskList } from '@/components/tasks/task-list';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';

// React.lazy + Suspense is Vite's equivalent of Next's
// next/dynamic(..., { ssr: false }) — except there's no ssr:false
// flag needed at all, since Vite has no server-side render pass to
// opt out of in the first place. This was the exact source of the
// "ssr: false not allowed in Server Components" build error we hit
// under Next.js.
const InteractionHub = lazy(() =>
  import('@/components/three/interaction-hub').then((m) => ({ default: m.InteractionHub }))
);

export default function TasksPage() {
  const { profile, loading } = useUserProfile();
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'announcements'), (snap) => {
      if (snap.exists()) {
        setAnnouncement(snap.data().message || null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">Available tasks</h1>
          <p className="text-sm text-foreground/50">Pick a task that matches your skills.</p>
        </div>
        
        {profile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong glow-ring px-4 py-2 rounded-full flex items-center gap-4 text-xs"
          >
            <span className="text-foreground/60">Welcome, <span className="text-foreground font-medium">{profile.name}</span></span>
            <div className="h-3 w-px bg-border" />
            <span className="text-foreground/60">Points: <span className="text-glow font-medium">{profile.points}</span></span>
            <div className="h-3 w-px bg-border" />
            <span className="text-foreground/60">Skills: <span className="text-foreground font-medium">{profile.skills?.length || 0}</span></span>
          </motion.div>
        )}
      </div>

      {announcement && <AnnouncementBanner message={announcement} />}

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
