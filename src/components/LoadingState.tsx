import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Carregando...' }: LoadingStateProps) => {
  const [theme, setTheme] = useState<'zera' | 'pn'>(() => {
    if (typeof window === 'undefined') return 'zera';
    return window.localStorage.getItem('zera_theme_preview_v1') === 'pn' ? 'pn' : 'zera';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncTheme = () => {
      setTheme(window.localStorage.getItem('zera_theme_preview_v1') === 'pn' ? 'pn' : 'zera');
    };
    window.addEventListener('storage', syncTheme);
    window.addEventListener('zera:theme:update', syncTheme as EventListener);
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('zera:theme:update', syncTheme as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 className={`h-8 w-8 animate-spin text-[hsl(var(--sidebar-background))] ${theme === 'pn' ? 'stroke-[2.25]' : ''}`} />
        <span className="rounded-full border border-sidebar-border/40 bg-card px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-background))]">
          {theme}
        </span>
      </div>
      <p className={`text-sm text-[hsl(var(--sidebar-background))] ${theme === 'pn' ? 'font-medium tracking-[0.08em]' : ''}`}>{message}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">
        {theme === 'pn' ? 'Sincronizando no estilo pn...' : 'Carregando no estilo zera...'}
      </p>
    </div>
  );
};

export default LoadingState;
