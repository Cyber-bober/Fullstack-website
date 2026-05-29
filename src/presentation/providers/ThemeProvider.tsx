'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, TranslationKey, Language } from '@/shared/i18n/translations';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  glassEffect: boolean;
  setGlassEffect: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', setTheme: () => {},
  language: 'ru', setLanguage: () => {},
  t: () => '',
  glassEffect: true, setGlassEffect: () => {},
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
    const glass = glassEffect ? `
      background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'};
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'};
      border-radius: 16px;
      box-shadow: 0 8px 32px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'};
    ` : `
      background: ${isDark ? '#1a1a1a' : '#ffffff'};
      border: 1px solid ${isDark ? '#333' : '#ddd'};
      border-radius: 8px;
    `;

    document.documentElement.style.setProperty('--glass-style', glass);
    document.documentElement.style.setProperty('--bg', isDark ? '#0d0d0d' : '#f0f0f5');
    document.documentElement.style.setProperty('--text', isDark ? '#f0f0f0' : '#1a1a1a');
    document.documentElement.style.setProperty('--border', isDark ? '#333' : '#ddd');
    document.documentElement.style.setProperty('--card-bg', isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)');
  }, [theme, language, glassEffect, mounted]);

  const t = (key: TranslationKey) => translations[language]?.[key] ?? translations.ru[key] ?? key;

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage, t, glassEffect, setGlassEffect }}>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        transition: 'background 0.3s, color 0.3s',
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
