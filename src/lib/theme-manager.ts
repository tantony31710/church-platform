import { create } from 'zustand';

export type ThemeType = 'cool' | 'energetic' | 'emerald' | 'light';

interface ThemeState {
  theme: ThemeType;
  show3D: boolean;
  setTheme: (theme: ThemeType) => void;
  toggle3D: () => void;
  updateThemeBasedOnData: (metric: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('church_connect_theme') as ThemeType) || 'cool',
  show3D: localStorage.getItem('church_connect_show_3d') !== 'false',
  setTheme: (theme) => {
    localStorage.setItem('church_connect_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggle3D: () => {
    set((state) => {
      const next = !state.show3D;
      localStorage.setItem('church_connect_show_3d', String(next));
      return { show3D: next };
    });
  },
  updateThemeBasedOnData: (metric) => {
    set((state) => {
      const targetTheme = metric > 0.75 ? 'energetic' : state.theme;
      return { theme: targetTheme };
    });
  },
}));
