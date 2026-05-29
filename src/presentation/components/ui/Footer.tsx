'use client';
import { useTheme } from '@/presentation/providers/ThemeProvider';

export default function Footer() {
  const { glassEffect } = useTheme();
  return (
    <footer className={glassEffect ? 'glass-card' : ''} style={{
      textAlign: 'center',
      padding: '20px',
      margin: '20px',
      borderTop: '1px solid var(--border, #ddd)',
      fontSize: 14,
      opacity: 0.8,
    }}>
      <p>© 2025 Football Hub</p>
      <a href="https://github.com/Cyber-bober/Football" target="_blank" rel="noopener">GitHub</a>
    </footer>
  );
}
