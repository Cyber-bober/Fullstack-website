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
    localStorage.setItem("cookies_accepted_at", new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookies"
      className="glass-effect"
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        zIndex: 9999,
        padding: "14px 20px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        color: "var(--text-primary, #1a1a1a)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.5,
          flex: "1 1 260px",
          color: "var(--text-secondary, #4a4a4a)",
        }}
      >
        Мы используем cookies для работы системы входа и улучшения сервиса.
        Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-primary, #0070f3)" }}
        >
          Политикой конфиденциальности.
        </a>
      </p>
      <button
        onClick={handleAccept}
        className="btn btn-primary"
        style={{
          flex: "0 0 auto",
          padding: "8px 20px",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        Принять
      </button>
    </div>
  );
}
