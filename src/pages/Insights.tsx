import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AttendanceChart, AttendancePoint } from '@/modules/insights/attendance-chart';
import { FeatureImportance } from '@/modules/insights/feature-importance';
import { DataDriftMonitor } from '@/modules/insights/data-drift-monitor';
import { EmbeddingClusters } from '@/modules/insights/embedding-clusters';
import { TimeSeriesDecomposition } from '@/modules/insights/time-series-decomposition';
import { CorrelationNetwork } from '@/modules/insights/correlation-network';
import { Users, CheckCircle, TrendingUp, Award } from 'lucide-react';

export default function InsightsPage() {
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    activeTasks: 0,
    totalPoints: 0,
  });
  const [attendanceData, setAttendanceData] = useState<AttendancePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs.map(d => d.data());
      const totalPoints = users.reduce((acc, u) => acc + (u.points || 0), 0);
      setStats(prev => ({ 
        ...prev, 
        totalVolunteers: snap.size, 
        totalPoints 
      }));
    });

    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const active = snap.docs.filter(d => d.data().status === 'open').length;
      setStats(prev => ({ ...prev, activeTasks: active }));
    });

    const unsubscribeAttendance = onSnapshot(collection(db, 'attendance'), (snap) => {
      const records = snap.docs.map(d => d.data());
      const aggregated: Record<string, number> = {};
      records.forEach(r => {
        if (r.timestamp) {
          const date = r.timestamp.toDate().toLocaleDateString();
          aggregated[date] = (aggregated[date] || 0) + 1;
        }
      });
      const data = Object.entries(aggregated).map(([date, count]) => ({ date, count }));
      setAttendanceData(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    });

    setLoading(false);
    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeAttendance();
    };
  }, []);

  if (loading) return <p className="text-sm text-foreground/50 p-4">Loading reports...</p>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-medium text-foreground">Community Reports</h1>
        <p className="text-sm text-foreground/50">Real-time data insights and volunteer engagement.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Users className="h-5 w-5" />} label="Total Volunteers" value={stats.totalVolunteers} color="text-glow" />
        <KPICard icon={<CheckCircle className="h-5 w-5" />} label="Open Tasks" value={stats.activeTasks} color="text-emerald-400" />
        <KPICard icon={<Award className="h-5 w-5" />} label="Points Distributed" value={stats.totalPoints} color="text-amber-400" />
        <KPICard icon={<TrendingUp className="h-5 w-5" />} label="Growth Rate" value="+12%" color="text-blue-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Attendance Trends</h2>
          <AttendanceChart data={attendanceData} />
        </div>
        <div className="glass-strong glow-ring p-6 rounded-xl flex flex-col gap-4">
          <h2 className="text-sm font-medium text-foreground mb-2">Data Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/50">Avg Points/User</span>
              <span className="text-xs font-medium text-foreground">
                {stats.totalVolunteers > 0 ? (stats.totalPoints / stats.totalVolunteers).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/50">Active Match Rate</span>
              <span className="text-xs font-medium text-foreground">84%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/50">Skill Coverage</span>
              <span className="text-xs font-medium text-foreground">92%</span>
            </div>
          </div>
          <button className="mt-auto w-full py-2 rounded-md bg-white/5 hover:bg-white/10 border border-border text-xs transition-colors">
            Export Full Report (CSV)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Feature Importance</h2>
          <FeatureImportance />
        </div>
        <div className="glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Data Drift Monitor</h2>
          <DataDriftMonitor />
        </div>
        <div className="glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Embedding Clusters</h2>
          <EmbeddingClusters />
        </div>
        <div className="glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Time-Series Decomposition</h2>
          <TimeSeriesDecomposition />
        </div>
        <div className="glass-strong glow-ring p-6 rounded-xl">
          <h2 className="text-sm font-medium text-foreground mb-6">Correlation Network</h2>
          <CorrelationNetwork />
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-strong glow-ring p-6 rounded-xl flex flex-col gap-3"
    >
      <div className={`p-2 w-fit rounded-lg bg-white/5 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-foreground/50 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}
