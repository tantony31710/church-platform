import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { DataService } from '@/lib/data-service';
import type { Role, UserProfile } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role;
  loading: boolean;
  isDemoMode: boolean;
  switchUser: (userId: string) => void;
  toggleRole: () => void;
  loginDemo: (role: Role) => void;
  setCustomUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: 'volunteer',
  loading: true,
  isDemoMode: true,
  switchUser: () => {},
  toggleRole: () => {},
  loginDemo: () => {},
  setCustomUser: () => {},
  logout: async () => {},
  updateCurrentProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => DataService.getCurrentUser());
  const [role, setRole] = useState<Role>(() => profile?.role || 'volunteer');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Subscribe to DataService user changes
  useEffect(() => {
    const unsubCurrentUser = DataService.subscribe<UserProfile>('currentUser', (u) => {
      setProfile(u);
      setRole(u.role);
    });

    const unsubUsers = DataService.subscribe<UserProfile[]>('users', (users) => {
      if (profile) {
        const fresh = users.find((u) => u.id === profile.id);
        if (fresh) {
          setProfile(fresh);
          setRole(fresh.role);
        }
      }
    });

    return () => {
      unsubCurrentUser();
      unsubUsers();
    };
  }, [profile]);

  // Firebase Auth Listener (if configured)
  useEffect(() => {
    try {
      const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser && fbUser.email) {
          setFirebaseUser(fbUser);
          setIsDemoMode(false);
          // Check or listen to Firestore profile
          const unsubDoc = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const userProfile: UserProfile = {
                id: fbUser.uid,
                name: data.name || fbUser.displayName || 'Volunteer',
                email: fbUser.email || '',
                role: (data.role as Role) || 'volunteer',
                skills: data.skills || [],
                points: data.points || 0,
                streak: data.streak || 1,
                badges: data.badges || [],
              };
              setProfile(userProfile);
              setRole(userProfile.role);
            }
          });
          return () => unsubDoc();
        } else {
          setFirebaseUser(null);
          // In demo mode or offline, use DataService current user
          const current = DataService.getCurrentUser();
          setProfile(current);
          setRole(current.role);
        }
      });
      return () => unsubscribeAuth();
    } catch {
      // Fallback in demo mode
      const current = DataService.getCurrentUser();
      setProfile(current);
      setRole(current.role);
    }
  }, []);

  const switchUser = (userId: string) => {
    const u = DataService.setCurrentUser(userId);
    if (u) {
      setProfile(u);
      setRole(u.role);
    }
  };

  const toggleRole = () => {
    if (!profile) return;
    const newRole: Role = role === 'admin' ? 'volunteer' : 'admin';
    const updated = DataService.updateUserRole(profile.id, newRole);
    if (updated) {
      setProfile(updated);
      setRole(newRole);
    }
  };

  const loginDemo = (targetRole: Role) => {
    const users = DataService.getUsers();
    const match = users.find((u) => u.role === targetRole) || users[0];
    if (match) {
      DataService.setCurrentUser(match.id);
      setProfile(match);
      setRole(match.role);
    }
  };

  const setCustomUser = (newUser: UserProfile) => {
    DataService.setCurrentUser(newUser.id);
    setProfile(newUser);
    setRole(newUser.role);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout skipped:', e);
    }
    setFirebaseUser(null);
  };

  const updateCurrentProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const users = DataService.getUsers();
    const idx = users.findIndex((u) => u.id === profile.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      DataService.saveUsers(users);
      setProfile(users[idx]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        profile,
        role,
        loading,
        isDemoMode,
        switchUser,
        toggleRole,
        loginDemo,
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
