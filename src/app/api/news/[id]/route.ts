// src/app/api/news/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  // Находим новость
  const post = await prisma.newsPost.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
  }

  // Проверяем права: удалить может только автор или ADMIN
  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Нет прав на удаление" }, { status: 403 });
  }

  // Удаляем новость
  await prisma.newsPost.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}