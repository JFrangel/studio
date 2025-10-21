'use client';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      className="w-full justify-start gap-3 h-10 px-3"
      aria-label={`Cambiar a modo ${theme === 'default' ? 'monocromático' : 'normal'}`}
    >
      <Palette className="h-4 w-4" />
      <span className="text-sm">
        {theme === 'default' ? 'Modo monocromático' : 'Modo normal'}
      </span>
    </Button>
  );
}