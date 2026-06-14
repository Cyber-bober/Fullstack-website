// src/components/ui/CookieBanner.tsx
"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="glass-effect" style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      color: "rgba(243, 243, 243, 0.75)", padding: "16px 24px", margin: "0 30px 20px 30px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px", zIndex: 9998, flexWrap: "wrap"
    }}>
      <p style={{ margin: 0, fontSize: "14px", flex: 1, minWidth: "200px" }}>
        Мы используем cookies для работы системы входа и улучшения сервиса. 
        Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
        <a href="/privacy-policy" style={{ color: "#0070f3" }}>Политикой конфиденциальности</a>.
      </p>
      <button onClick={handleAccept} className="btn btn-primary glass-effect" style={{ whiteSpace: "nowrap" }}>
        Принять
      </button>
    </div>
  );
}