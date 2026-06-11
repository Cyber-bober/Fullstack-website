"use client";
import { useEffect, useCallback } from "react";

type ImageModalProps = {
  src: string;
  alt?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export default function ImageModal({
  src,
  alt = "Фото",
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ImageModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePrev = useCallback(() => {
    if (hasPrev && onPrev) {
      onPrev();
    }
  }, [hasPrev, onPrev]);

  const handleNext = useCallback(() => {
    if (hasNext && onNext) {
      onNext();
    }
  }, [hasNext, onNext]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        handlePrev();
      }
      if (e.key === "ArrowRight" && hasNext) {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleEsc);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = originalOverflow;
    };
  }, [handleClose, handlePrev, handleNext, hasPrev, hasNext]);

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose}
      style={{ 
        zIndex: 2000,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          padding: 0,
          background: "transparent",
          boxShadow: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "-40px",
            right: 0,
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 2001,
          }}
          title="Закрыть (Esc)"
        >
          ×
        </button>

        {/* Навигация влево */}
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: "absolute",
              left: "-60px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "white",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: 24,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 2001,
            }}
            title="Предыдущее фото (←)"
          >
            ‹
          </button>
        )}

        {/* Навигация вправо */}
        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: "absolute",
              right: "-60px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "white",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: 24,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 2001,
            }}
            title="Следующее фото (→)"
          >
            ›
          </button>
        )}

        {/* Изображение */}
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        />

        {/* Подпись */}
        <p
          style={{
            color: "white",
            marginTop: 12,
            fontSize: 14,
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {alt}
        </p>
      </div>
    </div>
  );
}