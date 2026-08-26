import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search } from 'lucide-react';
import { Card, Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { useToast } from '@/lib/toast-context';
import type { UserProfile } from '@/lib/types';

export function VolunteerManager() {
  const { showToast } = useToast();
  const [volunteers, setVolunteers] = useState<UserProfile[]>(() => DataService.getUsers());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = DataService.subscribe<UserProfile[]>('users', (users) => {
      setVolunteers(users);
    });
    setVolunteers(DataService.getUsers());
    return () => unsub();
  }, []);

  const filtered = volunteers.filter((v) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchEmail = v.email.toLowerCase().includes(q);
      const matchSkill = v.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <h2 className="text-sm font-bold text-foreground">Volunteer Roster & Permissions</h2>
          <p className="text-xs text-foreground/50">Review the live volunteer roster and task-earned service points</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search volunteers by name, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-white/5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-glow/50"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:border-glow/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/30 to-glow/20 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-glow/30">
                  {v.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{v.name}</p>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                        v.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/10 text-foreground/60'
                      }`}
                    >
                      {v.role}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/50 truncate">
                    {v.email} · <span className="text-glow font-semibold">{v.points} pts</span>
                    {v.streak ? ` · ${v.streak}w streak` : ''}
                  </p>

                  {/* Skills */}
                  {v.skills && v.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {v.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.2 rounded-md bg-white/5 border border-border text-foreground/70"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground/60">
                  {v.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5 text-purple-300" /> : null}
                  {v.role === 'admin' ? 'Single Admin Account' : 'Volunteer Account'}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
