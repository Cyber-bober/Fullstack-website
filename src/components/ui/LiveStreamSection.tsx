"use client";
import { useState, useEffect } from "react";

interface LiveStreamData {
  isActive: boolean;
  title: string;
  vkVideoUrl: string;
  vkGroupUrl: string;
  tgGroupUrl: string;
}

interface Props {
  userRole: string | null;
}

function extractVideoUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const iframeMatch = input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }
  return trimmed;
}

function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    if (!isHttp) return false;
    const hostname = parsed.hostname.toLowerCase();
    const isVK = hostname.includes("vk.com") || hostname.includes("vkvideo.ru") || hostname.includes("vk.ru");
    if (!isVK) return false;
    return parsed.pathname.includes("video_ext.php") || parsed.pathname.includes("/video") || parsed.pathname.includes("/embed");
  } catch {
    return false;
  }
}

export function LiveStreamSection({ userRole }: Props) {
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [form, setForm] = useState({
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
      .then(res => res.json())
      .then(data => {
        setStream(data);
        setForm({
          title: data.title || "",
          vkVideoUrl: data.vkVideoUrl || "",
          vkGroupUrl: data.vkGroupUrl || "",
          tgGroupUrl: data.tgGroupUrl || "",
          isActive: data.isActive,
        });
        setIframeError(false);
      })
      .catch(err => console.error("Ошибка загрузки трансляции:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    if (form.isActive && form.vkVideoUrl && !isValidVideoUrl(form.vkVideoUrl)) {
      setUrlError("Неверный формат ссылки. Используйте ссылку вида: https://vk.com/video_ext.php?...");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/livestream", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setStream(data);
        setShowAdminPanel(false);
        setIframeError(false);
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

  const urlValid = isValidVideoUrl(stream?.vkVideoUrl || "");

  if (!stream || !stream.isActive || !urlValid) {
    return (
      <div className="livestream-container">
        <div className="glass-effect stream-placeholder">
          <h2 className="section-title">Прямая трансляция</h2>
          <p className="empty-text">
            {!stream?.isActive ? "Сейчас нет активной трансляции" : "Ссылка на видео не настроена или невалидна"}
          </p>
          <div className="stream-placeholder-links">
            <a href={stream?.vkGroupUrl || "#"} target="_blank" rel="noopener noreferrer" className="btn glass-btn">
              Наша группа ВК
            </a>
            <a href={stream?.tgGroupUrl || "#"} target="_blank" rel="noopener noreferrer" className="btn glass-btn">
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
          <AdminModal form={form} setForm={setForm} urlError={urlError} saving={saving} onSave={handleSave} onClose={closeSettings} />
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
        {iframeError ? (
          <div className="video-error-overlay">
            <div className="video-error-icon">!</div>
            <h3 className="video-error-title">Видео недоступно</h3>
            <p className="video-error-text">
              Не удалось загрузить видео. Проверьте ссылку в настройках или зайдите позже.
            </p>
            {userRole === "ADMIN" && (
              <button onClick={openSettings} className="btn btn-primary glass-effect video-error-btn">
                Исправить ссылку
              </button>
            )}
          </div>
        ) : (
          <iframe
            src={stream.vkVideoUrl}
            className="video-iframe"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture;"
            allowFullScreen
            title="VK Live Stream"
            onLoad={() => setIframeError(false)}
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      <div className="social-links-row">
        <a href={stream.vkGroupUrl} target="_blank" rel="noopener noreferrer" className="btn glass-btn social-link">
          Группа ВК
        </a>
        <a href={stream.tgGroupUrl} target="_blank" rel="noopener noreferrer" className="btn glass-btn social-link">
          Telegram канал
        </a>
      </div>

      {showAdminPanel && (
        <AdminModal form={form} setForm={setForm} urlError={urlError} saving={saving} onSave={handleSave} onClose={closeSettings} />
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
  form: any;
  setForm: (f: any) => void;
  urlError: string;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-effect modal-content" onClick={e => e.stopPropagation()}>
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
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Ссылка на видео ВК (iframe src)</label>
            <textarea
              className="glass-effect form-textarea"
              rows={3}
              value={form.vkVideoUrl}
              onChange={e => {
                const extractedUrl = extractVideoUrl(e.target.value);
                setForm({ ...form, vkVideoUrl: extractedUrl });
              }}
              placeholder="Вставь сюда код из ВК (начиная с <iframe...)"
            />
            <small className="form-hint">
              ВК → Видео → Поделиться → Код для вставки → Скопируй весь код
            </small>
            {urlError && <small className="form-error">{urlError}</small>}
          </div>
          <div className="form-group">
            <label>Ссылка на группу ВК</label>
            <input
              className="glass-effect"
              type="text"
              value={form.vkGroupUrl}
              onChange={e => setForm({ ...form, vkGroupUrl: e.target.value })}
              placeholder="https://vk.com/your_group"
            />
          </div>
          <div className="form-group">
            <label>Ссылка на Telegram</label>
            <input
              className="glass-effect"
              type="text"
              value={form.tgGroupUrl}
              onChange={e => setForm({ ...form, tgGroupUrl: e.target.value })}
              placeholder="https://t.me/your_channel"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
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