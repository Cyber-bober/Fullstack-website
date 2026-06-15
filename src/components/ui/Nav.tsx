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
          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/main-page.svg" alt="" className="svg"/>
            <Link href="/" className="sidebar-link">Главная</Link>
          </div>

          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/teams.svg" alt="" className="svg"/>
            <Link href="/teams" className="sidebar-link">Команды</Link>
          </div>

          {showTeamProfile && (
            <div className="sidebar-btn glass-effect">
              <img src="/uploads/svg/team-profile.svg" className="svg"/>
              <Link href="/teams/profile" className="sidebar-link">Профиль команды</Link>
            </div>
          )}

          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/chat.svg" alt="" className="svg"/>
            <Link href="/chat" className="sidebar-link">Чат</Link>
          </div>

          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/profile.svg" alt="" className="svg"/>
            <Link href="/profile" className="sidebar-link">Профиль</Link>
          </div>

          <div className="sidebar-btn glass-effect">
            <img src="/uploads/svg/settings.svg" alt="" className="svg"/>
            <Link href="/settings" className="sidebar-link">Настройки</Link>
          </div>

          {userRole === "ADMIN" && (
            <div className="sidebar-btn glass-effect">
              <img src="/uploads/svg/admin.svg" alt="" className="svg"/>
              <Link href="/admin" className="sidebar-link admin-link">Админка</Link>
            </div>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom">
        {session?.user ? (
          <form action="/api/auth/signout" method="post" style={{ width: '100%' }}>
            <button type="submit" className="sidebar-link logout-btn w-full glass-effect"> 
              <img src="/uploads/svg/login.svg" className="svg"/>
              <span className="sidebar-link-text">Выйти</span>
            </button>
          </form>
        ) : (
          <Link href="/auth/signin" className="sidebar-link login-btn w-full glass-effect">
            <img src="/uploads/svg/logout.svg" className="svg"/>
            <span className="sidebar-link-text">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  );
}