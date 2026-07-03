import { motion } from 'framer-motion';
import { Card, Button } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onVolunteer: (taskId: string) => void;
  isSubmitting: boolean;
}

export function TaskCard({ task, onVolunteer, isSubmitting }: TaskCardProps) {
  return (
    <TiltCard className="group h-full">
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Card className="p-5 flex flex-col justify-between h-full transition-colors duration-300 group-hover:border-glow/40 group-hover:shadow-[0_0_30px_hsl(var(--glow)/0.12)]">
          <div>
            <h3 className="font-medium text-base text-foreground">{task.title}</h3>
            <p className="text-sm text-foreground/60 mt-1 leading-relaxed">{task.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-xs text-foreground/45">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-border">{task.requiredSkill}</span>
              <span>{task.deadline.toDate().toLocaleDateString()}</span>
              <span className="text-glow font-medium">{task.pointsValue} pts</span>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={() => onVolunteer(task.id)} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="h-3 w-3 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                />
                Signing you up...
              </span>
            ) : (
              'Volunteer now'
            )}
          </Button>
        </Card>
      </motion.div>
    </TiltCard>
  );
}
