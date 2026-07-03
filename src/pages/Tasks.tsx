import { Suspense, lazy } from 'react';
import { TaskList } from '@/components/tasks/task-list';

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
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-medium text-foreground">Available tasks</h1>
        <p className="text-sm text-foreground/50">Pick a task that matches your skills.</p>
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
