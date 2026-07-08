import Link from "next/link";

export const metadata = {
  title: "404 - Страница не найдена",
  description: "Запрошенная страница не существует",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="container text-center" style={{ padding: "80px 20px" }}>
      <h1 style={{ fontSize: "120px", margin: 0, color: "var(--color-primary)" }}>
        404
      </h1>
      <h2>Страница не найдена</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Возможно, она была удалена или перемещена
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btn-primary">
          На главную
        </Link>
        <Link href="/news" className="btn btn-secondary">
          Новости
        </Link>
        <Link href="/teams" className="btn btn-secondary">
          Команды
        </Link>
      </div>
    </div>
  );
}