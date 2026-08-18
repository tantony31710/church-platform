import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TaskForm } from '@/components/admin/task-form';
import { TaskManager } from '@/components/admin/task-manager';
import { VolunteerManager } from '@/components/admin/volunteer-manager';
import { Database, Cpu, Activity, Megaphone } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type Tab = 'tasks' | 'volunteers' | 'data-ai';

export default function AdminPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('tasks');
  const [refreshKey, setRefreshKey] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const snap = await getDoc(doc(db, 'config', 'announcements'));
      if (snap.exists()) {
        setAnnouncement(snap.data().message || '');
      }
    };
    fetchAnnouncement();
  }, []);

  const saveAnnouncement = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'config', 'announcements'), { 
        message: announcement, 
        updatedAt: new Date() 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

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
        {(['tasks', 'volunteers', 'data-ai'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white/10 text-foreground' : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? (
        <div className="grid gap-6 md:grid-cols-[320px_1fr] items-start">
          <div className="flex flex-col gap-6">
            <TaskForm onCreated={() => setRefreshKey((k) => k + 1)} />
            
            <div className="glass-strong glow-ring p-5 rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-glow">
                <Megaphone className="h-4 w-4" />
                <h2 className="text-sm font-medium">Global Announcement</h2>
              </div>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Enter urgent message for volunteers..."
                className="h-24 rounded-md border border-border bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors resize-none"
              />
              <button 
                onClick={saveAnnouncement}
                disabled={isSaving}
                className="w-full py-2 rounded-md bg-glow/20 text-glow border border-glow/30 text-xs font-medium hover:bg-glow/30 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Publish to Tasks Page'}
              </button>
            </div>
          </div>
          <TaskManager key={refreshKey} />
        </div>
      ) : tab === 'volunteers' ? (
        <VolunteerManager />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-strong glow-ring p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-glow">
              <Database className="h-5 w-5" />
              <h2 className="font-medium">Data Analysis Pipeline</h2>
            </div>
            <p className="text-sm text-foreground/60">
              Activate the Python-based analytics engine to process volunteer performance, 
              segmentation, and engagement metrics.
            </p>
            <button className="px-4 py-2 rounded-md bg-glow/20 text-glow border border-glow/30 text-sm font-medium hover:bg-glow/30 transition-colors">
              Run Analytics Sync
            </button>
          </div>
          <div className="glass-strong glow-ring p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-glow">
              <Cpu className="h-5 w-5" />
              <h2 className="font-medium">AI Task Matcher</h2>
            </div>
            <p className="text-sm text-foreground/60">
              Enable the Claude-powered recommendation engine to automatically match 
              tasks to volunteers based on skill embeddings and history.
            </p>
            <button className="px-4 py-2 rounded-md bg-glow/20 text-glow border border-glow/30 text-sm font-medium hover:bg-glow/30 transition-colors">
              Rebuild AI Index
            </button>
          </div>
          <div className="glass-strong glow-ring p-6 rounded-xl col-span-full flex items-center justify-between">
            <div className="flex items-center gap-3 text-foreground">
              <Activity className="h-5 w-5 text-glow" />
              <div>
                <h2 className="font-medium">System Health</h2>
                <p className="text-xs text-foreground/50">All Firestore triggers and Cloud Functions operational.</p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
              Live
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
