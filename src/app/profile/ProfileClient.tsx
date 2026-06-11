"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import ImageModal from "@/components/ui/ImageModal";

export default function ProfileClient({ 
  user, 
  isOwnProfile 
}: { 
  user: any; 
  isOwnProfile?: boolean 
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const photos = user.photos || [];

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <div className="photos-section">
          {photos.map((url: string, i: number) => (
            <div key={i} className="photo-link">
              <img
                src={url}
                alt={`Фото ${i + 1}`}
                className="profile-photo"
                onClick={() => setSelectedImage(url)}
                style={{ cursor: "pointer" }}
              />
            </div>
          ))}
          {photos.length === 0 && (
            <div className="profile-photo-empty" />
          )}
        </div>

        <h1 className="profile-name">{user.fullName}</h1>
        <p className="profile-username">@{user.username}</p>
        
        {/* Показываем ссылку на редактирование ТОЛЬКО в своём профиле */}
        {isOwnProfile && (
          <Link href="/profile/edit" className="edit-link">
            Редактировать
          </Link>
        )}
      </Card>

      <div className="info-grid">
        <Card>
          <strong>Дата рождения:</strong>{" "}
          {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "—"}
        </Card>
        <Card>
          <strong>Город:</strong> {user.city || "—"}
        </Card>
        <Card>
          <strong>Позиция:</strong> {user.position || "—"}
        </Card>
        <Card>
          <strong>Команда:</strong> {user.team ? user.team.name : "—"}
        </Card>
      </div>

      {user.contacts && <Card><strong>Контакты:</strong> {user.contacts}</Card>}
      {user.stats && <Card><strong>Статистика:</strong> {user.stats}</Card>}

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="Фото профиля"
          onClose={() => setSelectedImage(null)}
          hasPrev={photos.indexOf(selectedImage) > 0}
          hasNext={photos.indexOf(selectedImage) < photos.length - 1}
          onPrev={() => {
            const idx = photos.indexOf(selectedImage);
            if (idx > 0) setSelectedImage(photos[idx - 1]);
          }}
          onNext={() => {
            const idx = photos.indexOf(selectedImage);
            if (idx < photos.length - 1) setSelectedImage(photos[idx + 1]);
          }}
        />
      )}
    </div>
  );
}