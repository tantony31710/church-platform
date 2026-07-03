import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TaskForm } from '@/components/admin/task-form';
import { TaskManager } from '@/components/admin/task-manager';
import { VolunteerManager } from '@/components/admin/volunteer-manager';

type Tab = 'tasks' | 'volunteers';

export default function AdminPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('tasks');
  const [refreshKey, setRefreshKey] = useState(0);

  if (role !== 'admin') {
    return <p className="text-sm text-foreground/50">This page is only available to church leaders.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">Admin</h1>
        <p className="text-sm text-foreground/50">Create tasks and manage volunteers.</p>
      </div>

      <div className="flex gap-1 w-fit p-1 rounded-lg glass">
        {(['tasks', 'volunteers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white/10 text-foreground' : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? (
        <div className="grid gap-6 md:grid-cols-[320px_1fr] items-start">
          <TaskForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <TaskManager key={refreshKey} />
        </div>
      ) : (
        <VolunteerManager />
      )}
    </div>
  );
}
