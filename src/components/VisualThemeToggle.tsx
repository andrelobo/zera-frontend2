import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VISUAL_THEME_STORAGE_KEY = 'zera_visual_theme_v1';
const ELEGANT_CLASS = 'theme-elegant';

type VisualTheme = 'classic' | 'elegant';

const applyVisualTheme = (theme: VisualTheme) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(ELEGANT_CLASS, theme === 'elegant');
};

const readInitialTheme = (): VisualTheme => {
  if (typeof window === 'undefined') return 'classic';
  return window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY) === 'elegant' ? 'elegant' : 'classic';
};

const VisualThemeToggle = () => {
  const [theme, setTheme] = useState<VisualTheme>(() => readInitialTheme());

  useEffect(() => {
    applyVisualTheme(theme);
    window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const isElegant = theme === 'elegant';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Alternar visual da interface"
      title={isElegant ? 'Voltar ao visual clássico' : 'Ativar visual elegante'}
      onClick={() => setTheme(isElegant ? 'classic' : 'elegant')}
      className="h-8 w-full justify-start px-2 font-normal"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      <span>{isElegant ? 'Visual clássico' : 'Visual elegante'}</span>
    </Button>
  );
};

export default VisualThemeToggle;
