//src/app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();

    // Разрешаем обновлять ТОЛЬКО безопасные поля
    const safeData: any = {};
    if (body.fullName) safeData.fullName = body.fullName;
    if (body.city) safeData.city = body.city;
    if (body.position) safeData.position = body.position;
    if (body.contacts) safeData.contacts = body.contacts;
    if (body.stats) safeData.stats = body.stats;
    if (body.birthDate) safeData.birthDate = new Date(body.birthDate);

    // Обработка фото: принимаем массив URL
    if (Array.isArray(body.photos)) {
      // Проверим, что каждый элемент — строка (URL или base64)
      const validPhotos = body.photos.filter((p: any) => typeof p === 'string');
      if (validPhotos.length <= 3) { // Максимум 3 фото
        safeData.photos = validPhotos;
      } else {
        return NextResponse.json({ error: "Максимум 3 фото" }, { status: 400 });
      }
    }

    if (Object.keys(safeData).length === 0) {
      return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: safeData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    return NextResponse.json({ error: "Ошибка сервера при обновлении профиля" }, { status: 500 });
  }
}