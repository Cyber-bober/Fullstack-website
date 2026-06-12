//src/app/api/auth/set-username/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { username } = await req.json();

  // Валидация
  if (!username || username.length < 3 || username.length > 30) {
    return NextResponse.json(
      { error: "Username должен быть от 3 до 30 символов" },
      { status: 400 }
    );
  }

  // Только латиница, цифры и подчеркивание
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: "Только латинские буквы, цифры и _" },
      { status: 400 }
    );
  }

  // Проверка уникальности
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Этот username уже занят" },
      { status: 400 }
    );
  }

  // Обновляем пользователя
  await prisma.user.update({
    where: { id: session.user.id },
    data: { username },
  });

  return NextResponse.json({ success: true });
}