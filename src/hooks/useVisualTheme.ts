import { useEffect, useState } from 'react';
import {
  applyVisualTheme,
  isVisualTheme,
  persistVisualTheme,
  readVisualTheme,
  VISUAL_THEME_CHANGE_EVENT,
  type VisualTheme,
} from '@/lib/visual-theme';

export const useVisualTheme = () => {
  const [visualTheme, setVisualThemeState] = useState<VisualTheme>(() => readVisualTheme());

  useEffect(() => {
    const currentTheme = readVisualTheme();
    applyVisualTheme(currentTheme);
    setVisualThemeState(currentTheme);

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<VisualTheme>).detail;
      if (isVisualTheme(nextTheme)) {
        setVisualThemeState(nextTheme);
      }
    };

    window.addEventListener(VISUAL_THEME_CHANGE_EVENT, handleThemeChange);
    return () => window.removeEventListener(VISUAL_THEME_CHANGE_EVENT, handleThemeChange);
  }, []);

  const setVisualTheme = (nextTheme: VisualTheme) => {
    setVisualThemeState(nextTheme);
    persistVisualTheme(nextTheme);
  };

  const toggleVisualTheme = () => {
    setVisualTheme(visualTheme === 'elegant' ? 'classic' : 'elegant');
  };

  return {
    visualTheme,
    isElegant: visualTheme === 'elegant',
    setVisualTheme,
    toggleVisualTheme,
  };
};
