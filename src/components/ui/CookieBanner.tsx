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
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#1a1a1a", color: "white", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px", zIndex: 9998, flexWrap: "wrap"
    }}>
      <p style={{ margin: 0, fontSize: "14px", flex: 1, minWidth: "200px" }}>
        Мы используем cookies для работы системы входа и улучшения сервиса. 
        Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
        <a href="/privacy-policy" style={{ color: "#60a5fa" }}>Политикой конфиденциальности</a>.
      </p>
      <button onClick={handleAccept} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
        Принять
      </button>
    </div>
  );
}