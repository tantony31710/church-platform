import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { QrGenerator } from '@/components/attendance/qr-generator';
import { VolunteerCheckin } from '@/components/attendance/volunteer-checkin';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Flame,
  Radio
} from 'lucide-react';

export default function AttendancePage() {
  const { role } = useAuth();
  const [viewMode, setViewMode] = useState<'checkin' | 'broadcast'>(() =>
    role === 'admin' ? 'broadcast' : 'checkin'
  );

  useEffect(() => {
    if (role !== 'admin' && viewMode === 'broadcast') setViewMode('checkin');
  }, [role, viewMode]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
              SERVICE CHECK-IN
            </span>
            <span className="text-xs text-foreground/50">
              Sunday Gatherings & Ministry Serving Shifts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Attendance & Community Telemetry
          </h1>
        </div>

        {/* View Mode Toggle */}
        <div className="flex p-1 rounded-xl glass border border-border self-start sm:self-auto">
          <button
            onClick={() => setViewMode('checkin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'checkin'
                ? 'bg-glow/20 text-glow border border-glow/30 shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Volunteer Check-In</span>
          </button>

          {role === 'admin' && (
          <button
            onClick={() => setViewMode('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'broadcast'
                ? 'bg-glow/20 text-glow border border-glow/30 shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Leader QR Broadcast</span>
            {role === 'admin' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                Admin
              </span>
            )}
          </button>
          )}
        </div>
      </div>

      {/* Render Active View */}
      <AnimatePresence mode="wait">
        {viewMode === 'checkin' ? (
          <motion.div
            key="checkin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <VolunteerCheckin />
          </motion.div>
        ) : (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <QrGenerator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
