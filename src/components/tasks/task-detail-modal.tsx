import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  User,
  Tag,
  CheckSquare
} from 'lucide-react';
import { Task, UserProfile } from '@/lib/types';
import { Button, Card } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import confetti from 'canvas-confetti';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onVolunteer: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onComplete: (taskId: string) => void;
  isSubmitting?: boolean;
}

export function TaskDetailModal({
  task,
  currentUser,
  onClose,
  onVolunteer,
  onToggleSubtask,
  onComplete,
  isSubmitting = false,
}: TaskDetailModalProps) {
  if (!task) return null;

  const isAssignedToMe = currentUser && task.assignedTo === currentUser.id;
  const isCompleted = task.status === 'completed';
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleFinishTask = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2dd4bf', '#38bdf8', '#fbbf24'],
    });
    onComplete(task.id);
  };

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-border-strong p-6 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow border border-glow/30 font-semibold">
              {task.category}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase ${getPriorityStyle(
                task.priority
              )}`}
            >
              {task.priority} Priority
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-foreground font-semibold flex items-center gap-1 border border-border">
              <Award className="h-3.5 w-3.5 text-glow" />
              {task.pointsValue} Points
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2 leading-tight">
            {task.title}
          </h2>

          <p className="text-sm text-foreground/70 leading-relaxed mb-6">
            {task.description}
          </p>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/5 border border-border mb-6 text-xs">
            <div className="flex items-center gap-2 text-foreground/70">
              <Calendar className="h-4 w-4 text-glow shrink-0" />
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-semibold">Deadline</p>
                <p className="font-medium text-foreground">
                  {typeof task.deadline === 'string'
                    ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : task.deadline?.toDate?.()
                    ? task.deadline.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : 'Upcoming'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-foreground/70">
              <Clock className="h-4 w-4 text-glow shrink-0" />
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-semibold">Est. Duration</p>
                <p className="font-medium text-foreground">{task.estimatedTime ? `${task.estimatedTime} hours` : '1.5 - 2 hrs'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-foreground/70 col-span-2 sm:col-span-1">
              <MapPin className="h-4 w-4 text-glow shrink-0" />
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-semibold">Location</p>
                <p className="font-medium text-foreground truncate">{task.location || 'Church Sanctuary'}</p>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-glow" />
                Action Checklist ({completedSubtasks}/{totalSubtasks})
              </h3>
              {totalSubtasks > 0 && (
                <span className="text-xs font-semibold text-glow">{progressPercent}% complete</span>
              )}
            </div>

            {/* Progress Bar */}
            {totalSubtasks > 0 && (
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="space-y-2">
                {task.subtasks.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onToggleSubtask(task.id, st.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      st.completed
                        ? 'bg-glow/10 border-glow/30 text-foreground/70'
                        : 'bg-white/5 border-border hover:border-glow/40 text-foreground'
                    }`}
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-glow shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs ${st.completed ? 'line-through opacity-70' : 'font-medium'}`}>
                      {st.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground/40 italic">No specific subtasks listed for this assignment.</p>
            )}
          </div>

          {/* Assigned Status / Action Buttons */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-foreground/60 w-full sm:w-auto">
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-glow" />
                  <span>Assigned to: <strong className="text-foreground">{task.assignedToName || 'A volunteer'}</strong></span>
                </div>
              ) : (
                <span className="text-emerald-400 font-medium">● Open for signup</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isCompleted ? (
                <div className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Task Completed (+{task.pointsValue} pts)
                </div>
              ) : isAssignedToMe ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="glow"
                    onClick={handleFinishTask}
                    className="flex-1 sm:flex-initial"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Finished & Claim Points
                  </Button>
                </div>
              ) : task.status === 'open' ? (
                <Button
                  variant="default"
                  onClick={() => onVolunteer(task.id)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Signing up...' : 'Volunteer for this Task'}
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  Task Already Claimed
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
