import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { TaskForm } from '@/components/admin/task-form';
import { TaskManager } from '@/components/admin/task-manager';
import { VolunteerManager } from '@/components/admin/volunteer-manager';
import { ChurchSettingsManager } from '@/components/admin/church-settings';
import { DataService } from '@/lib/data-service';
import { useToast } from '@/lib/toast-context';
import { Button, Card } from '@/components/ui/button';
import {
  ShieldCheck,
  ListTodo,
  Users,
  Megaphone,
  Database,
  Sparkles,
  RotateCcw,
  Download,
  AlertTriangle,
  Radio,
  Church,
  Settings
} from 'lucide-react';

type Tab = 'organization' | 'tasks' | 'volunteers' | 'announcements' | 'data-tools';

export default function AdminPage() {
  const { role, profile } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('organization');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'urgent' | 'announcement'>('urgent');

  useEffect(() => {
    const current = DataService.getAnnouncement();
    if (current) {
      setAnnouncementMsg(current.message || '');
      setAnnouncementPriority(current.priority || 'urgent');
    }
  }, []);

  if (role !== 'admin') {
    return <Navigate to="/tasks" replace />;
  }

  const handleSaveAnnouncement = () => {
    DataService.saveAnnouncement(announcementMsg, announcementPriority, profile?.name || 'Pastor David');
    showToast(announcementMsg.trim() ? 'Global announcement broadcasted!' : 'Announcement cleared.');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                PASTORAL & ADMIN CONSOLE
              </span>
              <span className="text-xs text-foreground/50">Ministry Operations & Task Coordination</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Church Administration Center
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-border text-foreground/70">
              Active Admin: <strong className="text-foreground">{role === 'admin' ? profile?.name : 'Pastor David Anderson'}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 rounded-xl glass border border-border self-start mt-6 flex-wrap gap-1">
          <button
            onClick={() => setTab('organization')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'organization' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Church className="h-3.5 w-3.5" />
            <span>Church Profile & Settings</span>
          </button>

          <button
            onClick={() => setTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'tasks' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Ministry Tasks & Needs</span>
          </button>

          <button
            onClick={() => setTab('volunteers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'volunteers' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Volunteer Roster (Single Admin)</span>
          </button>

          <button
            onClick={() => setTab('announcements')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'announcements' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Global Announcements</span>
          </button>

          <button
            onClick={() => setTab('data-tools')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'data-tools' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Live Data & AI</span>
          </button>
        </div>
      </div>

      {/* Tab 0: Church Profile */}
      {tab === 'organization' && (
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
          <ChurchSettingsManager />
        </div>
      )}

      {/* Tab 1: Tasks */}
      {tab === 'tasks' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5">
            <TaskForm />
          </div>
          <div className="lg:col-span-7 glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <h2 className="text-sm font-bold text-foreground mb-1">Live Ministry Task Directory</h2>
            <p className="text-xs text-foreground/50 mb-4">Review all pending, assigned, and completed needs</p>
            <TaskManager />
          </div>
        </div>
      )}

      {/* Tab 2: Volunteers */}
      {tab === 'volunteers' && (
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
          <VolunteerManager />
        </div>
      )}

      {/* Tab 3: Announcements */}
      {tab === 'announcements' && (
        <div className="max-w-2xl mx-auto glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
          <div className="flex items-center gap-2 text-glow mb-2">
            <Megaphone className="h-5 w-5" />
            <h2 className="text-base font-bold text-foreground">Global Church Announcement Banner</h2>
          </div>
          <p className="text-xs text-foreground/50 mb-4">
            This banner displays on every volunteer's dashboard immediately when published.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
                Announcement Message
              </label>
              <textarea
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                placeholder="e.g. 🔔 Welcome to Sunday service! Sound board & Hospitality check-in now open..."
                rows={4}
                className="w-full rounded-xl border border-border bg-white/5 p-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-foreground/70 font-medium">Priority Level:</label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                className="h-8 rounded-lg border border-border bg-card-bg px-2 text-xs text-foreground focus:outline-none focus:border-glow/50"
              >
                <option value="urgent" className="bg-background">Urgent (Glowing Alert)</option>
                <option value="normal" className="bg-background">Normal Notice</option>
                <option value="announcement" className="bg-background">General Info</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveAnnouncement} className="font-bold">
                Publish Announcement
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAnnouncementMsg('');
                  DataService.saveAnnouncement('', 'normal');
                  showToast('Announcement cleared.');
                }}
              >
                Clear Banner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live Data & AI */}
      {tab === 'data-tools' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl lg:col-span-2">
            <div className="flex items-center gap-2 text-glow mb-2">
              <Database className="h-5 w-5" />
              <h2 className="text-base font-bold text-foreground">Live Firestore Data Sources</h2>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed mb-5">
              Users, tasks, attendance, announcements, and church settings are synchronized from Firestore. There are no browser-only seed records in the authenticated workspace.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Users', 'Live user profiles, roles, and task-earned points'],
                ['Tasks', 'Assignments and completion status with audit-safe updates'],
                ['Attendance', 'Check-in records used as engagement telemetry'],
                ['AI & Insights', 'Python RAG, ML predictions, clustering, and analysis'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-xl border border-border bg-white/5 p-4">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-foreground/55">{description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-base font-bold text-foreground">Points Policy</h2>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Every volunteer starts at <strong className="text-foreground">0 points</strong>. Points are awarded once, by the trusted task-completion trigger, after a task changes to completed. Attendance never grants points.
            </p>
            <Button variant="glow" className="mt-5 w-full" onClick={() => window.location.assign('/insights')}>
              Open AI & Insights
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
