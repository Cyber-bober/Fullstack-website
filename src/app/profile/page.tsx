// src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true },
  });

  if (!user) redirect("/");

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <div className="photos-section">
          {(user.photos || []).map((url: string, i: number) => (
            <div key={i} className="photo-link">
              <img src={url} alt={`Photo ${i + 1}`} className="profile-photo" />
            </div>
          ))}
          {(!user.photos || user.photos.length === 0) && (
            <div className="profile-photo-empty" />
          )}
        </div>
        
        <h1 className="profile-name">{user.fullName}</h1>
        <p className="profile-username">@{user.username}</p>
        <Link href="/profile/edit" className="edit-link">Редактировать</Link>
      </Card>

      <div className="info-grid">
        <Card>
          <strong>Дата рождения:</strong> {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "—"}
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
    </div>
  );
}