'use client';

import { signIn } from 'next-auth/react';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Неверный логин или пароль');
    } else if (result?.ok) {
      window.location.href = '/';
    }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Логин</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleUsernameKeyDown}
            required
            autoFocus
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ref={passwordRef}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, marginTop: 16 }}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Нет аккаунта? <Link href="/auth/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
