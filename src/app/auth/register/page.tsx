// src/app/auth/register/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", fullName: "", password: "" });
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsentError(false);

    // Ручная проверка галочки
    if (!consentChecked) {
      setConsentError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setToast({ message: "Регистрация успешна! Теперь войдите.", type: "success" });
        setTimeout(() => router.push("/auth/signin"), 1500);
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Ошибка регистрации", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container register-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Card className="glass-effect">
        <h1 className="home-title text-center">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>@username</label>
            <div className="glass-effect"><input 
              type="text" 
              className="glass-input"
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              placeholder="ivan_petrov"
              required 
              minLength={3} 
              maxLength={30} 
              pattern="[a-zA-Z0-9_]+" 
            /></div>
          </div>
          <div className="form-group">
            <label>Полное имя</label>
            <div className="glass-effect"><input 
              type="text" 
              className="glass-input"
              value={formData.fullName} 
              onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              placeholder="Иван"
              required 
            /></div>
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <div className="password-input-wrapper glass-effect">
              <input 
                type={showPassword ? "text" : "password"} 
                className="glass-input"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                placeholder="123456"
                required 
                minLength={6} 
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

          {/* ГАЛОЧКА СОГЛАСИЯ НА ПДн (БЕЗ required, с ручной проверкой) */}
          <div className="pd-consent-wrapper">
            <input 
              type="checkbox" 
              id="pd-consent-reg" 
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (e.target.checked) setConsentError(false);
              }}
              className="pd-consent-checkbox" 
            />
            <label htmlFor="pd-consent-reg" className="pd-consent-label">
              Я согласен на обработку{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="pd-consent-link">
                персональных данных
              </a>{" "}
              в соответствии с Политикой конфиденциальности
            </label>
          </div>
          
          {/* Красный текст ошибки вместо браузерного тултипа */}
          {consentError && (
            <span className="pd-consent-error visible">
              ⚠️ Необходимо согласие на обработку персональных данных
            </span>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>
        <p className="text-center mt-4" style={{ fontSize: "14px" }}>
          Уже есть аккаунт? <a href="/auth/signin" style={{ color: "#0070f3" }}>Войти</a>
        </p>
      </Card>
    </div>
  );
}