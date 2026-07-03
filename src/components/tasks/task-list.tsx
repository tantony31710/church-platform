import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth-context';
import { TaskCard } from './task-card';
import type { Task } from '@/lib/types';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const tasksQuery = query(collection(db, 'tasks'), where('status', '==', 'open'));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }));
        console.log('Open tasks:', fetched);
        setTasks(fetched);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleVolunteer = async (taskId: string) => {
    if (!user) {
      setError('You must be logged in to volunteer.');
      return;
    }
    setVolunteeringId(taskId);
    try {
      await updateDoc(doc(db, 'tasks', taskId), { assignedTo: user.uid, status: 'assigned' });
    } catch (err) {
      console.error('Error volunteering:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setVolunteeringId(null);
    }
  };

  if (loading) return <p className="text-sm text-foreground/50 p-4">Loading available tasks...</p>;
  if (error) return <p className="text-sm text-red-400 p-4">{error}</p>;
  if (tasks.length === 0) return <p className="text-sm text-foreground/50 p-4">No open tasks right now.</p>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onVolunteer={handleVolunteer} isSubmitting={volunteeringId === task.id} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
