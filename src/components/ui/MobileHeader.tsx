"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface UserData {
  id: string;
  role: string;
  username: string;
  teamId: string | null;
}

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  // Загружаем данные пользователя
  useState(() => {
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
    }
  });

  const userRole = userData?.role || session?.user?.role || null;
  const isAdmin = userRole === "ADMIN";
  const isEditor = userRole === "EDITOR";
  const canAddMatch = isAdmin || isEditor;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    closeMenu();
  };

  const menuItems = [
    { href: "/", label: "Главная", icon: "/uploads/svg/main-page.svg" },
    { href: "/teams", label: "Команды", icon: "/uploads/svg/teams.svg" },
    { href: "/chat", label: "Чат", icon: "/uploads/svg/chat.svg" },
    { href: "/profile", label: "Профиль", icon: "/uploads/svg/profile.svg" },
    { href: "/settings", label: "Настройки", icon: "/uploads/svg/settings.svg" },
    { href: "/support", label: "Поддержка", icon: "/uploads/svg/info.svg" },
  ];

  // Добавляем профиль команды если есть
  if (userData?.teamId || isAdmin) {
    menuItems.splice(2, 0, {
      href: "/teams/profile",
      label: "Профиль команды",
      icon: "/uploads/svg/team-profile.svg"
    });
  }

  // Добавляем админку для админов
  if (isAdmin) {
    menuItems.push({
      href: "/admin",
      label: "Админка",
      icon: "/uploads/svg/admin.svg"
    });
  }

  return (
    <>
      {/* Мобильный хедер */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          {/* Кнопка бургер */}
          <button
            className="mobile-burger-btn"
            onClick={toggleMenu}
            aria-label="Открыть меню"
          >
            <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
            <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
            <span className={`burger-line ${isMenuOpen ? "open" : ""}`}></span>
          </button>

          {/* Название сайта */}
          <Link href="/" className="mobile-logo">
            <span className="mobile-logo-text">RTLive</span>
          </Link>
        </div>

        <div className="mobile-header-right">
          {/* Кнопка добавить матч (только для админа/редактора) */}
          {canAddMatch && pathname === "/" && (
            <button className="mobile-add-match-btn" onClick={() => {
              // Триггерим открытие модалки через кастомное событие
              window.dispatchEvent(new CustomEvent('openMatchModal'));
            }}>
              <span className="mobile-add-match-icon">+</span>
              <span className="mobile-add-match-text">Матч</span>
            </button>
          )}
        </div>
      </header>

      {/* Выдвижное меню */}
      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${pathname === item.href ? "active" : ""}`}
              onClick={closeMenu}
            >
              <img src={item.icon} alt="" className="mobile-nav-icon" />
              <span>{item.label}</span>
            </Link>
          ))}

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
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}
    </>
  );
}