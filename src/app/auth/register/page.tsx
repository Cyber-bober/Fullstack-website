'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate username format (like Telegram/VK)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Логин: 3-30 символов, только буквы, цифры и _');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullName, city, birthDate: '2000-01-01' }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(`Регистрация успешна! Ваш ID: @${username}`);
      setTimeout(() => router.push('/auth/signin'), 2000);
    } else {
      setError(data.error || 'Ошибка регистрации');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Логин (уникальный ID, как в Telegram)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="например: ivan_1990"
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
          <small style={{ color: '#666' }}>3-30 символов, буквы, цифры и _</small>
        </div>
        <div>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>ФИО</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Город</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, marginTop: 16 }}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Уже есть аккаунт? <a href="/auth/signin">Войти</a>
      </p>
    </div>
  );
}
