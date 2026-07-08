import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { ShieldCheck, Shield } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { Card } from '@/modules/ui/button';
import type { UserProfile } from '@/lib/types';

// Role promotion writes directly to users/{uid}.role. firestore.rules
// only allows this write path for callers where isAdmin() is true —
// the toggle below is a UI convenience, not the actual security
// boundary.
export function VolunteerManager() {
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVolunteers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, 'id'>) })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleRole = async (userId: string, currentRole: UserProfile['role']) => {
    await updateDoc(doc(db, 'users', userId), {
      role: currentRole === 'admin' ? 'volunteer' : 'admin',
    });
  };

  if (loading) return <p className="text-sm text-foreground/50">Loading volunteers...</p>;
  if (volunteers.length === 0) return <p className="text-sm text-foreground/50">No volunteers registered yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {volunteers.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <Card className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
              <p className="text-xs text-foreground/40 truncate">{v.email} · {v.points} pts</p>
            </div>
            <button
              onClick={() => toggleRole(v.id, v.role)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                v.role === 'admin'
                  ? 'border-glow/40 bg-glow/10 text-glow'
                  : 'border-border text-foreground/50 hover:border-glow/30 hover:text-foreground'
              }`}
            >
              {v.role === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
              {v.role === 'admin' ? 'Admin' : 'Volunteer'}
            </button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
