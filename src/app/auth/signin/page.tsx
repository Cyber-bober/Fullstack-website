"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get("error") || "";
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam === "CredentialsSignin" ? "Неверный логин или пароль" : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.error) setError("Неверный логин или пароль");
    else router.push(callbackUrl);
  };

  return (
    <div className="signin-container container">
      <div className="glass-effect" style={{ padding: "32px" }}>
        <h1 style={{ marginTop: 0 }}>Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Логин</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Войти</button>
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
