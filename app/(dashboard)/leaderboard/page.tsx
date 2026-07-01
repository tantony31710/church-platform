'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { onSnapshot, collection, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '@/lib/firebase/client';
import { Card, Button } from '@/components/ui/button';
import { usePaginatedQuery } from '@/lib/hooks/use-paginated-query';
import type { LeaderboardEntry } from '@/lib/types';

// The top 10 stay live (onSnapshot) so the podium updates in
// real time as points come in. Everything past #10 loads via
// cursor-based pagination on demand ("Load more") instead of
// subscribing live — a live listener on an unbounded, ever-growing
// list is the exact pattern that gets expensive as the church grows.
export default function LeaderboardPage() {
  const [topTen, setTopTen] = useState<(LeaderboardEntry)[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  const { items: extra, loadMore, hasMore, loading: loadingMore } = usePaginatedQuery<
    Omit<LeaderboardEntry, 'id' | 'rank'>
  >('leaderboard', [orderBy('points', 'desc')], 10);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('points', 'desc'), fbLimit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopTen(
        snapshot.docs.map((d, i) => ({
          id: d.id,
          ...(d.data() as Omit<LeaderboardEntry, 'id' | 'rank'>),
          rank: i + 1,
        }))
      );
      setLoadingTop(false);
    });
    return () => unsubscribe();
  }, []);

  // "Load more" starts pulling from rank 11 onward — we skip the
  // first page of paginated results since topTen already covers it
  // live. (Simplest correct approach: only show `extra` once the
  // volunteer has clicked past what topTen already displays.)
  const extraRanked = extra.slice(10).map((entry, i) => ({
    ...entry,
    id: entry.id,
    rank: 11 + i,
  }));

  if (loadingTop) return <p className="text-sm text-foreground/50">Loading leaderboard...</p>;

  const allEntries = [...topTen, ...extraRanked];

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-2">
      <h1 className="text-xl font-medium text-foreground mb-2">Top volunteers</h1>
      {allEntries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.3 }}
        >
          <Card className="flex items-center justify-between px-4 py-3 hover:border-glow/40 transition-colors">
            <div className="flex items-center gap-3">
              <span
                className={
                  entry.rank <= 3
                    ? 'text-sm font-medium text-glow w-6'
                    : 'text-sm font-medium text-foreground/40 w-6'
                }
              >
                {entry.rank}
              </span>
              <span className="text-sm font-medium text-foreground">{entry.name}</span>
            </div>
            <span className="text-sm text-foreground/60">{entry.points} pts</span>
          </Card>
        </motion.div>
      ))}

      {hasMore && (
        <Button variant="outline" className="mt-2" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </Button>
      )}
    </div>
  );
}
