'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Неверный логин или пароль',
    AccessDenied: 'Доступ запрещён',
    default: 'Произошла ошибка при входе',
  };

  const message = errorMessages[error || ''] || errorMessages.default;

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
      <h1>Ошибка</h1>
      <p style={{ color: 'red', marginBottom: 20 }}>{message}</p>
      <Link href="/auth/signin" style={{ color: '#0070f3' }}>
        Попробовать снова
      </Link>
    </div>
  );
}
