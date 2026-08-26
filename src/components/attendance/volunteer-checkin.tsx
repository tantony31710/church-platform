import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { DataService } from '@/lib/data-service';
import { ActiveSession, AttendanceRecord } from '@/lib/types';
import { useToast } from '@/lib/toast-context';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Flame,
  QrCode,
  KeyRound,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Award,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export function VolunteerCheckin() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [session, setSession] = useState<ActiveSession>(() => DataService.getActiveSession());
  const [enteredPin, setEnteredPin] = useState('');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubSession = DataService.subscribe<ActiveSession>('session', (s) => setSession(s));
    const unsubAtt = DataService.subscribe<AttendanceRecord[]>('attendance', (records) => {
      checkTodayStatus(records);
    });

    checkTodayStatus(DataService.getAttendance());

    return () => {
      unsubSession();
      unsubAtt();
    };
  }, [profile]);

  const checkTodayStatus = (records: AttendanceRecord[]) => {
    if (!profile) return;
    const todayStr = new Date().toDateString();
    const found = records.find(
      (r) => r.userId === profile.id && new Date(r.timestamp).toDateString() === todayStr
    );
    if (found) {
      setIsCheckedInToday(true);
      setTodayRecord(found);
    } else {
      setIsCheckedInToday(false);
      setTodayRecord(null);
    }
  };

  const triggerCheckinCelebration = () => {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#2dd4bf', '#38bdf8', '#fbbf24', '#a855f7'],
    });
    showToast('Verified check-in recorded. Your attendance streak has been updated.');
  };

  const handleInstantCheckIn = () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = DataService.checkInVolunteer(profile, 'qr_scan');
      if (res.alreadyCheckedIn) {
        showToast('You are already checked in for today’s service!', 'info');
      } else {
        triggerCheckinCelebration();
      }
    } catch (e) {
      console.error(e);
      showToast('Error during check-in. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePinCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!enteredPin || enteredPin.trim().length < 4) {
      showToast('Please enter a valid PIN code.', 'error');
      return;
    }

    if (enteredPin.trim() !== session.currentPin) {
      showToast('Incorrect PIN code. Check the screen or ask a service team leader.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = DataService.checkInVolunteer(profile, 'pin_code');
      if (res.alreadyCheckedIn) {
        showToast('You are already checked in today!', 'info');
      } else {
        triggerCheckinCelebration();
        setEnteredPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-12 max-w-4xl mx-auto">
      {/* Active Service Info Card */}
      <div className="md:col-span-7 flex flex-col gap-4">
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-glow animate-pulse" />
              ACTIVE SUNDAY SERVICE
            </span>
            <span className="text-xs text-foreground/50">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">{session.eventTitle}</h2>
          <p className="text-xs text-foreground/60 mb-6">
            Check in during Sunday services or serving shifts to earn volunteer attendance credits and keep your weekly streak active.
          </p>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/5 border border-border mb-6 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-glow shrink-0" />
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-semibold">Campus</p>
                <p className="font-semibold text-foreground truncate">{session.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-glow shrink-0" />
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-semibold">Service Time</p>
                <p className="font-semibold text-foreground">{session.startTime}</p>
              </div>
            </div>
          </div>

          {/* Checked in State vs Check-in Button */}
          {isCheckedInToday ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">You are Checked In Today!</h4>
                  <p className="text-xs text-foreground/70">
                    Recorded at {todayRecord ? new Date(todayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Service time'} · attendance telemetry saved
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="default"
                size="lg"
                onClick={handleInstantCheckIn}
                disabled={loading}
                className="w-full text-base font-bold shadow-[0_0_30px_hsl(var(--glow)/0.2)] py-4 h-auto"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {loading ? 'Verifying...' : '1-Click Instant Check-In'}
              </Button>

              {/* PIN Code option */}
              <form onSubmit={handlePinCheckIn} className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Or enter 6-digit PIN code..."
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-white/5 text-xs text-foreground font-mono placeholder:font-sans placeholder:text-foreground/40 focus:outline-none focus:border-glow/50"
                  />
                </div>
                <Button variant="secondary" type="submit" disabled={loading || !enteredPin}>
                  Submit PIN
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Streak & Attendance Summary */}
      <div className="md:col-span-5 flex flex-col gap-4">
        {/* Streak Highlight Card */}
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-foreground/50 uppercase font-bold tracking-wider">
                Service Consistency
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Flame className="h-3.5 w-3.5 fill-amber-400" />
                {profile?.streak || 1} Week Streak
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-foreground">{profile?.attendanceCount || 0}</span>
              <span className="text-xs text-foreground/50">total services attended</span>
            </div>

            <p className="text-xs text-foreground/60 leading-relaxed mb-4">
              Consistent attendance powers ministry teamwork. Reaching a 4-week streak unlocks the "Faithful Pillar" community badge!
            </p>
          </div>

          <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-foreground/50">Next milestone: 20 services</span>
            <span className="text-glow font-bold">0 points / service</span>
          </div>
        </div>

        {/* Info card */}
        <div className="glass rounded-xl border border-border p-4 text-xs text-foreground/60 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-glow shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-0.5">Need help checking in?</p>
            <p className="text-[11px] leading-relaxed">
              If your phone has no signal or camera issues, ask any Team Leader to check you in manually from their Admin roster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
