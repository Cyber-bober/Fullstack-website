"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.error) setError("Неверный логин или пароль");
    else window.location.href = "/";
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Вход</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Логин" className="w-full p-2 border rounded" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" className="w-full p-2 border rounded" required />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Войти</button>
      </form>
    </div>
  );
}
