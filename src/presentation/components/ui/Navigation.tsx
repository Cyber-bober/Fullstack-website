'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/presentation/providers/ThemeProvider';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const { theme, setTheme, t } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const linkStyle = {
    textDecoration: 'none',
    color: theme === 'dark' ? '#f0f0f0' : '#333',
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    const res = await fetch(`/api/users/search?q=${searchQuery}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  };

  const startChat = (userId: string) => {
    setSearchResults([]);
    setSearchQuery('');
    window.location.href = `/chat/${userId}`;
  };

  return (
    <nav style={{
      display: 'flex',
      gap: 16,
      padding: '12px 20px',
      background: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'relative',
    }}>
      <Link href="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>
        Football Hub
      </Link>

      <Link href="/news" style={linkStyle}>{t('news')}</Link>
      <Link href="/teams" style={linkStyle}>{t('teams')}</Link>
      <Link href="/support" style={linkStyle}>{t('support')}</Link>
      <Link href="/terms" style={linkStyle}>{t('terms')}</Link>

      {session?.user && (
        <Link href="/chat" style={linkStyle}>💬 Чат</Link>
      )}

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: '1px solid #999', borderRadius: 4, fontSize: 16 }}
        title={t('theme')}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Search users */}
      {session?.user && (
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск @username..."
            style={{ padding: '4px 8px', width: 160, borderRadius: 4, border: '1px solid #ccc' }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: 8,
              zIndex: 100,
              minWidth: 200,
            }}>
              {searchResults.map((u: any) => (
                <div
                  key={u.id}
                  onClick={() => startChat(u.id)}
                  style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  <strong>@{u.username}</strong> — {u.fullName}
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      {session?.user ? (
        <>
          <Link href="/profile" style={linkStyle}>{t('profile')}</Link>
          <Link href="/settings" style={linkStyle}>{t('settings')}</Link>

          {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'EDITOR') && (
            <Link href="/admin/news" style={{ textDecoration: 'none', color: '#e67e22' }}>
              {t('admin')}
            </Link>
          )}

          {(session.user as any).role === 'ADMIN' && (
            <Link href="/admin/requests" style={{ textDecoration: 'none', color: '#e67e22' }}>
              Запросы
            </Link>
          )}

          <span style={{ marginLeft: 'auto', color: theme === 'dark' ? '#aaa' : '#666' }}>
            {session.user.name}
          </span>
          <button
            onClick={() => signOut()}
            style={{ padding: '4px 12px', cursor: 'pointer' }}
          >
            {t('logout')}
          </button>
        </>
      ) : (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link href="/auth/register" style={{ textDecoration: 'none', color: '#28a745' }}>
            {t('register')}
          </Link>
          <Link href="/auth/signin" style={{ textDecoration: 'none', color: '#0070f3' }}>
            {t('login')}
          </Link>
        </div>
      )}
    </nav>
  );
}
