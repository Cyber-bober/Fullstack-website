import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

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
    const isAdmin = session.user.role === "ADMIN";

    const targetUserId = isAdmin && body.targetUserId ? body.targetUserId : session.user.id;

    if (body.stats !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: "Только администратор может изменять статистику" },
        { status: 403 }
      );
    }

    if (body.targetUserId && !isAdmin) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    const safeData: any = {};
    if (body.fullName !== undefined) safeData.fullName = body.fullName;
    if (body.city !== undefined) safeData.city = body.city;
    if (body.position !== undefined) safeData.position = body.position;
    if (body.contacts !== undefined) safeData.contacts = body.contacts;
    if (body.stats !== undefined) safeData.stats = body.stats;
    if (body.birthDate) safeData.birthDate = new Date(body.birthDate);

    if (Array.isArray(body.photos)) {
      const validPhotos = body.photos.filter((p: any) => typeof p === 'string');
      if (validPhotos.length <= 3) {
        safeData.photos = validPhotos;
      } else {
        return NextResponse.json({ error: "Максимум 3 фото" }, { status: 400 });
      }
    }

    if (Object.keys(safeData).length === 0) {
      return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: safeData,
    });

    try {
      const keys = await redis.keys(`profile:${targetUserId}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      console.error("Cache invalidation error:", err);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    return NextResponse.json({ error: "Ошибка сервера при обновлении профиля" }, { status: 500 });
  }
}
