//src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, fullName, password, city } = await req.json();

  if (!username || !fullName || !password) {
    return NextResponse.json(
      { error: "Все обязательные поля должны быть заполнены" }, 
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль должен быть минимум 6 символов" }, 
      { status: 400 }
    );
  }

  // Проверяем существующего пользователя
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Пользователь с таким username уже существует" }, 
      { status: 400 }
    );
  }

  // Хэшируем пароль
  const passwordHash = await bcrypt.hash(password, 10);

  // Создаём пользователя
  const user = await prisma.user.create({
    data: {
      username,
      fullName,
      passwordHash,
      city: city || "", // city теперь необязательное
      role: "USER",
    },
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
  });
}