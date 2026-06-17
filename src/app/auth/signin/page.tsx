// src/app/auth/signin/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username, password, redirect: false,
      });

      if (result?.error) {
        setError("Неверный логин или пароль");
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container signin-container">
      <Card className="glass-effect">
        <h1 className="home-title text-center">Вход</h1>

        {(error || errorParam) && (
          <div className="error-message">
            {error || `Ошибка авторизации: ${errorParam}`}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Имя пользователя</label>
            <div className="glass-effect"><input type="text" className="glass-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ivan_petrov" required /></div>
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <div className="password-input-wrapper glass-effect">
              <input 
                type={showPassword ? "text" : "password"} 
                className="glass-input"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="123456"
                required 
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <img src="/uploads/svg/eye-off.svg" className="svg"/>
                ) : (
                  <img src="/uploads/svg/eye-on.svg" className="svg"/>
                )}
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary glass-effect w-full" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p className="text-gray" style={{ fontSize: "14px" }}>
            Нет аккаунта? <a href="/auth/register" style={{ color: "#0070f3", textDecoration: "none" }}>Зарегистрироваться</a>
          </p>
        </div>
      </Card>
    </div>
  );
}