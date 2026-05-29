'use client';

import { useTheme } from './ThemeProvider';
import { ReactNode, useEffect } from 'react';

export default function GlassWrapper({ children }: { children: ReactNode }) {
  const { glassEffect, theme } = useTheme();

  useEffect(() => {
    const old = document.getElementById('liquid-glass-global');
    if (old) old.remove();

    if (glassEffect) {
      const isDark = theme === 'dark';
      const style = document.createElement('style');
      style.id = 'liquid-glass-global';
      style.textContent = `
        body {
          background: ${isDark
            ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
            : 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)'} !important;
          background-attachment: fixed !important;
        }
        .glass-card {
          background: ${isDark ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.55)'} !important;
          backdrop-filter: blur(35px) saturate(200%) !important;
          -webkit-backdrop-filter: blur(35px) saturate(200%) !important;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'} !important;
          border-radius: 22px !important;
          box-shadow:
            0 8px 32px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.06)'},
            inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)'} !important;
          transition: all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1) !important;
        }
        .glass-card:hover {
          background: ${isDark ? 'rgba(40,40,40,0.65)' : 'rgba(255,255,255,0.75)'} !important;
          box-shadow:
            0 16px 48px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'},
            inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)'} !important;
          transform: scale(1.01) translateY(-2px) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, [glassEffect, theme]);

  return <>{children}</>;
}
