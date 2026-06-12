//src/app/admin/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="container"><p>Доступ запрещён</p></div>;
  }

  const users = await prisma.user.findMany();
  const posts = await prisma.newsPost.findMany();

  return (
    <div className="container">
      <h1 className="home-title">Админка</h1>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 className="section-title">Пользователи ({users.length})</h2>
        {users.map((u) => (
          <Card key={u.id}>
            <strong>{u.fullName}</strong> — {u.role}
          </Card>
        ))}
      </section>

      <section>
        <h2 className="section-title">Посты ({posts.length})</h2>
        {posts.map((p) => (
          <Card key={p.id}>
            <strong>{p.title}</strong> {p.isPublished ? "✅" : "❌"}
          </Card>
        ))}
      </section>
    </div>
  );
}