import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon as MoonLucide, Sun as SunLucide } from 'lucide-react';
import { Moon as MoonPhosphor, Sun as SunPhosphor } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useVisualTheme } from '@/hooks/useVisualTheme';

type ThemeToggleProps = {
  menuItem?: boolean;
};

const ThemeToggle = ({ menuItem = false }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { isElegant } = useVisualTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'Tema claro' : 'Tema escuro';

  const iconClassName = menuItem ? 'mr-2 h-4 w-4' : 'h-4 w-4';
  const icon = isElegant
    ? (
      isDark
        ? <SunPhosphor className={iconClassName} weight="duotone" />
        : <MoonPhosphor className={iconClassName} weight="duotone" />
    )
    : (
      isDark
        ? <SunLucide className={iconClassName} />
        : <MoonLucide className={iconClassName} />
    );

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
      {icon}
      {menuItem ? <span>{label}</span> : null}
    </Button>
  );
};

export default ThemeToggle;
