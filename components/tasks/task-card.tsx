'use client';

import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onVolunteer: (taskId: string) => void;
  isSubmitting: boolean;
}

// Pure presentation + one callback. Keeping the Firestore write logic
// in the parent (task-list.tsx) means this component can be reused
// or storybook-tested without touching Firebase at all.
export function TaskCard({ task, onVolunteer, isSubmitting }: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-5 flex flex-col justify-between h-full">
        <div>
          <h3 className="font-medium text-base">{task.title}</h3>
          <p className="text-sm text-neutral-600 mt-1">{task.description}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
            <span>{task.requiredSkill}</span>
            <span>·</span>
            <span>{task.deadline.toDate().toLocaleDateString()}</span>
            <span>·</span>
            <span>{task.pointsValue} pts</span>
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => onVolunteer(task.id)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing you up...' : 'Volunteer now'}
        </Button>
      </Card>
    </motion.div>
  );
}
