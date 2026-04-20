import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ThemeToggleProps = {
  menuItem?: boolean;
};

const ThemeToggle = ({ menuItem = false }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'Tema claro' : 'Tema escuro';
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="ghost"
      size={menuItem ? 'sm' : 'icon'}
      aria-label="Alternar tema"
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={
        menuItem
          ? 'h-8 w-full justify-start px-2 font-normal'
          : 'h-9 w-9 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/50'
      }
    >
      <Icon className={menuItem ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
      {menuItem ? <span>{label}</span> : null}
    </Button>
  );
};

export default ThemeToggle;
