import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, Trash2, Circle, CircleDot } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { Card, Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';

const statusStyles: Record<Task['status'], { label: string; icon: typeof Circle; color: string }> = {
  open: { label: 'Open', icon: Circle, color: 'text-foreground/40' },
  assigned: { label: 'Assigned', icon: CircleDot, color: 'text-glow' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
};

// Shows every task regardless of status — unlike TaskList (volunteer
// view), which only shows 'open' ones. This is the admin's full
// picture: who claimed what, what's still pending completion.
export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('deadline', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const markComplete = async (taskId: string) => {
    // This write is what onTaskCompleted (Cloud Function) listens
    // for — flipping status here is what actually triggers the
    // volunteer's points to increment, via the transaction in
    // functions/src/onTaskCompleted.ts, not this line directly.
    await updateDoc(doc(db, 'tasks', taskId), { status: 'completed' });
  };

  const removeTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  if (loading) return <p className="text-sm text-foreground/50">Loading tasks...</p>;
  if (tasks.length === 0) return <p className="text-sm text-foreground/50">No tasks yet — create one above.</p>;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => {
          const status = statusStyles[task.status];
          const StatusIcon = status.icon;
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon className={`h-4 w-4 shrink-0 ${status.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-foreground/40">
                      {status.label} · {task.requiredSkill} · {task.pointsValue} pts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'assigned' && (
                    <Button size="sm" variant="outline" onClick={() => markComplete(task.id)}>
                      Mark complete
                    </Button>
                  )}
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-2 rounded-md hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-colors"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
