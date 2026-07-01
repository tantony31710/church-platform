'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase/client';
import { Card } from '@/components/ui/button';
import type { LeaderboardEntry } from '@/lib/types';

// Reads from the small, function-maintained 'leaderboard' collection,
// NOT from scanning and sorting the full 'users' collection — see the
// integration notes on denormalized reads. This query stays cheap
// regardless of how many total volunteers the church has.
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(
        snapshot.docs.map((d, i) => ({
          id: d.id,
          ...(d.data() as Omit<LeaderboardEntry, 'id' | 'rank'>),
          rank: i + 1,
        }))
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Loading leaderboard...</p>;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-2">
      <h1 className="text-xl font-medium mb-2">Top volunteers</h1>
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-400 w-5">{entry.rank}</span>
              <span className="text-sm font-medium">{entry.name}</span>
            </div>
            <span className="text-sm text-neutral-600">{entry.points} pts</span>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
