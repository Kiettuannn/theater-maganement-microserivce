import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Function to apply theme to DOM
const applyTheme = (theme: Theme) => {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

// Get initial theme before store creation
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = localStorage.getItem('theme-storage');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      return parsed.state?.theme || 'light';
    } catch {
      return 'light';
    }
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

// Initialize theme on module load
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme,
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
      
      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Listen for storage changes from other tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme-storage' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const newTheme = parsed.state?.theme;
        if (newTheme && (newTheme === 'light' || newTheme === 'dark')) {
          applyTheme(newTheme);
          useThemeStore.setState({ theme: newTheme });
        }
      } catch {
        // Ignore parse errors
      }
    }
  });
}
