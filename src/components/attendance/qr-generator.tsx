import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { DataService } from '@/lib/data-service';
import { ActiveSession, AttendanceRecord } from '@/lib/types';
import {
  QrCode,
  KeyRound,
  RefreshCw,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Search,
  UserPlus,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';

export function QrGenerator() {
  const { showToast } = useToast();
  const [session, setSession] = useState<ActiveSession>(() => DataService.getActiveSession());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => DataService.getAttendance());
  const [manualSearch, setManualSearch] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  // Subscribe to session and attendance changes
  useEffect(() => {
    const unsubSession = DataService.subscribe<ActiveSession>('session', (s) => {
      setSession(s);
    });
    const unsubAttendance = DataService.subscribe<AttendanceRecord[]>('attendance', (records) => {
      setAttendance(records);
    });

    // 30-second token rotation
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          DataService.rotateActiveSessionToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsubSession();
      unsubAttendance();
      clearInterval(interval);
    };
  }, []);

  const handleManualRotate = () => {
    DataService.rotateActiveSessionToken();
    setTimeLeft(30);
    showToast('QR Token & PIN refreshed!');
  };

  const handleManualCheckIn = (user: any) => {
    const res = DataService.checkInVolunteer(user, 'manual_override');
    if (res.alreadyCheckedIn) {
      showToast(`${user.name} is already checked in today.`, 'info');
    } else {
      showToast(`Checked in ${user.name}! (+${res.pointsAwarded} pts)`);
    }
    setManualSearch('');
  };

  const handleExportCsv = () => {
    const todayRecords = attendance.filter(
      (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
    );
    const headers = 'ID,Name,Email,Event,Timestamp,Method,Points\n';
    const rows = todayRecords
      .map(
        (r) =>
          `"${r.id}","${r.userName}","${r.userEmail || ''}","${r.eventTitle}","${r.timestamp}","${r.method}","${r.pointsAwarded}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-roster-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Attendance CSV exported!');
  };

  const allUsers = DataService.getUsers();
  const searchResults = manualSearch.trim()
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(manualSearch.toLowerCase())
      )
    : [];

  const todayRecords = attendance.filter(
    (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
  );

  const scanUrl = `${window.location.origin}/attendance?token=${session.currentToken}&event=${session.eventId}&pin=${session.currentPin}`;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Live QR Code & PIN Display */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/15 text-glow font-bold border border-glow/30">
              LEADERSHIP BROADCAST
            </span>
            <button
              onClick={handleManualRotate}
              className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors"
              title="Force Refresh Code"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-1">{session.eventTitle}</h2>
          <p className="text-xs text-foreground/50 mb-6 flex items-center justify-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-glow" /> {session.location} · <Clock className="h-3.5 w-3.5 text-glow" /> {session.startTime}
          </p>

          {/* QR Code Container */}
          <div className="relative p-4 rounded-2xl bg-white shadow-2xl mb-4 glow-ring-strong">
            <AnimatePresence mode="wait">
              <motion.div
                key={session.currentToken}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25 }}
              >
                <QRCodeSVG value={scanUrl} size={210} level="M" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rolling PIN Code Display */}
          <div className="w-full p-3.5 rounded-xl bg-white/5 border border-border mb-4">
            <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-wider mb-1">
              Alternative 6-Digit Check-in PIN
            </p>
            <div className="flex items-center justify-center gap-2 font-mono text-2xl font-black text-glow tracking-widest">
              <KeyRound className="h-5 w-5 text-glow/70" />
              <span>{session.currentPin}</span>
            </div>
          </div>

          {/* Countdown & Security badge */}
          <div className="flex items-center justify-between w-full text-xs text-foreground/60 px-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-medium">Live Active Session</span>
            </div>
            <span className="font-mono text-glow">Refreshes in {timeLeft}s</span>
          </div>
        </div>

        {/* Manual Check-in Override Box */}
        <div className="glass rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-foreground">
            <UserPlus className="h-4 w-4 text-glow" />
            <span>Manual Volunteer Check-in</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-white/5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-glow/50"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-36 overflow-y-auto border border-border/80 rounded-lg p-1 bg-background/80">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-1.5 rounded text-xs hover:bg-white/10 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-foreground/40 truncate">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => handleManualCheckIn(u)}
                    className="h-6 px-2 text-[10px]"
                  >
                    Check In
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Attendees Roster */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass-strong rounded-2xl border border-border-strong p-6 shadow-xl flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80 mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-glow" />
                Live Checked-in Attendees ({todayRecords.length})
              </h2>
              <p className="text-xs text-foreground/50">Real-time attendance telemetry for today's service</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={todayRecords.length === 0}
              className="gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Roster (CSV)
            </Button>
          </div>

          {todayRecords.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-foreground/40">
              <Users className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-sm font-medium text-foreground/60">No volunteers checked in yet today.</p>
              <p className="text-xs max-w-xs mt-1">
                Display the QR code on the sanctuary monitor or share the 6-digit PIN with serving teams.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              <AnimatePresence>
                {todayRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border hover:border-glow/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-glow/20 text-glow flex items-center justify-center font-bold text-xs">
                        {record.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{record.userName}</p>
                        <p className="text-[10px] text-foreground/40 flex items-center gap-1.5">
                          <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>·</span>
                          <span className="capitalize">{record.method.replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-glow">+{record.pointsAwarded} pts</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
