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
    <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-xl border border-sidebar-border bg-sidebar py-16 text-sidebar-foreground">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 className={`h-8 w-8 animate-spin text-sidebar-primary-foreground ${theme === 'pn' ? 'stroke-[2.25]' : ''}`} />
        <span className="rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-sidebar-accent-foreground">
          {theme}
        </span>
      </div>
      <p className={`text-sm text-sidebar-primary-foreground ${theme === 'pn' ? 'font-medium tracking-[0.08em]' : ''}`}>{message}</p>
      <p className="mt-1 text-[11px] text-sidebar-foreground/80">
        {theme === 'pn' ? 'Sincronizando no estilo pn...' : 'Carregando no estilo zera...'}
      </p>
    </div>
  );
};

export default LoadingState;
