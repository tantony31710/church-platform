import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '@/lib/firebase/client';
import { DataService } from '@/lib/data-service';
import type { Role, UserProfile } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role;
  loading: boolean;
  isDemoMode: boolean;
  setCustomUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: 'volunteer',
  loading: true,
  isDemoMode: false,
  setCustomUser: () => {},
  logout: async () => {},
  updateCurrentProfile: () => {},
});

const designatedAdminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();

function profileFromFirestore(firebaseUser: User, value: Record<string, any>, effectiveRole?: Role): UserProfile {
  return {
    id: firebaseUser.uid,
    name: value.name || firebaseUser.displayName || 'Volunteer',
    email: firebaseUser.email || value.email || '',
    role: effectiveRole || (value.role === 'admin' ? 'admin' : 'volunteer'),
    skills: Array.isArray(value.skills) ? value.skills : [],
    points: Number(value.points || 0),
    avatar: value.avatar,
    department: value.department,
    phone: value.phone,
    streak: Number(value.streak || 0),
    badges: Array.isArray(value.badges) ? value.badges : [],
    joinedDate: value.joinedDate,
    tasksCompletedCount: Number(value.tasksCompletedCount || 0),
    attendanceCount: Number(value.attendanceCount || 0),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>('volunteer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setFirebaseUser(nextUser);
      setLoading(true);

      if (!nextUser) {
        DataService.stopLiveSync();
        setProfile(null);
        setRole('volunteer');
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', nextUser.uid),
        async (snapshot) => {
          if (!snapshot.exists()) {
            setProfile(null);
            setRole('volunteer');
            setLoading(false);
            return;
          }

          let hasAdminClaim = false;
          try {
            const token = await nextUser.getIdTokenResult(true);
            hasAdminClaim = token.claims.admin === true;
          } catch (error) {
            console.error('[Auth] Could not verify Firebase claims:', error);
          }

          const isDesignatedAdmin = Boolean(
            designatedAdminEmail && nextUser.email?.trim().toLowerCase() === designatedAdminEmail
          );
          const effectiveRole: Role =
            isDesignatedAdmin && nextUser.emailVerified && hasAdminClaim && snapshot.data().role === 'admin'
              ? 'admin'
              : 'volunteer';
          const nextProfile = profileFromFirestore(nextUser, snapshot.data(), effectiveRole);
          DataService.startLiveSync(nextUser.uid, effectiveRole === 'admin');
          setProfile(nextProfile);
          setRole(effectiveRole);
          setLoading(false);
        },
        (error) => {
          console.error('[Auth] Profile subscription failed:', error);
          setProfile(null);
          setRole('volunteer');
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
      DataService.stopLiveSync();
    };
  }, []);

  const setCustomUser = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setRole(nextProfile.role);
  };

  const logout = async () => {
    await fbSignOut(auth);
  };

  const updateCurrentProfile = (updates: Partial<UserProfile>) => {
    if (!firebaseUser || !profile) return;
    const safeUpdates = { ...updates };
    delete (safeUpdates as Partial<UserProfile>).id;
    delete (safeUpdates as Partial<UserProfile>).role;
    delete (safeUpdates as Partial<UserProfile>).points;
    delete (safeUpdates as Partial<UserProfile>).tasksCompletedCount;
    delete (safeUpdates as Partial<UserProfile>).attendanceCount;
    void updateDoc(doc(db, 'users', firebaseUser.uid), safeUpdates as Record<string, unknown>).catch((error) => {
      console.error('[Auth] Profile update failed:', error);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        profile,
        role,
        loading,
        isDemoMode: false,
        setCustomUser,
        logout,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
