"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import ImageModal from "@/components/ui/ImageModal";

type Player = {
  id: string;
  fullName: string;
  position?: string;
  username: string;
  photos: string[];
  isCaptain?: boolean;
};

type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  photos: string[];
  captainId?: string;
  players: Player[];
};

export default function TeamPage({ params }: { params: { id: string } }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    loadTeam();
  }, [params.id]);

  const loadTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${params.id}`);
      if (res.ok) {
        const data: Team = await res.json();
        data.players = data.players.map((p) => ({
          ...p,
          isCaptain: p.id === data.captainId,
        }));
        setTeam(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "photo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch(`/api/teams/${params.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await loadTeam();
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка загрузки");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string, type: "logo" | "photo") => {
    if (!confirm("Удалить фото?")) return;

    try {
      const res = await fetch(`/api/teams/${params.id}/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (res.ok) {
        await loadTeam();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Открыть фото в галерее
  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setSelectedImage(images[index]);
  };

  if (loading) return <p className="empty-text">Загрузка...</p>;
  if (!team) return <p className="empty-text">Команда не найдена</p>;

  // Все фото для галереи (логотип + фото команды)
  const allGalleryImages = [
    ...(team.logoUrl ? [team.logoUrl] : []),
    ...team.photos,
  ];

  return (
    <div className="container">
      <Card className="profile-card">
        {/* Логотип */}
        <div className="photos-section">
          {team.logoUrl ? (
            <div className="photo-link" style={{ position: "relative" }}>
              <img
                src={team.logoUrl}
                alt="Логотип"
                className="profile-photo"
                onClick={() =>
                  openGallery(allGalleryImages, allGalleryImages.indexOf(team.logoUrl!))
                }
                style={{ cursor: "pointer" }}
              />
              <button
                onClick={() => handleRemove(team.logoUrl!, "logo")}
                className="photo-remove-btn"
                title="Удалить логотип"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="profile-photo-empty" />
          )}
        </div>

        <h1 className="profile-name">{team.name}</h1>
        <p className="profile-username">Игроков: {team.players.length}</p>

        <div style={{ marginTop: "1rem" }}>
          <label className="upload-btn" style={{ cursor: "pointer" }}>
            {uploading ? "Загрузка..." : "Загрузить логотип"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "logo")}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </Card>

      {/* Фото команды */}
      {team.photos.length > 0 && (
        <Card>
          <h3 className="section-title">Фото команды</h3>
          <div className="photos-section">
            {team.photos.map((url, i) => (
              <div key={i} className="photo-link" style={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Фото ${i + 1}`}
                  className="profile-photo"
                  onClick={() =>
                    openGallery(allGalleryImages, allGalleryImages.indexOf(url))
                  }
                  style={{ cursor: "pointer" }}
                />
                <button
                  onClick={() => handleRemove(url, "photo")}
                  className="photo-remove-btn"
                  title="Удалить фото"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {team.photos.length < 3 && (
        <Card>
          <label className="upload-btn" style={{ cursor: "pointer" }}>
            {uploading
              ? "Загрузка..."
              : `Добавить фото (${team.photos.length}/3)`}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "photo")}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </Card>
      )}

      {/* Состав */}
      <h2 className="section-title">Состав</h2>
      <div className="team-players">
        {team.players.map((player) => (
          <Link
            key={player.id}
            href={`/profile/${player.id}`}
            className="team-player-card"
          >
            <div className="player-avatar">
              {player.photos[0] ? (
                <img src={player.photos[0]} alt={player.fullName} />
              ) : (
                <div className="player-avatar-placeholder" />
              )}
              {player.isCaptain && <span className="captain-badge">⭐</span>}
            </div>
            <div className="player-info">
              <div className="player-name">
                {player.fullName}
                {player.isCaptain && (
                  <span className="captain-label">Капитан</span>
                )}
              </div>
              <div className="player-position">
                {player.position || "Не указана"}
              </div>
              <div className="player-username">@{player.username}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Модальное окно для фото */}
      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="Фото команды"
          onClose={() => {
            setSelectedImage(null);
            setGalleryImages([]);
          }}
          hasPrev={galleryImages.indexOf(selectedImage) > 0}
          hasNext={galleryImages.indexOf(selectedImage) < galleryImages.length - 1}
          onPrev={() => {
            const idx = galleryImages.indexOf(selectedImage);
            if (idx > 0) setSelectedImage(galleryImages[idx - 1]);
          }}
          onNext={() => {
            const idx = galleryImages.indexOf(selectedImage);
            if (idx < galleryImages.length - 1) setSelectedImage(galleryImages[idx + 1]);
          }}
        />
      )}
    </div>
  );
}