export const VISUAL_THEME_STORAGE_KEY = 'zera_visual_theme_v1';
export const ELEGANT_VISUAL_THEME_CLASS = 'theme-elegant';
export const VISUAL_THEME_CHANGE_EVENT = 'zera:visual-theme-change';

export type VisualTheme = 'classic' | 'elegant';

export const isVisualTheme = (value: unknown): value is VisualTheme => (
  value === 'classic' || value === 'elegant'
);

export const applyVisualTheme = (theme: VisualTheme) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(ELEGANT_VISUAL_THEME_CLASS, theme === 'elegant');
};

export const readVisualTheme = (): VisualTheme => {
  if (typeof window === 'undefined') return 'classic';
  const storedTheme = window.localStorage.getItem(VISUAL_THEME_STORAGE_KEY);
  return isVisualTheme(storedTheme) ? storedTheme : 'classic';
};

export const persistVisualTheme = (theme: VisualTheme) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISUAL_THEME_STORAGE_KEY, theme);
  applyVisualTheme(theme);
  window.dispatchEvent(new CustomEvent<VisualTheme>(VISUAL_THEME_CHANGE_EVENT, { detail: theme }));
};
