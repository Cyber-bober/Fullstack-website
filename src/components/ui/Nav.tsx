"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface UserData {
  id: string;
  role: string;
  username: string;
  teamId: string | null;
}

export default function Nav() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile/me")
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setUserData({
              id: data.id,
              role: data.role || session.user.role || "USER",
              username: data.username || session.user.username || "",
              teamId: data.teamId || null
            });
          }
        })
        .catch(err => console.error("Ошибка загрузки профиля:", err));
    } else {
      setUserData(null);
    }
  }, [session]);

  const userRole = userData?.role || session?.user?.role || null;
  const userTeamId = userData?.teamId || null;
  const showTeamProfile = !!userTeamId || userRole === "ADMIN";
  const isAdmin = userRole === "ADMIN";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">       
        <nav className="sidebar-nav">
          <Link href="/" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/main-page.svg" alt="" className="svg"/>
            <span className="sidebar-link">Главная</span>
          </Link>
          <Link href="/teams" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/teams.svg" alt="" className="svg"/>
            <span className="sidebar-link">Команды</span>
          </Link>
          {showTeamProfile && (
            <Link href="/teams/profile" className="sidebar-btn glass-effect">
              <img src="/uploads/svg/team-profile.svg" alt="" className="svg"/>
              <span className="sidebar-link">Профиль команды</span>
            </Link>
          )}
          <Link href="/chat" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/chat.svg" alt="" className="svg"/>
            <span className="sidebar-link">Чат</span>
          </Link>
          <Link href="/profile" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/profile.svg" alt="" className="svg"/>
            <span className="sidebar-link">Профиль</span>
          </Link>
          <Link href="/settings" className="sidebar-btn glass-effect">
            <img src="/uploads/svg/settings.svg" alt="" className="svg"/>
            <span className="sidebar-link">Настройки</span>
          </Link>
          {isAdmin && (
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
        {status === "loading" ? (
          <div className="sidebar-link w-full glass-effect">
            <span className="sidebar-link-text">Загрузка...</span>
          </div>
        ) : session?.user ? (
          <button onClick={handleSignOut} className="sidebar-link logout-btn w-full glass-effect"> 
            <img src="/uploads/svg/logout.svg" alt="" className="svg"/>
            <span className="sidebar-link-text">Выйти</span>
          </button>
        ) : (
          <Link href="/auth/signin" className="sidebar-link login-btn w-full glass-effect">
            <img src="/uploads/svg/login.svg" alt="" className="svg"/>
            <span className="sidebar-link-text">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  );
}