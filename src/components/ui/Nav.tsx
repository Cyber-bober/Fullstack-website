// src/components/Nav.tsx

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Nav() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || null;

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Link href="/" className="nav-logo">
            Football Hub
          </Link>
          <div className="nav-links">
            <Link href="/teams" className="nav-link">Команды</Link>
            <Link href="/chat" className="nav-link">Чат</Link>
          </div>
        </div>

        <div className="nav-right">
          {session?.user ? (
            <>
              <Link href="/profile" className="nav-link">Профиль</Link>
              {userRole === "ADMIN" && (
                <Link href="/admin" className="nav-link">Админка</Link>
              )}
              {(userRole === "ADMIN" || userRole === "EDITOR") && (
                <Link href="/settings" className="nav-link">Настройки</Link>
              )}
              <form action="/api/auth/signout" method="post" style={{ margin: 0 }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: "14px", padding: "6px 14px" }}>
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/signin" className="btn btn-primary" style={{ fontSize: "14px", padding: "6px 14px" }}>Войти</Link>
          )}
        </div>
      </div>
    </nav>
  );
}