import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserMinus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  RefreshCw,
  HeartHandshake,
  Mail,
  Flame,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { PythonChurnPrediction } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

export function PythonMlChurnPredictor() {
  const { showToast } = useToast();
  const [predictions, setPredictions] = useState<PythonChurnPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTier, setFilterTier] = useState<'All' | 'High Risk' | 'Moderate Risk' | 'Healthy & Engaged'>('All');

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await DataService.fetchPythonChurnAnalysis();
      setPredictions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleActionClick = (volunteerName: string, action: string) => {
    showToast(`Action initiated for ${volunteerName}: ${action}`);
  };

  const filtered = predictions.filter((p) => {
    if (filterTier === 'All') return true;
    return p.riskTier === filterTier;
  });

  const highRiskCount = predictions.filter((p) => p.riskTier === 'High Risk').length;
  const modRiskCount = predictions.filter((p) => p.riskTier === 'Moderate Risk').length;
  const healthyCount = predictions.filter((p) => p.riskTier === 'Healthy & Engaged').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-red-400">High Churn Risk</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400">{highRiskCount}</p>
          <p className="text-[11px] text-foreground/50 mt-1">Requires immediate pastoral reach-out</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-400">Moderate Risk</span>
            <TrendingDown className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{modRiskCount}</p>
          <p className="text-[11px] text-foreground/50 mt-1">Declining attendance streak or task inactivity</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-400">Healthy & Engaged</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{healthyCount}</p>
          <p className="text-[11px] text-foreground/50 mt-1">Consistent weekly attendance & active tasks</p>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-border">
          {(['All', 'High Risk', 'Moderate Risk', 'Healthy & Engaged'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTier === tier
                  ? 'bg-glow text-background font-bold shadow-sm'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPredictions}
          disabled={loading}
          className="gap-2 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-run Python ML Model
        </Button>
      </div>

      {/* Volunteer Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.volunteerId}
            className={`p-5 rounded-2xl bg-white/5 border transition-all flex flex-col justify-between ${
              item.riskTier === 'High Risk'
                ? 'border-red-500/40 hover:border-red-500/60'
                : item.riskTier === 'Moderate Risk'
                ? 'border-amber-500/40 hover:border-amber-500/60'
                : 'border-border hover:border-glow/40'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-base font-bold text-foreground">{item.name}</h4>
                  <p className="text-xs text-foreground/50">{item.department}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    item.riskTier === 'High Risk'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : item.riskTier === 'Moderate Risk'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {item.riskTier} ({item.churnProbability}%)
                </span>
              </div>

              {/* Stat Chips */}
              <div className="flex items-center gap-3 my-3 text-xs text-foreground/70">
                <span className="flex items-center gap-1 font-semibold text-glow">
                  <Award className="h-3.5 w-3.5" />
                  {item.points} pts
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Flame className="h-3.5 w-3.5" />
                  {item.streak}w streak
                </span>
                <span className="text-foreground/50">
                  {item.tasksCompleted} tasks completed
                </span>
              </div>

              {/* Risk Factors */}
              <div className="mt-3 p-3 rounded-xl bg-background/60 border border-border/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1.5">
                  Python ML Feature Attribution:
                </p>
                <ul className="space-y-1">
                  {item.riskFactors.map((rf, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-glow shrink-0" />
                      {rf}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Retention Recommendation Action */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
              <span className="text-xs text-foreground/70 line-clamp-1 italic">
                👉 {item.retentionAction}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleActionClick(item.name, item.retentionAction)}
                className="text-xs gap-1.5 shrink-0"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                Engage
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
