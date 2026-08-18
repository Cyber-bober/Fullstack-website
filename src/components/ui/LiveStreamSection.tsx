"use client";
import { useState, useEffect } from "react";
import { extractVkVideoUrl, isValidVkVideoUrl } from "@/lib/vk";

interface LiveStreamData {
  isActive: boolean;
  title: string;
  vkVideoUrl: string;
  vkGroupUrl: string;
  tgGroupUrl: string;
}

interface StreamFormState {
  title: string;
  vkVideoUrl: string;
  vkGroupUrl: string;
  tgGroupUrl: string;
  isActive: boolean;
}

interface Props {
  userRole: string | null;
}

export function LiveStreamSection({ userRole }: Props) {
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [form, setForm] = useState<StreamFormState>({
    title: "",
    vkVideoUrl: "",
    vkGroupUrl: "",
    tgGroupUrl: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    fetch("/api/livestream")
      .then((res) => res.json())
      .then((data) => {
        setStream(data);
        setForm({
          title: data.title || "",
          vkVideoUrl: extractVkVideoUrl(data.vkVideoUrl || ""),
          vkGroupUrl: data.vkGroupUrl || "",
          tgGroupUrl: data.tgGroupUrl || "",
          isActive: data.isActive,
        });
      })
      .catch((err) => console.error("Ошибка загрузки трансляции:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    const cleanVideoUrl = extractVkVideoUrl(form.vkVideoUrl);

    if (form.isActive && cleanVideoUrl && !isValidVkVideoUrl(cleanVideoUrl)) {
      setUrlError(
        "Неверный формат ссылки. Используйте ссылку вида: https://vk.com/video_ext.php?..."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/livestream", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, vkVideoUrl: cleanVideoUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setStream(data);
        setForm((f) => ({ ...f, vkVideoUrl: extractVkVideoUrl(data.vkVideoUrl || "") }));
        setShowAdminPanel(false);
      } else {
        const error = await res.json();
        alert("Ошибка: " + (error.error || "Неизвестная ошибка"));
      }
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      alert("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const openSettings = () => setShowAdminPanel(true);
  const closeSettings = () => {
    setShowAdminPanel(false);
    setUrlError("");
  };

  if (loading) {
    return <p className="empty-text">Загрузка трансляции...</p>;
  }

  const videoSrc = extractVkVideoUrl(stream?.vkVideoUrl || "");
  const urlValid = isValidVkVideoUrl(videoSrc);

  if (!stream || !stream.isActive || !urlValid) {
    return (
      <div className="livestream-container">
        <div className="glass-effect stream-placeholder">
          <h2 className="section-title">Прямая трансляция</h2>
          <p className="empty-text">
            {!stream?.isActive
              ? "Сейчас нет активной трансляции"
              : "Ссылка на видео не настроена или невалидна"}
          </p>
          <div className="stream-placeholder-links">
            <a
              href={stream?.vkGroupUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn glass-btn"
            >
              Наша группа ВК
            </a>
            <a
              href={stream?.tgGroupUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn glass-btn"
            >
              Наш Telegram
            </a>
          </div>
          {userRole === "ADMIN" && (
            <button onClick={openSettings} className="btn btn-primary glass-effect stream-setup-btn">
              Настроить трансляцию
            </button>
          )}
        </div>
        {showAdminPanel && (
          <AdminModal
            form={form}
            setForm={setForm}
            urlError={urlError}
            saving={saving}
            onSave={handleSave}
            onClose={closeSettings}
          />
        )}
      </div>
    );
  }

  return (
    <div className="livestream-container">
      <div className="livestream-header">
        <h2 className="section-title livestream-title">{stream.title}</h2>
        <div className="livestream-actions">
          <span className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </span>
          {userRole === "ADMIN" && (
            <button onClick={openSettings} className="btn glass-btn settings-btn">
              Настройки
            </button>
          )}
        </div>
      </div>

      <div className="glass-effect video-wrapper">
        <iframe
          src={videoSrc}
          className="video-iframe"
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            border: "none",
            display: "block",
            background: "#000",
          }}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title="VK Live Stream"
        />
      </div>

      <div className="social-links-row">
        <a
          href={stream.vkGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn glass-btn social-link"
        >
          Группа ВК
        </a>
        <a
          href={stream.tgGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn glass-btn social-link"
        >
          Telegram канал
        </a>
      </div>

      {showAdminPanel && (
        <AdminModal
          form={form}
          setForm={setForm}
          urlError={urlError}
          saving={saving}
          onSave={handleSave}
          onClose={closeSettings}
        />
      )}
    </div>
  );
}

function AdminModal({
  form,
  setForm,
  urlError,
  saving,
  onSave,
  onClose,
}: {
  form: StreamFormState;
  setForm: (f: StreamFormState | ((prev: StreamFormState) => StreamFormState)) => void;
  urlError: string;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-effect modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="section-title">Настройка трансляции</h3>
        <form onSubmit={onSave}>
          <div className="form-group">
            <label>Название</label>
            <input
              className="glass-effect"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Ссылка на видео ВК</label>
            <textarea
              className="glass-effect form-textarea"
              rows={3}
              value={form.vkVideoUrl}
              onChange={(e) => setForm({ ...form, vkVideoUrl: e.target.value })}
              placeholder="Вставь весь код из ВК (начиная с <iframe...) или просто ссылку"
            />
            <small className="form-hint">
              ВК → Видео → Поделиться → Код для вставки → Скопируй весь код (один раз, Ctrl+V)
            </small>
            {urlError && <small className="form-error">{urlError}</small>}
          </div>
          <div className="form-group">
            <label>Ссылка на группу ВК</label>
            <input
              className="glass-effect"
              type="text"
              value={form.vkGroupUrl}
              onChange={(e) => setForm({ ...form, vkGroupUrl: e.target.value })}
              placeholder="https://vk.com/your_group"
            />
          </div>
          <div className="form-group">
            <label>Ссылка на Telegram</label>
            <input
              className="glass-effect"
              type="text"
              value={form.tgGroupUrl}
              onChange={(e) => setForm({ ...form, tgGroupUrl: e.target.value })}
              placeholder="https://t.me/your_channel"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="checkbox-input"
              />
              <span>Трансляция активна (показывать на сайте)</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary glass-effect" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button type="button" className="btn btn-secondary glass-effect" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
