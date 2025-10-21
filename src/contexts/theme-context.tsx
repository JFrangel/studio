'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'monochrome';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('studio-theme') as Theme;
    if (savedTheme && (savedTheme === 'default' || savedTheme === 'monochrome')) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('studio-theme', theme);

    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'monochrome') {
      root.classList.add('monochrome');
    } else {
      root.classList.remove('monochrome');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'default' ? 'monochrome' : 'default');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
