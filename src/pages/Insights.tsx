import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataService } from '@/lib/data-service';
import { AttendanceChart } from '@/components/insights/attendance-chart';
import { DepartmentDistribution } from '@/components/insights/department-distribution';
import { AiMatchRecommendations } from '@/components/insights/ai-match-recommendations';
import { FeatureImportance } from '@/components/insights/feature-importance';
import { DataDriftMonitor } from '@/components/insights/data-drift-monitor';
import { EmbeddingClusters } from '@/components/insights/embedding-clusters';
import { TimeSeriesDecomposition } from '@/components/insights/time-series-decomposition';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Download,
  Activity,
  Cpu,
  BarChart3,
  Flame
} from 'lucide-react';

export default function InsightsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai' | 'datascience'>('analytics');

  const users = DataService.getUsers();
  const tasks = DataService.getTasks();
  const attendance = DataService.getAttendance();

  const totalVolunteers = users.length;
  const openTasks = tasks.filter((t) => t.status === 'open').length;
  const totalPoints = users.reduce((acc, u) => acc + (u.points || 0), 0);
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      church: 'Grace Community Church',
      summary: {
        totalVolunteers,
        openTasks,
        totalPoints,
        totalCompletedTasks: totalCompleted,
      },
      volunteers: users.map((u) => ({
        name: u.name,
        email: u.email,
        points: u.points,
        role: u.role,
        skills: u.skills,
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        status: t.status,
        points: t.pointsValue,
        assignedTo: t.assignedToName || 'Unassigned',
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church-insights-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Analytics report exported as JSON!');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
                INTELLIGENCE & METRICS
              </span>
              <span className="text-xs text-foreground/50">Volunteer Workforce & Engagement Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ministry Insights & AI Hub
            </h1>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportReport} className="gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export Full Analytics (JSON)
          </Button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center gap-2 text-foreground/50 mb-1">
              <Users className="h-4 w-4 text-glow" />
              <span className="text-[11px] uppercase font-semibold">Active Volunteers</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{totalVolunteers}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">+14% vs last month</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center gap-2 text-foreground/50 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] uppercase font-semibold">Open Needs</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{openTasks}</p>
            <p className="text-[10px] text-foreground/50 mt-0.5 font-medium">{totalCompleted} tasks completed</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center gap-2 text-foreground/50 mb-1">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] uppercase font-semibold">Points Distributed</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-400">{totalPoints}</p>
            <p className="text-[10px] text-foreground/50 mt-0.5 font-medium">Avg {(totalPoints / (totalVolunteers || 1)).toFixed(0)} pts/member</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center gap-2 text-foreground/50 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-[11px] uppercase font-semibold">Match Accuracy</span>
            </div>
            <p className="text-2xl font-extrabold text-glow">94.8%</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Cosine skill alignment</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-xl glass border border-border self-start">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'analytics' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Attendance & Departments</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ai' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Task Recommendations</span>
        </button>

        <button
          onClick={() => setActiveTab('datascience')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'datascience' ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>ML Benchmarks & Drift</span>
        </button>
      </div>

      {/* Tab 1: Community Analytics */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-glow" />
                Sunday Attendance Trends
              </h2>
              <span className="text-xs text-foreground/50">Weekly Vol. Turnout</span>
            </div>
            <AttendanceChart />
          </div>

          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-glow" />
                Completed Ministry Tasks by Department
              </h2>
              <span className="text-xs text-foreground/50">YTD Volume</span>
            </div>
            <DepartmentDistribution />
          </div>
        </motion.div>
      )}

      {/* Tab 2: AI Recommendations */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-12"
        >
          <div className="lg:col-span-8 glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-glow" />
                  Intelligent Task & Volunteer Matchmaker
                </h2>
                <p className="text-xs text-foreground/50">
                  Matches volunteer skill vectors with open serving requirements
                </p>
              </div>
            </div>
            <AiMatchRecommendations />
          </div>

          <div className="lg:col-span-4 glass-strong rounded-2xl border border-border-strong p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-glow" />
                Matching Algorithm Features
              </h2>
              <FeatureImportance />
            </div>
            <div className="mt-4 pt-3 border-t border-border/80 text-[11px] text-foreground/50">
              Weights updated dynamically based on completion ratings & weekly streaks.
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Data Science & ML Benchmarks */}
      {activeTab === 'datascience' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-glow" />
              Volunteer Feature Data Drift Monitor
            </h2>
            <p className="text-xs text-foreground/50 mb-4">Kolmogorov-Smirnov feature distribution tracking</p>
            <DataDriftMonitor />
          </div>

          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl">
            <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-glow" />
              Skill Embedding Clusters (t-SNE 2D)
            </h2>
            <p className="text-xs text-foreground/50 mb-4">Volunteer giftings and technical skill clusters</p>
            <EmbeddingClusters />
          </div>

          <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl md:col-span-2">
            <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-glow" />
              Time Series Seasonality Decomposition
            </h2>
            <p className="text-xs text-foreground/50 mb-4">Seasonal vs Trend volunteer attendance component separation</p>
            <TimeSeriesDecomposition />
          </div>
        </motion.div>
      )}
    </div>
  );
}
