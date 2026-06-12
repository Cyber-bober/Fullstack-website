//src/app/auth/register/page.tsx

"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          password: formData.password,
        }),
      });

      if (res.ok) {
        await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        });
        router.push("/profile");
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка регистрации");
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
        <h1 className="home-title text-center">Регистрация</h1>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Имя пользователя (username)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="ivan_petrov"
            />
          </div>

          <div className="form-group">
            <label>Полное имя</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="Иван Петров"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="form-group">
            <label>Подтверждение пароля</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p className="text-gray" style={{ fontSize: "14px" }}>
            Уже есть аккаунт?{" "}
            <a href="/auth/signin">Войти</a>
          </p>
        </div>
      </Card>
    </div>
  );
}