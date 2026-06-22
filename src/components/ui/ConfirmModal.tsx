"use client";
import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  onConfirm,
  onCancel,
  variant = "danger",
}: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass = variant === "danger" ? "btn-danger" : variant === "warning" ? "btn-warning" : "btn-primary";

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content glass-effect confirm-modal" onClick={e => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className={`btn ${confirmClass} glass-effect`} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="btn btn-secondary glass-effect" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}