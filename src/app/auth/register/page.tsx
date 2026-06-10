"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", fullName: "", city: "" });
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Примите пользовательское соглашение"); return; }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.push("/auth/signin");
    else { const d = await res.json(); setError(d.error); }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Регистрация</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="text" placeholder="Логин" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Пароль" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2 border rounded" required />
        <input type="text" placeholder="ФИО" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full p-2 border rounded" required />
        <input type="text" placeholder="Город" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full p-2 border rounded" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          Принимаю <Link href="/terms" className="text-blue-600">пользовательское соглашение</Link>
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Зарегистрироваться</button>
      </form>
      <p className="mt-4 text-sm text-center">Уже есть аккаунт? <Link href="/auth/signin" className="text-blue-600">Войти</Link></p>
    </div>
  );
}
