// src/components/ui/Toast.tsx

"use client";
import { useEffect, useState } from "react";

type ToastType = "error" | "success" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type = "error", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Небольшая задержка для запуска CSS-анимации
    requestAnimationFrame(() => setVisible(true));
    
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type} ${visible ? "visible" : ""}`}>
      <span>{message}</span>
      <button className="toast-close-btn" onClick={() => { setVisible(false); setTimeout(onClose, 300); }}>
        ×
      </button>
    </div>
  );
}