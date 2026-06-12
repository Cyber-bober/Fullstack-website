// src/app/api/news/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const post = await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;
  if (!isAdmin && !isAuthor) return NextResponse.json({ error: "Нет прав" }, { status: 403 });

  // УДАЛЕНИЕ ФАЙЛА С ДИСКА (работает всегда, независимо от сжатия)
  if (post.imageUrl) {
    try {
      const filePath = path.join(process.cwd(), "public", post.imageUrl);
      await unlink(filePath);
    } catch (err) {
      console.error("Ошибка удаления файла:", err);
    }
  }

  await prisma.newsPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}