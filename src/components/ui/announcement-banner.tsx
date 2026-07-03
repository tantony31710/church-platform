import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

interface AnnouncementBannerProps {
  message: string;
}

export function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong glow-ring p-3 rounded-lg flex items-center gap-3 border-l-4 border-l-glow"
    >
      <div className="p-1.5 rounded-full bg-glow/20 text-glow">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-foreground font-medium">
          <span className="text-glow mr-2">[Urgent]</span>
          {message}
        </p>
      </div>
    </motion.div>
  );
}
