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

  const showTeamProfile = !!userTeamId || userRole === "ADMIN";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">       
        <nav className="sidebar-nav">
          {/* Главная */}
          <Link href="/" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/main-page.svg" alt="" className="svg"/>
            <span className="sidebar-link">Главная</span>
          </Link>

          {/* Команды */}
          <Link href="/teams" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/teams.svg" alt="" className="svg"/>
            <span className="sidebar-link">Команды</span>
          </Link>

          {/* Профиль команды */}
          {showTeamProfile && (
            <Link href="/teams/profile" className="sidebar-btn glass-effect">
              <img src="/uploads/svg/team-profile.svg" alt="" className="svg"/>
              <span className="sidebar-link">Профиль команды</span>
            </Link>
          )}

          {/* Чат */}
          <Link href="/chat" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/chat.svg" alt="" className="svg"/>
            <span className="sidebar-link">Чат</span>
          </Link>

          {/* Профиль */}
          <Link href="/profile" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/profile.svg" alt="" className="svg"/>
            <span  className="sidebar-link">Профиль</span>
          </Link>

          {/* Настройки */}
          <Link href="/settings" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/settings.svg" alt="" className="svg"/>
            <span className="sidebar-link">Настройки</span>
          </Link>

          {/* Админка (только для ADMIN) */}
          {userRole === "ADMIN" && (
            <Link href="/admin" className="sidebar-btn glass-effect">
              <img src="/uploads/svg/admin.svg" alt="" className="svg"/>
              <span className="sidebar-link admin-link">Админка</span>
            </Link>
          )}

          <Link href="/support" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/info.svg" alt="" className="svg"/>
            <span className="sidebar-link">Поддержка</span>
          </Link>
        </nav>
      </div>

      <div className="sidebar-bottom">
        {session?.user ? (
          <form action="/api/auth/signout" method="post" style={{ width: '100%' }}>
            <button type="submit" className="sidebar-link logout-btn w-full glass-effect"> 
              <img src="/uploads/svg/login.svg" alt="" className="svg"/>
              <span className="sidebar-link-text">Выйти</span>
            </button>
          </form>
        ) : (
          <Link href="/auth/signin" className="sidebar-link login-btn w-full glass-effect">
            <img src="/uploads/svg/logout.svg" alt="" className="svg"/>
            <span className="sidebar-link-text">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  );
}