// src/components/ui/Nav.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Nav() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || null;
  
  let userTeamId: string | null = null;
  if (session?.user?.id) {
    const userWithTeam = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true }
    });
    userTeamId = userWithTeam?.teamId || null;
  }

  // Показываем профиль команды, если есть команда ИЛИ если пользователь АДМИН
  const showTeamProfile = !!userTeamId || userRole === "ADMIN";

  return (
    <aside className="sidebar glass-effect">
      <div className="sidebar-top">
        <Link href="/" className="sidebar-logo">RTLive</Link>
        
        <nav className="sidebar-nav">
          {/* Главная */}
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/main-page.svg" alt="" className="sidebar-svg"/>
            <Link href="/" className="sidebar-link">Главная</Link>
          </div>

          {/* Команды */}
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/teams.svg" alt="" className="sidebar-svg"/>
            <Link href="/teams" className="sidebar-link">Команды</Link>
          </div>

          {/* Профиль команды (только для участников или админов) */}
          {showTeamProfile && (
            <div className="sidebar-btn glass-effect">
              {/* ✅ ЗАМЕНИЛИ ОТСУТСТВУЮЩИЙ shield.svg НА ЭМОДЗИ */}
              <span style={{ fontSize: '20px', marginRight: '8px' }}>🛡️</span>
              <Link href="/teams/profile" className="sidebar-link">Профиль команды</Link>
            </div>
          )}

          {/* Чат */}
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/chat.svg" alt="" className="sidebar-svg"/>
            <Link href="/chat" className="sidebar-link">Чат</Link>
          </div>

          {/* Профиль игрока */}
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/profile.svg" alt="" className="sidebar-svg"/>
            <Link href="/profile" className="sidebar-link">Профиль</Link>
          </div>

          {/* Настройки */}
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/settings.svg" alt="" className="sidebar-svg"/>
            <Link href="/settings" className="sidebar-link">Настройки</Link>
          </div>

          {/* Админка (только для ADMIN) */}
          {userRole === "ADMIN" && (
            <div className="sidebar-btn glass-effect">
              <img src="/uploads/svg/admin.svg" alt="" className="sidebar-svg"/>
              <Link href="/admin" className="sidebar-link admin-link">Админка</Link>
            </div>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom">
        {session?.user ? (
          <form action="/api/auth/signout" method="post" style={{ width: '100%' }}>
            <button type="submit" className="sidebar-link logout-btn w-full">
              Выйти
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