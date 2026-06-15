// src/app/api/profile/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    
    if (!file) return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `avatar-${session.user.id}-${Date.now()}.png`;
    await writeFile(path.join(uploadDir, fileName), buffer);

    const photoUrl = `/uploads/avatars/${fileName}`;

    // Обновляем массив photos у пользователя (оставляем только 1 главное фото)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { photos: [photoUrl] },
    });

    return NextResponse.json({ url: photoUrl });
  } catch (error) {
    console.error("Ошибка загрузки фото:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}