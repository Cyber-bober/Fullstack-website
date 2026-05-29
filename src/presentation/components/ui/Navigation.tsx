'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/presentation/providers/ThemeProvider';

export default function Navigation() {
  const { data: session } = useSession();
  const { theme, setTheme, t, glassEffect } = useTheme();

  const linkStyle = {
    textDecoration: 'none',
    color: theme === 'dark' ? '#f0f0f0' : '#333',
  };

  return (
    <nav className={glassEffect ? 'glass-card' : ''} style={{
      display: 'flex',
      gap: 16,
      padding: '12px 20px',
      margin: '10px 20px',
      background: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <Link href="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>
        Football Hub
      </Link>
      <Link href="/news" style={linkStyle}>{t('news')}</Link>
      <Link href="/teams" style={linkStyle}>{t('teams')}</Link>
      <Link href="/support" style={linkStyle}>{t('support')}</Link>

      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: '1px solid #999', borderRadius: 4 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {session?.user ? (
        <>
          <Link href="/profile" style={linkStyle}>{t('profile')}</Link>
          <Link href="/settings" style={linkStyle}>{t('settings')}</Link>
          {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'EDITOR') && (
            <Link href="/admin/news" style={{ textDecoration: 'none', color: '#e67e22' }}>{t('admin')}</Link>
          )}
          {(session.user as any).role === 'ADMIN' && (
            <Link href="/admin/requests" style={{ textDecoration: 'none', color: '#e67e22' }}>Запросы</Link>
          )}
          <span style={{ marginLeft: 'auto', color: '#666' }}>{session.user.name}</span>
          <button onClick={() => signOut()} style={{ padding: '4px 12px', cursor: 'pointer' }}>{t('logout')}</button>
        </>
      ) : (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link href="/auth/register" style={{ textDecoration: 'none', color: '#28a745' }}>{t('register')}</Link>
          <Link href="/auth/signin" style={{ textDecoration: 'none', color: '#0070f3' }}>{t('login')}</Link>
        </div>
      )}
    </nav>
  );
}
