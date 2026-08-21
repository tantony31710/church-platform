import { useState, useEffect } from 'react';
import { DataService } from '@/lib/data-service';
import { AiTaskMatch, Task, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Tag,
  Award
} from 'lucide-react';

export function AiMatchRecommendations() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState<AiTaskMatch[]>(() => DataService.getAiMatches());
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const unsubTasks = DataService.subscribe<Task[]>('tasks', () => {
      setMatches(DataService.getAiMatches());
    });
    const unsubUsers = DataService.subscribe<UserProfile[]>('users', () => {
      setMatches(DataService.getAiMatches());
    });
    return () => {
      unsubTasks();
      unsubUsers();
    };
  }, []);

  const handleApplyMatch = (match: AiTaskMatch) => {
    setAssigningId(match.taskId);
    try {
      const user = DataService.getUserById(match.volunteerId);
      if (user) {
        DataService.volunteerForTask(match.taskId, user);
        showToast(`Matched & assigned "${match.taskTitle}" to ${match.volunteerName}!`);
      }
    } finally {
      setAssigningId(null);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl bg-white/5 border border-border text-xs text-foreground/50">
        <Sparkles className="h-6 w-6 text-glow/40 mx-auto mb-2" />
        <p className="font-semibold text-foreground/70">All open tasks are currently matched or claimed.</p>
        <p className="text-[11px] mt-0.5">Create new tasks in Admin Hub to see AI suggestions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {matches.slice(0, 4).map((match, idx) => (
          <motion.div
            key={`${match.taskId}-${match.volunteerId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3.5 rounded-xl bg-white/5 border border-border hover:border-glow/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {match.matchScore}% Match
                </span>
                <span className="text-xs font-bold text-foreground truncate">
                  {match.volunteerName}
                </span>
                <ArrowRight className="h-3 w-3 text-foreground/40 shrink-0" />
                <span className="text-xs font-semibold text-glow truncate">
                  {match.taskTitle}
                </span>
              </div>
              <p className="text-[11px] text-foreground/60 line-clamp-1">{match.reason}</p>
            </div>

            <Button
              size="sm"
              variant="glow"
              onClick={() => handleApplyMatch(match)}
              disabled={assigningId === match.taskId}
              className="text-xs shrink-0 self-end sm:self-center"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              {assigningId === match.taskId ? 'Assigning...' : '1-Click Assign'}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
