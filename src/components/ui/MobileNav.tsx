"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface UserData {
  id: string;
  role: string;
  username: string;
  teamId: string | null;
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
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

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    closeMenu();
  };

  return (
    <>
      {/* Кнопка бургер */}
      <button
        className="mobile-menu-btn"
        onClick={toggleMenu}
        aria-label="Открыть меню"
        aria-expanded={isOpen}
      >
        <span className={`burger-line ${isOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isOpen ? "open" : ""}`}></span>
        <span className={`burger-line ${isOpen ? "open" : ""}`}></span>
      </button>

      {/* Мобильное меню */}
      <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
        <nav className="mobile-nav">
          <Link href="/" className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/main-page.svg" alt="" className="mobile-nav-icon" />
            <span>Главная</span>
          </Link>
          
          <Link href="/teams" className={`mobile-nav-item ${pathname === "/teams" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/teams.svg" alt="" className="mobile-nav-icon" />
            <span>Команды</span>
          </Link>
          
          {showTeamProfile && (
            <Link href="/teams/profile" className={`mobile-nav-item ${pathname === "/teams/profile" ? "active" : ""}`} onClick={closeMenu}>
              <img src="/uploads/svg/team-profile.svg" alt="" className="mobile-nav-icon" />
              <span>Профиль команды</span>
            </Link>
          )}
          
          <Link href="/chat" className={`mobile-nav-item ${pathname === "/chat" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/chat.svg" alt="" className="mobile-nav-icon" />
            <span>Чат</span>
          </Link>
          
          <Link href="/profile" className={`mobile-nav-item ${pathname === "/profile" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/profile.svg" alt="" className="mobile-nav-icon" />
            <span>Профиль</span>
          </Link>
          
          <Link href="/settings" className={`mobile-nav-item ${pathname === "/settings" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/settings.svg" alt="" className="mobile-nav-icon" />
            <span>Настройки</span>
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className={`mobile-nav-item ${pathname === "/admin" ? "active" : ""}`} onClick={closeMenu}>
              <img src="/uploads/svg/admin.svg" alt="" className="mobile-nav-icon" />
              <span>Админка</span>
            </Link>
          )}
          
          <Link href="/support" className={`mobile-nav-item ${pathname === "/support" ? "active" : ""}`} onClick={closeMenu}>
            <img src="/uploads/svg/info.svg" alt="" className="mobile-nav-icon" />
            <span>Поддержка</span>
          </Link>

          {/* Разделитель */}
          <div className="mobile-nav-divider"></div>

          {/* Выйти/Войти */}
          {status === "loading" ? (
            <div className="mobile-nav-item">
              <span>Загрузка...</span>
            </div>
          ) : session?.user ? (
            <button onClick={handleSignOut} className="mobile-nav-item mobile-nav-logout">
              <img src="/uploads/svg/logout.svg" alt="" className="mobile-nav-icon" />
              <span>Выйти</span>
            </button>
          ) : (
            <Link href="/auth/signin" className="mobile-nav-item mobile-nav-login" onClick={closeMenu}>
              <img src="/uploads/svg/login.svg" alt="" className="mobile-nav-icon" />
              <span>Войти</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Затемнение фона */}
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}
    </>
  );
}