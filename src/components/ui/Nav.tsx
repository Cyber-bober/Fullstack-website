// src/components/ui/Nav.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Nav() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || null;

  return (
    <aside className="sidebar glass-effect">
      <div className="sidebar-top">
        <Link href="/" className="sidebar-logo">RTLive</Link>
        
        <nav className="sidebar-nav">
          <Link href="/" className="sidebar-link">🏠 Главная</Link>
          <Link href="/teams" className="sidebar-link">⚽ Команды</Link>
          <Link href="/chat" className="sidebar-link">💬 Чат</Link>
          <Link href="/profile" className="sidebar-link">👤 Профиль</Link>
          <Link href="/settings" className="sidebar-link">⚙️ Настройки</Link>
          
          {userRole === "ADMIN" && (
            <Link href="/admin" className="sidebar-link admin-link">🛡️ Админка</Link>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom">
        {session?.user ? (
          <form action="/api/auth/signout" method="post" style={{ width: '100%' }}>
            <button type="submit" className="sidebar-link logout-btn w-full">
              🚪 Выйти
            </button>
          </form>
        ) : (
          <Link href="/auth/signin" className="btn btn-primary w-full glass-btn">
            Войти
          </Link>
        )}
      </div>
    </aside>
  );
}