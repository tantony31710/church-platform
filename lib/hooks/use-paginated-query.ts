'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Cursor-based pagination (startAfter), not offset-based (skip N) —
// offset pagination gets slower and more expensive the deeper you
// page, since Firestore still reads every skipped document. Cursors
// stay a constant cost per page regardless of how many pages came
// before.
//
// This intentionally uses getDocs (one-time fetch) rather than
// onSnapshot. A live-updating paginated list is a much harder problem
// (page 2 shifting under you as page 1 changes) and isn't needed for
// a leaderboard or roster you're paging through, not watching live.
export function usePaginatedQuery<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  pageSize = 10
) {
  const [items, setItems] = useState<(T & { id: string })[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const baseConstraints = [...constraints, limit(pageSize)];
    const q = lastDoc
      ? query(collection(db, collectionName), ...baseConstraints, startAfter(lastDoc))
      : query(collection(db, collectionName), ...baseConstraints);

    const snapshot = await getDocs(q);
    const newItems = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));

    setItems((prev) => [...prev, ...newItems]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
    setHasMore(snapshot.docs.length === pageSize);
    setLoading(false);
  }, [collectionName, constraints, lastDoc, hasMore, loading, pageSize]);

  const reset = useCallback(() => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
  }, []);

  return { items, loadMore, hasMore, loading, reset };
}

// Re-export orderBy for convenience so callers don't need a second
// import just to build their constraints array.
export { orderBy };
