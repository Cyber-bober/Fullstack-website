//src/app/auth/signin/page.tsx

"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный логин или пароль");
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { 
        callbackUrl: "/profile",
        redirect: true,
      });
    } catch (err) {
      setError("Ошибка входа через Google");
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px" }}>
      <Card>
        <h1 className="home-title text-center">Вход</h1>

        {error && (
          <div style={{
            color: "#dc3545",
            marginBottom: "16px",
            padding: "12px",
            background: "#fff5f5",
            borderRadius: "8px",
          }}>
            {error}
          </div>
        )}

        {errorParam && (
          <div style={{
            color: "#dc3545",
            marginBottom: "16px",
            padding: "12px",
            background: "#fff5f5",
            borderRadius: "8px",
          }}>
            Ошибка: {errorParam}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ivan_petrov"
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p className="text-gray" style={{ fontSize: "14px" }}>
            Нет аккаунта?{" "}
            <a href="/auth/register">Зарегистрироваться</a>
          </p>
        </div>

        <div style={{
          marginTop: "24px",
          borderTop: "1px solid #e5e5e7",
          paddingTop: "24px",
        }}>
          <p className="text-center text-gray" style={{ fontSize: "14px", marginBottom: "16px" }}>
            Или войдите через Google
          </p>
          <button
            className="btn w-full"
            style={{ background: "#4267B2", color: "white" }}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти через Google"}
          </button>
        </div>
      </Card>
    </div>
  );
}