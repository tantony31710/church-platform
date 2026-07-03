import { create } from 'zustand';

type ThemeType = 'cool' | 'energetic';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  updateThemeBasedOnData: (metric: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'cool',
  setTheme: (theme) => set({ theme }),
  updateThemeBasedOnData: (metric) => {
    // Threshold-based theme switching
    set({ theme: metric > 0.75 ? 'energetic' : 'cool' });
  },
}));
