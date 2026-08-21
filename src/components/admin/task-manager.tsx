import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, Circle, CircleDot, UserX, Award, Calendar, Search } from 'lucide-react';
import { Card, Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { useToast } from '@/lib/toast-context';
import type { Task } from '@/lib/types';

const statusStyles: Record<Task['status'], { label: string; icon: typeof Circle; color: string; bg: string }> = {
  open: { label: 'Open', icon: Circle, color: 'text-foreground/40', bg: 'bg-white/5' },
  assigned: { label: 'Assigned', icon: CircleDot, color: 'text-glow', bg: 'bg-glow/10 border-glow/30' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

export function TaskManager() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(() => DataService.getTasks());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const unsub = DataService.subscribe<Task[]>('tasks', (newTasks) => {
      setTasks(newTasks);
    });
    setTasks(DataService.getTasks());
    return () => unsub();
  }, []);

  const markComplete = (taskId: string) => {
    const result = DataService.completeTask(taskId);
    if (result) {
      showToast(`Task marked completed! +${result.pointsAwarded} pts credited.`);
    }
  };

  const handleUnassign = (taskId: string) => {
    const updated = DataService.unassignTask(taskId);
    if (updated) {
      showToast(`Unassigned volunteer from task "${updated.title}".`);
    }
  };

  const removeTask = (taskId: string) => {
    const success = DataService.deleteTask(taskId);
    if (success) {
      showToast('Task deleted.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchSkill = t.requiredSkill.toLowerCase().includes(q);
      const matchAssignee = t.assignedToName?.toLowerCase().includes(q);
      if (!matchTitle && !matchSkill && !matchAssignee) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search all tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-white/5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-glow/50"
          />
        </div>

        <div className="flex p-0.5 rounded-lg glass border border-border self-start sm:self-auto text-xs">
          {['all', 'open', 'assigned', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                statusFilter === st ? 'bg-glow/20 text-glow' : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white/5 border border-border text-xs text-foreground/50">
          No tasks found matching your filters.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const status = statusStyles[task.status] || statusStyles.open;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border transition-colors ${status.bg}`}>
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <StatusIcon className={`h-4 w-4 shrink-0 mt-0.5 sm:mt-0 ${status.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground truncate">{task.title}</p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-white/10 text-foreground/70">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/50 mt-0.5">
                          {status.label} · {task.pointsValue} pts · {task.assignedToName ? `Assigned to ${task.assignedToName}` : 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {task.status === 'assigned' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUnassign(task.id)}
                            className="h-7 px-2 text-[10px] gap-1"
                            title="Unassign Volunteer"
                          >
                            <UserX className="h-3 w-3" /> Unassign
                          </Button>
                          <Button
                            size="sm"
                            variant="glow"
                            onClick={() => markComplete(task.id)}
                            className="h-7 px-2.5 text-[10px] gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark Done
                          </Button>
                        </>
                      )}

                      {task.status === 'open' && (
                        <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10">
                          Ready for volunteers
                        </span>
                      )}

                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-colors"
                        aria-label="Delete task"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
