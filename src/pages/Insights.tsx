import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataService } from '@/lib/data-service';
import { AttendanceChart } from '@/components/insights/attendance-chart';
import { DepartmentDistribution } from '@/components/insights/department-distribution';
import { DataDriftMonitor } from '@/components/insights/data-drift-monitor';
import { EmbeddingClusters } from '@/components/insights/embedding-clusters';
import { TimeSeriesDecomposition } from '@/components/insights/time-series-decomposition';
import { PythonRagAssistant } from '@/components/insights/python-rag-assistant';
import { PythonMlChurnPredictor } from '@/components/insights/python-ml-churn-predictor';
import { PythonTaskOptimizer } from '@/components/insights/python-task-optimizer';
import { PythonDataWorkbench } from '@/components/insights/python-data-workbench';
import { Card, Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
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
  Flame,
  Brain,
  Terminal,
  UserMinus,
  Layers,
  Search
} from 'lucide-react';

type InsightsTab = 'analytics' | 'rag' | 'churn' | 'optimizer' | 'workbench' | 'drift';

export default function InsightsPage() {
  const { showToast } = useToast();
  const { role, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<InsightsTab>('rag');
  const [users, setUsers] = useState(() => DataService.getUsers());
  const [tasks, setTasks] = useState(() => DataService.getTasks());
  const [attendance, setAttendance] = useState(() => DataService.getAttendance());
  const [reportRunning, setReportRunning] = useState(false);

  useEffect(() => {
    if (role !== 'admin' && activeTab !== 'rag') setActiveTab('rag');
  }, [role, activeTab]);

  useEffect(() => {
    const unsubscribeUsers = DataService.subscribe('users', setUsers);
    const unsubscribeTasks = DataService.subscribe('tasks', setTasks);
    const unsubscribeAttendance = DataService.subscribe('attendance', setAttendance);
    setUsers(DataService.getUsers());
    setTasks(DataService.getTasks());
    setAttendance(DataService.getAttendance());
    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeAttendance();
    };
  }, []);

  const totalVolunteers = role === 'admin' ? users.length : 1;
  const openTasks = tasks.filter((t) => t.status === 'open').length;
  const totalPoints = users.reduce((acc, u) => acc + (u.points || 0), 0);
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;

  const handleExportReport = async () => {
    setReportRunning(true);
    try {
      const response = await DataService.fetchPythonAnalyticsReport(true);
      const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `church-insights-report-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Live Python analytics report generated and saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to generate the analytics report.', 'error');
    } finally {
      setReportRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
                AI & DATA SCIENCE HUB
              </span>
              <span className="text-xs text-foreground/50">Python ML Models, RAG Knowledge & Advanced Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ministry Insights & AI Suite
            </h1>
          </div>

          {role === 'admin' && (
                          <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                disabled={reportRunning}
                className="gap-2 self-start sm:self-auto"
              >
                <Download className="h-4 w-4" />
                {reportRunning ? 'Generating Live Report…' : 'Generate & Export Live Report (JSON)'}
              </Button>

          )}
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-white/5 border border-border">
            <div className="flex items-center gap-2 text-foreground/50 mb-1">
              <Users className="h-4 w-4 text-glow" />
              <span className="text-[11px] uppercase font-semibold">{role === 'admin' ? 'Active Volunteers' : 'Your Points'}</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{role === 'admin' ? totalVolunteers : profile?.points || 0}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">{role === 'admin' ? 'Live Firestore roster' : 'Earned from completed tasks'}</p>
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
              <span className="text-[11px] uppercase font-semibold">Python Engine Status</span>
            </div>
            <p className="text-2xl font-extrabold text-glow">Protected</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Authenticated Python API</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl glass border border-border">
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'rag' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Brain className="h-3.5 w-3.5" />
          <span>Python RAG & SOP AI</span>
        </button>

        {role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('churn')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'churn' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <UserMinus className="h-3.5 w-3.5" />
              <span>ML Churn & Retention</span>
            </button>

            <button
              onClick={() => setActiveTab('optimizer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'optimizer' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Task Matchmaker</span>
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'workbench' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Python Data Workbench</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Attendance & Departments</span>
            </button>

            <button
              onClick={() => setActiveTab('drift')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'drift' ? 'bg-glow text-background font-bold shadow-sm' : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Embeddings & Drift</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Python RAG Assistant */}
      {activeTab === 'rag' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PythonRagAssistant />
        </motion.div>
      )}

      {/* Tab 2: Python ML Churn Predictor */}
      {activeTab === 'churn' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PythonMlChurnPredictor />
        </motion.div>
      )}

      {/* Tab 3: Python Task Optimizer */}
      {activeTab === 'optimizer' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PythonTaskOptimizer />
        </motion.div>
      )}

      {/* Tab 4: Python Data Workbench */}
      {activeTab === 'workbench' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PythonDataWorkbench />
        </motion.div>
      )}

      {/* Tab 5: Analytics Charts */}
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

      {/* Tab 6: Data Drift & Embeddings */}
      {activeTab === 'drift' && (
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
