// src/app/api/profile/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не выбран или пуст" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      select: { photos: true }
    });
    
    let oldPhotoDeleted = false;
    if (currentUser?.photos && currentUser.photos.length > 0) {
      const oldPhotoPath = currentUser.photos[0];
      
      try {
        const fullPath = path.join(process.cwd(), "public", oldPhotoPath);
        await unlink(fullPath);
        console.log(`Старое фото удалено с диска: ${oldPhotoPath}`);
        oldPhotoDeleted = true;
      } catch (err: any) {
        // Если файла нет на диске (например, уже удален вручную), это не критично
        if (err.code !== 'ENOENT') {
          console.error("Ошибка при удалении старого фото:", err);
        } else {
          console.warn(`Файл не найден на диске (уже удален?): ${oldPhotoPath}`);
        }
      }
    } else {
      console.log("У пользователя не было старого фото, удалять нечего.");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `avatar-${session.user.id}-${Date.now()}.png`;
    await writeFile(path.join(uploadDir, fileName), buffer);

    const photoUrl = `/uploads/avatars/${fileName}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { photos: [photoUrl] },
    });

    console.log(`Новое фото сохранено: ${photoUrl} (старое удалено: ${oldPhotoDeleted})`);

    return NextResponse.json({ url: photoUrl });
  } catch (error) {
    console.error("Ошибка загрузки фото:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}