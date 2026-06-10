import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <p className="p-4">Войдите в систему</p>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true },
  });
  if (!user) return <p className="p-4">Пользователь не найден</p>;

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-4">
      <Card className="text-center">
        <div className="flex gap-2 justify-center mb-4">
          {user.photos.map((url, i) => (
            <img key={i} src={url || "/default-avatar.png"} className="w-20 h-20 rounded-full object-cover" />
          ))}
          {user.photos.length === 0 && <div className="w-20 h-20 rounded-full bg-gray-300" />}
        </div>
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <p className="text-gray-500">@{user.username}</p>
        <Link href="/profile/edit" className="text-blue-600 text-sm">Редактировать</Link>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card><strong>Дата рождения:</strong> {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "—"}</Card>
        <Card><strong>Город:</strong> {user.city || "—"}</Card>
        <Card><strong>Позиция:</strong> {user.position || "—"}</Card>
        <Card><strong>Команда:</strong> {user.team ? user.team.name : "—"}</Card>
      </div>

      {user.contacts && <Card><strong>Контакты:</strong> {user.contacts}</Card>}
      {user.stats && <Card><strong>Статистика:</strong> {user.stats}</Card>}
    </div>
  );
}
