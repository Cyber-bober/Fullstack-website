"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";

export default function SettingsPage() {
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [passwordData, setPasswordData] = useState({ current: "", new: "" });
  const [changingPass, setChangingPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const currentTheme = savedTheme || "dark";
    setTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.body.setAttribute("data-theme", currentTheme);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
  };

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
    } catch (err) {
      console.error("Ошибка смены пароля:", err);
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
        
        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="section-title">Внешний вид</h3>
          <p className="text-gray" style={{ marginBottom: "16px" }}>
            Выберите тему оформления сайта.
          </p>
          <div className="theme-switcher">
            <div 
              className={`theme-option glass-effect ${theme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleThemeChange("dark")}
            >
              <MoonIcon />
              <span>Тёмная</span>
            </div>
            <div 
              className={`theme-option glass-effect ${theme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleThemeChange("light")}
            >
              <SunIcon />
              <span>Светлая</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
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
                  autoComplete="current-password"
                  id="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  aria-label={showCurrentPass ? "Скрыть пароль" : "Показать пароль"}
                  tabIndex={-1}
                >
                  {showCurrentPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
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
                  autoComplete="new-password"
                  id="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  aria-label={showNewPass ? "Скрыть пароль" : "Показать пароль"}
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary glass-effect" disabled={changingPass}>
              {changingPass ? "Сохранение..." : "Изменить пароль"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="section-title">Прочее</h3>
          <p className="text-gray">Дополнительные настройки появятся здесь позже.</p>
        </div>
      </Card>
    </div>
  );
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);