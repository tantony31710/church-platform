import { TaskList } from '@/components/tasks/task-list';
import InteractionHub from '@/components/three/interaction-hub-loader';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-medium text-foreground">Available tasks</h1>
        <p className="text-sm text-foreground/50">Pick a task that matches your skills.</p>
      </div>
      <InteractionHub />
      <TaskList />
    </div>
  );
}
