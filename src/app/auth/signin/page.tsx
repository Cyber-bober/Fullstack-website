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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
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