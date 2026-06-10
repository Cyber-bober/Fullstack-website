import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return <p>Доступ запрещён</p>;

  const users = await prisma.user.findMany();
  const posts = await prisma.newsPost.findMany();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Админка</h1>
      <section>
        <h2 className="text-xl font-semibold">Пользователи ({users.length})</h2>
        {users.map(u => <Card key={u.id} className="mb-1 text-sm">{u.fullName} — {u.role}</Card>)}
      </section>
      <section>
        <h2 className="text-xl font-semibold">Посты ({posts.length})</h2>
        {posts.map(p => <Card key={p.id} className="mb-1 text-sm">{p.title} {p.isPublished ? "✅" : "❌"}</Card>)}
      </section>
    </div>
  );
}
