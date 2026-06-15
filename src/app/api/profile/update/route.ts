// src/app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json();
  
  // Получаем текущий username из токена или из базы (на всякий случай)
  let currentUsername = session.user.username;
  if (!currentUsername) {
    const dbUser = await prisma.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { username: true } 
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
      stats: body.stats || null,
    };

    if (body.birthDate) {
      const date = new Date(body.birthDate);
      if (!isNaN(date.getTime())) updateData.birthDate = date;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}