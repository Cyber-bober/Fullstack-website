import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <p>Войдите в систему</p>;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return <p>Пользователь не найден</p>;

  return (
    <Card>
      <h1 className="text-2xl font-bold">{user.fullName}</h1>
      <p className="text-gray-500">@{user.username}</p>
      <p>Город: {user.city}</p>
      <p>Роль: {user.role}</p>
    </Card>
  );
}
