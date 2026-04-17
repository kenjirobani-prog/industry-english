'use client';

import { useEffect } from 'react';
import { getPreferences } from '@/lib/storage';

/**
 * Reads the user's selected industry from localStorage and sets it as
 * `data-industry` on <html>. CSS variables override per-industry from there.
 *
 * Re-runs on storage events so theme stays in sync if the user changes
 * industry in another tab.
 */
export function IndustryThemeProvider() {
  useEffect(() => {
    const apply = () => {
      const prefs = getPreferences();
      const root = document.documentElement;
      if (prefs?.industryId) {
        root.dataset.industry = prefs.industryId;
      } else {
        delete root.dataset.industry;
      }
    };
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'ie:preferences') apply();
    };
    window.addEventListener('storage', onStorage);
    // Custom event so other parts of the app (settings save) can trigger refresh.
    window.addEventListener('ie:preferences-changed', apply);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ie:preferences-changed', apply);
    };
  }, []);
  return null;
}
