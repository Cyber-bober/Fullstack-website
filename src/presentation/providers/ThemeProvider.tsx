'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, TranslationKey, Language } from '@/shared/i18n/translations';

type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme; setTheme: (t: Theme) => void;
  language: Language; setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
  glassEffect: boolean; setGlassEffect: (v: boolean) => void;
}
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', setTheme: () => {},
  language: 'ru', setLanguage: () => {},
  t: () => '', glassEffect: true, setGlassEffect: () => {},
});
export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('ru');
  const [glassEffect, setGlassEffect] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme((localStorage.getItem('theme') as Theme) || 'light');
    setLanguage((localStorage.getItem('language') as Language) || 'ru');
    setGlassEffect(localStorage.getItem('glassEffect') !== 'false');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('glassEffect', String(glassEffect));
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', language);

    const isDark = theme === 'dark';
    document.documentElement.style.setProperty('--bg', isDark ? '#0a0a0a' : '#f0f0f5');
    document.documentElement.style.setProperty('--text', isDark ? '#f5f5f7' : '#1d1d1f');
    document.documentElement.style.setProperty('--border', isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');

    const old = document.getElementById('liquid-glass-css');
    if (old) old.remove();

    if (glassEffect) {
      const style = document.createElement('style');
      style.id = 'liquid-glass-css';
      style.textContent = `
        .card, .panel, form, [data-glass] {
          position: relative;
          background: ${isDark ? 'rgba(25,25,25,0.55)' : 'rgba(255,255,255,0.65)'};
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)'};
          border-radius: 24px;
          box-shadow:
            0 8px 32px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.06)'},
            inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)'};
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.4, 1);
          overflow: hidden;
        }

        .card::before, .panel::before, form::before, [data-glass]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)'} 50%,
            transparent 100%
          );
          z-index: 2;
          pointer-events: none;
          border-radius: inherit;
        }

        .card:hover, .panel:hover, form:hover, [data-glass]:hover {
          background: ${isDark ? 'rgba(35,35,35,0.7)' : 'rgba(255,255,255,0.8)'};
          box-shadow:
            0 12px 40px ${isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)'},
            inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)'};
          transform: scale(1.01);
        }
      `;
      document.head.appendChild(style);
    }
  }, [theme, language, glassEffect, mounted]);

  const t = (key: TranslationKey) => translations[language]?.[key] ?? translations.ru[key] ?? key;
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage, t, glassEffect, setGlassEffect }}>
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark' ? '#0a0a0a' : '#f0f0f5',
        color: 'var(--text)',
        transition: 'background 0.3s',
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
