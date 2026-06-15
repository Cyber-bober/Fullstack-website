// src/app/api/profile/remove-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    // Получаем текущее фото
    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      select: { photos: true }
    });
    
    if (currentUser?.photos && currentUser.photos.length > 0) {
      const oldPhotoPath = currentUser.photos[0];
      
      // Удаляем файл с диска
      try {
        const fullPath = path.join(process.cwd(), "public", oldPhotoPath);
        await unlink(fullPath);
        console.log(`🗑️ Фото удалено с диска по запросу пользователя: ${oldPhotoPath}`);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error("Ошибка при удалении файла с диска:", err);
        }
      }
    }

    // Очищаем поле photos в базе данных
    await prisma.user.update({
      where: { id: session.user.id },
      data: { photos: [] },
    });

    console.log(`Фото удалено из профиля пользователя ${session.user.id}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Ошибка удаления фото:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}