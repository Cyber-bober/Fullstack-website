'use client';
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session } = useSession();
  return (
    <nav className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-900 text-sm">
      <Link href="/" className="font-bold text-blue-600">Football Hub</Link>
      <Link href="/teams">Команды</Link>
      <Link href="/chat">Чат</Link>
      {session ? (
        <>
          <Link href="/profile">Профиль</Link>
          <Link href="/settings">Настройки</Link>
          {session.user.role === 'ADMIN' && <Link href="/admin">Админка</Link>}
          <span className="ml-auto">{session.user.name}</span>
          <button onClick={() => signOut()}>Выйти</button>
        </>
      ) : (
        <Link href="/auth/signin" className="ml-auto">Войти</Link>
      )}
    </nav>
  );
}
