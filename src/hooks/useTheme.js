import { useLayoutEffect, useState } from 'react';

const STORAGE_KEY = 'dokon-theme';
const LIGHT = 'dokon';
const DARK = 'dokon-dark';

function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) === DARK ? DARK : LIGHT;
}

/**
 * Dark/light toggle for the dashboard, gated to Pro markets. Pass
 * `enabled = false` (Starter plan) and the theme is forced back to light —
 * e.g. a market that downgraded from Pro while dark mode was active.
 */
export function useTheme(enabled) {
  const [theme, setTheme] = useState(() => (enabled ? getStoredTheme() : LIGHT));

  useLayoutEffect(() => {
    const applied = enabled ? theme : LIGHT;
    document.documentElement.setAttribute('data-theme', applied);
    return () => document.documentElement.setAttribute('data-theme', LIGHT);
  }, [theme, enabled]);

  function toggleTheme() {
    if (!enabled) return;
    setTheme((current) => {
      const next = current === DARK ? LIGHT : DARK;
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return { isDark: enabled && theme === DARK, toggleTheme };
}
