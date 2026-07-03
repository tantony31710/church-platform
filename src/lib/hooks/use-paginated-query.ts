import { useState, useCallback } from 'react';
import {
  collection, query, orderBy, limit, startAfter, getDocs,
  QueryDocumentSnapshot, DocumentData, QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Cursor-based pagination — cost stays constant per page regardless
// of how many pages came before, unlike offset/skip pagination.
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

export { orderBy };
