// src/components/ui/Toast.tsx
"use client";
import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  type?: "error" | "success";
  onClose: () => void;
};

export default function Toast({ message, type = "error", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === "success" ? "#10b981" : "#ef4444";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: bgColor,
        color: "white",
        padding: "16px 24px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        transform: visible ? "translateX(0)" : "translateX(120%)",
        transition: "transform 0.3s ease-in-out",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "400px",
      }}
    >
      <span style={{ fontWeight: 500 }}>{message}</span>
      <button 
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px" }}
      >
        ×
      </button>
    </div>
  );
}