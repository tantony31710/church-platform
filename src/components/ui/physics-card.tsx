import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PhysicsCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export const PhysicsCard = ({ children, className, ...props }: PhysicsCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('bg-card p-4 rounded-xl shadow-lg', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
