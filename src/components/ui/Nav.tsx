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
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/main-page.svg" className="sidebar-svg"/>
            <Link href="/" className="sidebar-link">Главная</Link>
          </div>
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/teams.svg" className="sidebar-svg"/>
            <Link href="/teams" className="sidebar-link">Команды</Link>
          </div>
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/chat.svg" className="sidebar-svg"/>
            <Link href="/chat" className="sidebar-link">Чат</Link>
          </div>
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/profile.svg" className="sidebar-svg"/>
            <Link href="/profile" className="sidebar-link">Профиль</Link>
          </div>
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/settings.svg" className="sidebar-svg"/>
            <Link href="/settings" className="sidebar-link">Настройки</Link>
          </div>
          {userRole === "ADMIN" && (
            <div className="sidebar-btn glass-effect">
              <img src="/uploads/svg/admin.svg" className="sidebar-svg"/>
              <Link href="/admin" className="sidebar-link admin-link">Админка</Link>
            </div>
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