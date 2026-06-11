"use client";
import ImageModal from "./ImageModal";
import { useState } from "react";

type TeamHeaderProps = {
  team: {
    id: string;
    name: string;
    logoUrl?: string;
    photos: string[];
    players: any[];
  };
  canManage: boolean;
  uploading: boolean;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onRemovePhoto: (url: string) => void;
  onAddPlayer: () => void;
};

export default function TeamHeader({
  team,
  canManage,
  uploading,
  onUploadLogo,
  onUploadPhoto,
  onRemoveLogo,
  onRemovePhoto,
  onAddPlayer,
}: TeamHeaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const openGallery = (images: string[], index: number) => {
    setGalleryImages(images);
    setSelectedImage(images[index]);
  };

  const allImages = [
    ...(team.logoUrl ? [team.logoUrl] : []),
    ...team.photos,
  ];

  return (
    <>
      <div className="profile-card card">
        <div className="photos-section">
          {team.logoUrl ? (
            <div className="photo-link" style={{ position: "relative" }}>
              <img
                src={team.logoUrl}
                alt="Логотип"
                className="profile-photo"
                onClick={() => openGallery(allImages, 0)}
              />
              {canManage && (
                <button
                  onClick={onRemoveLogo}
                  className="photo-remove-btn"
                  title="Удалить логотип"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className="profile-photo-empty" />
          )}
        </div>

        <h1 className="profile-name">{team.name}</h1>
        <p className="profile-username">Игроков: {team.players.length}</p>

        {canManage && (
          <div className="flex gap-2 justify-center" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
            <label className="upload-btn">
              {uploading ? "Загрузка..." : "Загрузить логотип"}
              <input
                type="file"
                accept="image/*"
                onChange={onUploadLogo}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
            <button className="btn btn-primary" onClick={onAddPlayer}>
              + Добавить игрока
            </button>
          </div>
        )}
      </div>

      {team.photos.length > 0 && (
        <div className="card">
          <h3 className="section-title">Фото команды</h3>
          <div className="photos-section">
            {team.photos.map((url, i) => (
              <div key={i} className="photo-link" style={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Фото ${i + 1}`}
                  className="profile-photo"
                  onClick={() => openGallery(allImages, allImages.indexOf(url))}
                />
                {canManage && (
                  <button
                    onClick={() => onRemovePhoto(url)}
                    className="photo-remove-btn"
                    title="Удалить фото"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {canManage && team.photos.length < 3 && (
            <div style={{ marginTop: "16px" }}>
              <label className="upload-btn">
                {uploading ? "Загрузка..." : `Добавить фото (${team.photos.length}/3)`}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUploadPhoto}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>
      )}

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
    </>
  );
}