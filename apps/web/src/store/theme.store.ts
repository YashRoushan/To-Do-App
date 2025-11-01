import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Apply theme to document
const applyTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
  
  // Save to localStorage
  localStorage.setItem('theme-preference', theme);
};

// Load theme from localStorage
const loadTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('theme-preference');
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  // Get the theme that was already applied on module load
  const initialTheme = loadTheme();

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      set({ theme });
      applyTheme(theme);
    },
    getEffectiveTheme: () => {
      const { theme } = get();
      if (theme === 'system') {
        return getSystemTheme();
      }
      return theme;
    },
  };
});

// Initialize theme immediately on module load (before React)
if (typeof window !== 'undefined') {
  const initialTheme = loadTheme();
  applyTheme(initialTheme);

  // Listen for system theme changes when in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      applyTheme('system');
    }
  });
}

