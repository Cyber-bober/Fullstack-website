import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hasSqlInjection, hasXSS, validateLength } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const { username, password, fullName } = await req.json();

    // Валидация
    if (!username || !password || !fullName) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: "Username: от 3 до 30 символов" }, { status: 400 });
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Пароль: от 6 до 128 символов" }, { status: 400 });
    }

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json({ error: "Имя: от 2 до 100 символов" }, { status: 400 });
    }

    if (hasSqlInjection(username) || hasSqlInjection(fullName)) {
      return NextResponse.json({ error: "Недопустимые символы" }, { status: 400 });
    }

    if (hasXSS(username) || hasXSS(fullName)) {
      return NextResponse.json({ error: "Недопустимые символы" }, { status: 400 });
    }

    // Проверка уникальности
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username уже занят" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, passwordHash, fullName, role: "USER" },
      select: { id: true, username: true, fullName: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}