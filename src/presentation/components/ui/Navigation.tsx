'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav style={{
      display: 'flex',
      gap: 16,
      padding: '12px 20px',
      background: '#f8f9fa',
      borderBottom: '1px solid #ddd',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <Link href="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>
        Football Hub
      </Link>

      <Link href="/teams" style={{ textDecoration: 'none', color: '#333' }}>Команды</Link>
      <Link href="/support" style={{ textDecoration: 'none', color: '#333' }}>Поддержка</Link>
      <Link href="/terms" style={{ textDecoration: 'none', color: '#333' }}>Соглашение</Link>

      {session?.user ? (
        <>
          <Link href="/profile" style={{ textDecoration: 'none', color: '#333' }}>Профиль</Link>
          <Link href="/settings" style={{ textDecoration: 'none', color: '#333' }}>Настройки</Link>

          {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'EDITOR') && (
            <Link href="/admin/news" style={{ textDecoration: 'none', color: '#e67e22' }}>
              Админка
            </Link>
          )}

          <span style={{ marginLeft: 'auto', color: '#666' }}>
            {session.user.name}
          </span>
          <button
            onClick={() => signOut()}
            style={{ padding: '4px 12px', cursor: 'pointer' }}
          >
            Выйти
          </button>
        </>
      ) : (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link href="/auth/register" style={{ textDecoration: 'none', color: '#28a745' }}>
            Регистрация
          </Link>
          <Link href="/auth/signin" style={{ textDecoration: 'none', color: '#0070f3' }}>
            Войти
          </Link>
        </div>
      )}
    </nav>
  );
}