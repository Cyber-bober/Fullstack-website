// src/app/api/news/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const file = formData.get("image") as File | null;

  let imageUrl: string | null = null;

  if (file && file.size > 0) {
    // Создаем папку для новостей, если её нет
    const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Сохраняем оригинальное имя файла, добавляя timestamp для уникальности
    const fileName = `news-${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    const filePath = path.join(uploadDir, fileName);

    // Просто записываем файл как есть, без сжатия
    await writeFile(filePath, buffer);
    
    imageUrl = `/uploads/news/${fileName}`;
  }

  const post = await prisma.newsPost.create({
    data: {
      title,
      content,
      imageUrl,
      authorId: session.user.id,
      isPublished: true,
    },
    include: {
      author: { select: { id: true, fullName: true, username: true } }
    }
  });

  return NextResponse.json(post, { status: 201 });
}