import { useAuth } from '@/lib/auth-context';

export function useUserProfile() {
  const { profile, loading, updateCurrentProfile } = useAuth();
  return { profile, loading, updateProfile: updateCurrentProfile };
}
