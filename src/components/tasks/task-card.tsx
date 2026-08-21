import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { Task, UserProfile } from '@/lib/types';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  ListCheck
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  currentUser?: UserProfile | null;
  onVolunteer: (taskId: string) => void;
  onOpenDetails: (task: Task) => void;
  isSubmitting?: boolean;
}

export function TaskCard({
  task,
  currentUser,
  onVolunteer,
  onOpenDetails,
  isSubmitting = false,
}: TaskCardProps) {
  const isAssignedToMe = currentUser && task.assignedTo === currentUser.id;
  const isCompleted = task.status === 'completed';
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">NORMAL</span>;
    }
  };

  const formattedDate = () => {
    if (!task.deadline) return 'Upcoming';
    if (typeof task.deadline === 'string') {
      return new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    if (task.deadline.toDate) {
      return task.deadline.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return 'Upcoming';
  };

  return (
    <TiltCard className="group h-full">
      <motion.div
        layout
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        <Card className="p-5 flex flex-col justify-between h-full group-hover:border-glow/50 group-hover:shadow-[0_0_25px_hsl(var(--glow)/0.12)] transition-all relative overflow-hidden bg-white/5">
          {/* Top highlight bar */}
          {task.priority === 'urgent' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
          )}

          <div>
            {/* Header row: Category & Priority & Points */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-semibold text-glow/90 bg-glow/10 px-2.5 py-0.5 rounded-full border border-glow/20 truncate">
                {task.category || task.requiredSkill}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {getPriorityBadge(task.priority)}
                <span className="text-xs font-bold text-foreground bg-white/10 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                  <Award className="h-3 w-3 text-glow" />
                  {task.pointsValue} pts
                </span>
              </div>
            </div>

            {/* Title */}
            <h3
              onClick={() => onOpenDetails(task)}
              className="font-bold text-base text-foreground group-hover:text-glow transition-colors cursor-pointer line-clamp-1 mb-1.5"
            >
              {task.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-foreground/65 line-clamp-2 leading-relaxed mb-4">
              {task.description}
            </p>

            {/* Subtasks snippet (if any) */}
            {totalSubtasks > 0 && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-border/80 mb-3 text-xs flex items-center justify-between text-foreground/70">
                <span className="flex items-center gap-1.5">
                  <ListCheck className="h-3.5 w-3.5 text-glow" />
                  Checklist: {completedSubtasks}/{totalSubtasks}
                </span>
                <span className="font-semibold text-glow text-[11px]">
                  {Math.round((completedSubtasks / totalSubtasks) * 100)}%
                </span>
              </div>
            )}

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/50 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-foreground/40" />
                {formattedDate()}
              </span>
              {task.location && (
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin className="h-3 w-3 text-foreground/40 shrink-0" />
                  {task.location}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDetails(task)}
              className="flex-1 text-xs"
            >
              View Details
            </Button>

            {isCompleted ? (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </div>
            ) : isAssignedToMe ? (
              <Button
                variant="glow"
                size="sm"
                onClick={() => onOpenDetails(task)}
                className="text-xs"
              >
                My Task
              </Button>
            ) : task.status === 'open' ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => onVolunteer(task.id)}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? 'Joining...' : 'Volunteer'}
              </Button>
            ) : (
              <span className="text-[11px] text-foreground/40 font-medium px-2 py-1 bg-white/5 rounded-md">
                Claimed
              </span>
            )}
          </div>
        </Card>
      </motion.div>
    </TiltCard>
  );
}
