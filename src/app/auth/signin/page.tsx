// src/app/auth/signin/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get("error") || "";
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam === "CredentialsSignin" ? "Неверный логин или пароль" : "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signIn("credentials", { 
        username, 
        password, 
        redirect: false,
        callbackUrl: callbackUrl
      });
      
      if (result?.error) {
        setError("Неверный логин или пароль");
        setIsLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("Ошибка подключения. Попробуйте ещё раз.");
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container container">
      <div className="glass-effect" style={{ padding: "32px" }}>
        <h1 style={{ marginTop: 0 }}>Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Логин</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? "Вход..." : "Войти"}
          </button>
        </form>
        <p className="text-center mt-4">
          Нет аккаунта? <Link href="/auth/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container"><p>Загрузка...</p></div>}>
      <SignInForm />
    </Suspense>
  );
}