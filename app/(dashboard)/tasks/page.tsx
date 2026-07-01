import { TaskList } from '@/components/tasks/task-list';
import InteractionHub from '@/components/three/interaction-hub-loader';

// This page has no 'use client' — it's a Server Component. That's
// fine even though everything it renders (TaskList, InteractionHub)
// is client-side under the hood: the dynamic ssr:false logic lives in
// interaction-hub-loader.tsx instead of here, which is what keeps
// this file buildable as a Server Component.

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
