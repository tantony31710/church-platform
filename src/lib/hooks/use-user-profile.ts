import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth-context';
import type { UserProfile } from '@/lib/types';

// Live subscription to the current user's own Firestore doc — used
// for things like the stats bar (their live points total), separate
// from auth-context's `role`, which only reads that same doc's role
// field. Kept as its own hook rather than expanding auth-context so
// pages that don't need the full profile don't re-render on every
// points change.
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const unsubscribeRole = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile({ 
          id: snap.id, 
          ...data,
          skills: data.skills || [], // Ensure skills is always an array
        } as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribeRole();
    }, [user]);


  return { profile, loading };
}
