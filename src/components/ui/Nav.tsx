"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";

type MenuItem = {
  href: string;
  icon: string;
  label: string;
  isDanger?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/", icon: "/uploads/svg/main-page.svg", label: "Главная" },
  { href: "/teams", icon: "/uploads/svg/teams.svg", label: "Команды" },
  { href: "/chat", icon: "/uploads/svg/chat.svg", label: "Чат" },
  { href: "/profile", icon: "/uploads/svg/profile.svg", label: "Профиль" },
  { href: "/settings", icon: "/uploads/svg/settings.svg", label: "Настройки" },
];

export default function Nav({ session, userRole, showTeamProfile }: {
  session: any;
  userRole: string | null;
  showTeamProfile: boolean;
}) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activePos, setActivePos] = useState({ top: 0, height: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const items = useMemo(() => {
    const baseItems: MenuItem[] = [...MENU_ITEMS];
    if (showTeamProfile) baseItems.push({ href: "/teams/profile", icon: "/uploads/svg/team-profile.svg", label: "Моя команда" });
    if (userRole === "ADMIN") baseItems.push({ href: "/admin", icon: "/uploads/svg/admin.svg", label: "Админка", isDanger: true });
    return baseItems;
  }, [showTeamProfile, userRole]);

  useEffect(() => {
    if (hoveredIndex === null || !navRef.current) {
      setActivePos(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const item = itemRefs.current[hoveredIndex];
    if (!item) return;
    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    setActivePos({
      top: itemRect.top - navRect.top - 8,
      height: itemRect.height + 16,
      opacity: 1,
    });
  }, [hoveredIndex]);

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const dist = Math.abs(hoveredIndex - index);
    if (dist === 0) return 1.6;
    if (dist === 1) return 1.3;
    if (dist === 2) return 1.1;
    return 1;
  };

  const getMargin = (index: number) => {
    if (hoveredIndex === null) return "-4px 0";
    const dist = Math.abs(hoveredIndex - index);
    if (dist === 0) return "8px 0";
    if (dist === 1) return "0";
    if (dist === 2) return "-2px 0";
    return "-4px 0";
  };

  return (
    <aside
      className="sidebar-niagara"
      style={{ width: isHovered ? "280px" : "90px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoveredIndex(null); }}
    >
      <nav className="sidebar-nav-overlap" ref={navRef}>
        {/* Активный фон — скользит за кнопками */}
        <div className="sidebar-active-bg" style={{
          top: activePos.top,
          height: activePos.height,
          opacity: activePos.opacity,
          width: isHovered ? "240px" : "72px",
          transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s, width 0.3s",
        }} />

        {items.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const scale = getScale(index);
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={el => { itemRefs.current[index] = el; }}
              className={`sidebar-btn-overlap ${isActive ? "active" : ""} ${item.isDanger ? "danger" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              style={{
                transform: `scale(${scale})`,
                margin: getMargin(index),
                zIndex: hoveredIndex === index ? 10 : 5 - Math.abs((hoveredIndex ?? index) - index),
              }}
            >
              <img src={item.icon} alt="" className="svg-overlap" />
              <span className="sidebar-link-overlap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom-overlap">
        {session?.user ? (
          <form action="/api/auth/signout" method="post" style={{ width: "100%" }}>
            <button type="submit" className="sidebar-btn-overlap logout-btn-overlap">
              <img src="/uploads/svg/logout.svg" alt="" className="svg-overlap" />
              <span className="sidebar-link-overlap">Выйти</span>
            </button>
          </form>
        ) : (
          <Link href="/auth/signin" className="sidebar-btn-overlap login-btn-overlap">
            <img src="/uploads/svg/login.svg" alt="" className="svg-overlap" />
            <span className="sidebar-link-overlap">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

export async function NavServer() {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const { prisma } = await import("@/lib/prisma");
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || null;
  let userTeamId: string | null = null;
  if (session?.user?.id) {
    const userWithTeam = await prisma.user.findUnique({ where: { id: session.user.id }, select: { teamId: true } });
    userTeamId = userWithTeam?.teamId || null;
  }
  const showTeamProfile = !!userTeamId || userRole === "ADMIN";
  return <Nav session={session} userRole={userRole} showTeamProfile={showTeamProfile} />;
}