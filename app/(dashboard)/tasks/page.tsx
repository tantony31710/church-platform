import dynamic from 'next/dynamic';
import { TaskList } from '@/components/tasks/task-list';

// The 3D hub is lazy-loaded with ssr:false so it never blocks the
// initial dashboard paint or gets bundled into the server render —
// the task list above renders and becomes interactive immediately,
// the hub fills in a moment later.
const InteractionHub = dynamic(
  () => import('@/components/three/interaction-hub').then((m) => m.InteractionHub),
  { ssr: false, loading: () => <div className="h-64 rounded-lg bg-neutral-100 animate-pulse" /> }
);

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-medium">Available tasks</h1>
        <p className="text-sm text-neutral-500">Pick a task that matches your skills.</p>
      </div>
      <InteractionHub />
      <TaskList />
    </div>
  );
}
