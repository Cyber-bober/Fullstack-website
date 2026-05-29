'use client';

import { useTheme } from '@/presentation/providers/ThemeProvider';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, t, glassEffect, setGlassEffect } = useTheme();
  const { data: session } = useSession();
  const [requestStatus, setRequestStatus] = useState('');

  const handleRoleRequest = async (role: string) => {
    setRequestStatus('');
    const res = await fetch('/api/role-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestedRole: role }) });
    const data = await res.json();
    setRequestStatus(res.ok ? 'Запрос отправлен!' : data.error || 'Ошибка');
    setTimeout(() => setRequestStatus(''), 3000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 30 }}>
      <h1>{t('settings')}</h1>

      <div style={glassStyle}>
        <h3>{t('language')}</h3>
        <select value={language} onChange={e => setLanguage(e.target.value as 'ru'|'en')} style={inputStyle}>
          <option value="ru">Русский</option><option value="en">English</option>
        </select>
      </div>

      <div style={glassStyle}>
        <h3>{t('theme')}</h3>
        <select value={theme} onChange={e => setTheme(e.target.value as 'light'|'dark')} style={inputStyle}>
          <option value="light">{t('light')}</option><option value="dark">{t('dark')}</option>
        </select>
      </div>

      <div style={glassStyle}>
        <h3>macOS Liquid Glass</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={glassEffect} onChange={e => setGlassEffect(e.target.checked)} />
          Включить эффект стекла
        </label>
      </div>

      <div style={glassStyle}>
        <h3>{t('accessRights')}</h3>
        {session?.user ? (
          <>
            <button onClick={() => handleRoleRequest('EDITOR')} style={btnStyle}>{t('requestEditor')}</button>
            <button onClick={() => handleRoleRequest('CAPTAIN')} style={btnStyle}>{t('requestCaptain')}</button>
            {requestStatus && <p style={{ color: requestStatus.includes('Ошибка') ? 'red' : 'green', marginTop: 8 }}>{requestStatus}</p>}
          </>
        ) : <p>Войдите в систему</p>}
      </div>
    </div>
  );
}

const glassStyle = {
  padding: 20,
  marginBottom: 16,
  background: 'var(--card-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
};

const inputStyle = { padding: 10, width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' };
const btnStyle = { padding: '10px 20px', marginRight: 8, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };
