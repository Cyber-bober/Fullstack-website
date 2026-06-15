// src/app/settings/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function SettingsPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [passwordData, setPasswordData] = useState({ current: "", new: "" });
  const [changingPass, setChangingPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Пароль успешно изменен!", type: "success" });
        setPasswordData({ current: "", new: "" });
      } else {
        setToast({ message: data.error || "Ошибка смены пароля", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="glass-effect">
        <h1 className="home-title text-center">Настройки аккаунта</h1>
        
        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 className="section-title">Безопасность</h3>
          <p className="text-gray" style={{ marginBottom: "16px" }}>
            Измените пароль для входа в аккаунт. Пароль должен содержать минимум 6 символов.
          </p>
          
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Текущий пароль</label>
              <div className="password-input-wrapper">
                <input 
                  type={showCurrentPass ? "text" : "password"} 
                  className="glass-effect"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  required 
                />
                <span className="password-toggle-icon" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                  {showCurrentPass ? <EyeOffIcon /> : <EyeIcon />}
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label>Новый пароль</label>
              <div className="password-input-wrapper">
                <input 
                  type={showNewPass ? "text" : "password"} 
                  className="glass-effect"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  required 
                  minLength={6} 
                />
                <span className="password-toggle-icon" onClick={() => setShowNewPass(!showNewPass)}>
                  {showNewPass ? <EyeOffIcon /> : <EyeIcon />}
                </span>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary glass-effect" disabled={changingPass}>
              {changingPass ? "Сохранение..." : "Изменить пароль"}
            </button>
          </form>
        </div>

        {/* Здесь можно добавить другие настройки в будущем */}
        <div>
          <h3 className="section-title">Прочее</h3>
          <p className="text-gray">Дополнительные настройки появятся здесь позже.</p>
        </div>
      </Card>
    </div>
  );
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);