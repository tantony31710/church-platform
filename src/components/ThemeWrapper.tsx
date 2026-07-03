'use client';
import { useThemeStore } from '@/lib/theme-manager';
import { useEffect } from 'react';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <>{children}</>;
}
