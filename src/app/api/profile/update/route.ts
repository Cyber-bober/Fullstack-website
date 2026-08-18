import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json();
  const isAdmin = session.user.role === "ADMIN";

  if (body.stats !== undefined && !isAdmin) {
    return NextResponse.json(
      { error: "Статистику может изменять только администратор" },
      { status: 403 }
    );
  }

  if (body.username) {
    const username = String(body.username).trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username: 3-30 символов, только латиница, цифры и _" },
        { status: 400 }
      );
    }
  }

  let currentUsername = session.user.username;
  if (!currentUsername) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });
    currentUsername = dbUser?.username;
  }

  // Проверяем уникальность только если ник реально изменился
  if (body.username && body.username !== currentUsername) {
    const existing = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Этот username уже занят другим пользователем" },
        { status: 400 }
      );
    }
  }

  try {
    const updateData: any = {
      fullName: body.fullName,
      username: body.username,
      city: body.city || null,
      position: body.position || null,
      contacts: body.contacts || null,
    };

    if (isAdmin && body.stats !== undefined) {
      updateData.stats = body.stats;
    }

    if (body.birthDate) {
      const date = new Date(body.birthDate);
      if (!isNaN(date.getTime())) updateData.birthDate = date;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    try {
      const keys = await redis.keys(`profile:${session.user.id}*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      console.error("Cache invalidation error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
