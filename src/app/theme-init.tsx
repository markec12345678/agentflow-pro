'use client';

/**
 * Client-side theme initialization component
 */
import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("agentflow-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (!theme && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch (e) {
      // Silently fail
    }
  }, []);

  return null;
}
