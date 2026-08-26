import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Users,
  ArrowRight,
  RefreshCw,
  Zap,
  Tag,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { PythonOptimizedAssignment } from '@/lib/types';
import { useToast } from '@/lib/toast-context';

export function PythonTaskOptimizer() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<PythonOptimizedAssignment[]>([]);
  const [totalOptimized, setTotalOptimized] = useState(0);
  const [avgCompat, setAvgCompat] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchOptimization = async () => {
    setLoading(true);
    try {
      const data = await DataService.fetchPythonTaskOptimization();
      setAssignments(data.optimizedAssignments);
      setTotalOptimized(data.totalTasksOptimized);
      setAvgCompat(data.averageCompatibility);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, []);

  const handleApplySingle = (item: PythonOptimizedAssignment) => {
    const user = DataService.getUserById(item.matchedVolunteerId);
    if (!user) return;
    DataService.volunteerForTask(item.taskId, user);
    showToast(`Assigned "${item.taskTitle}" to ${item.matchedVolunteerName}`);
    fetchOptimization();
  };

  const handleApplyAll = () => {
    setApplying(true);
    let count = 0;
    assignments.forEach((item) => {
      const user = DataService.getUserById(item.matchedVolunteerId);
      if (user) {
        DataService.volunteerForTask(item.taskId, user);
        count++;
      }
    });
    setApplying(false);
    showToast(`Successfully auto-assigned ${count} tasks using Python optimization!`);
    fetchOptimization();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-glow/10 via-primary/10 to-accent/10 border border-glow/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/20 text-glow font-bold border border-glow/30">
              PYTHON BIPARTITE MATCHING
            </span>
            <span className="text-xs text-foreground/60">Hungarian Optimization Algorithm</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Intelligent Ministry Task Matchmaker
          </h3>
          <p className="text-xs sm:text-sm text-foreground/70 mt-1 max-w-2xl">
            Solves multi-variable constraint optimization by balancing volunteer workloads, historical streaks, department skill overlap, and urgency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOptimization}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>

          {assignments.length > 0 && (
            <Button
              size="sm"
              onClick={handleApplyAll}
              disabled={applying}
              className="gap-1.5 text-xs bg-glow text-background font-bold hover:brightness-110"
            >
              <Zap className="h-3.5 w-3.5" />
              Apply All {assignments.length} Matches
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/5 border border-border">
          <span className="text-xs text-foreground/50">Open Tasks Solved</span>
          <p className="text-2xl font-black text-glow mt-1">{totalOptimized}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-border">
          <span className="text-xs text-foreground/50">Avg Gifting Compatibility</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{avgCompat}%</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-border col-span-2 sm:col-span-1">
          <span className="text-xs text-foreground/50">Algorithm Type</span>
          <p className="text-base font-bold text-foreground mt-1 font-mono">Bipartite Matching (O(V*E))</p>
        </div>
      </div>

      {/* Recommended Assignments Roster */}
      {assignments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/5 border border-border text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-base font-bold text-foreground">All Tasks Balanced</h4>
          <p className="text-xs text-foreground/60 mt-1">
            No open unassigned tasks currently require algorithmic matching.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((item) => (
            <div
              key={item.taskId}
              className="p-4 rounded-xl bg-white/5 border border-border hover:border-glow/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-glow/15 text-glow">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-glow flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    +{item.pointsValue} pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{item.taskTitle}</h4>
                <p className="text-xs text-foreground/60 mt-1">{item.reason}</p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-glow" />
                    <span className="text-xs font-bold text-foreground">
                      {item.matchedVolunteerName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    {item.compatibilityScore}% Compatibility
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplySingle(item)}
                  className="gap-1.5 text-xs text-glow hover:bg-glow/10 border-glow/30"
                >
                  Confirm Assignment
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
