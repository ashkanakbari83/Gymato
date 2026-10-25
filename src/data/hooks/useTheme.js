import { useEffect } from 'react';

/** Applies theme, language and text direction to <html>. */
export function useTheme(theme, language) {
  useEffect(() => {
    const resolved =
      theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.lang = language;
    root.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [theme, language]);
}
