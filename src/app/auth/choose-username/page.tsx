//src/app/auth/choose-username/page.tsx

"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

export default function ChooseUsernamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Если не авторизован или уже есть username — редирект
  if (status === "unauthenticated") router.push("/auth/signin");
  if (session?.user && !session.user.username.startsWith("oauth_")) {
    router.push("/profile");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        // Обновляем сессию и переходим в профиль
        await signIn(undefined, { callbackUrl: "/profile" });
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка установки username");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px" }}>
      <Card>
        <h1 className="home-title text-center">Выберите @username</h1>
        <p className="text-gray text-center" style={{ marginBottom: "1rem" }}>
          Этот ник будет виден всем пользователям
        </p>

        {error && (
          <div style={{ color: "#dc3545", marginBottom: "16px", padding: "12px", background: "#fff5f5", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>@username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ivan_petrov"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
            />
            <small className="text-gray">Только латинские буквы, цифры и _</small>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Сохранение..." : "Подтвердить"}
          </button>
        </form>
      </Card>
    </div>
  );
}