import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hasXSS, hasSqlInjection } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const { username, fullName, password, city } = await req.json();

  if (!username || !fullName || !password) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: "Логин: 3-30 символов" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Пароль: максимум 128 символов" }, { status: 400 });
  }
  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ error: "Имя: 2-100 символов" }, { status: 400 });
  }
  if (hasXSS(fullName) || hasSqlInjection(fullName) || hasXSS(username) || hasSqlInjection(username)) {
    return NextResponse.json({ error: "Недопустимые символы" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return NextResponse.json({ error: "Username занят" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, fullName, passwordHash, city: city || "", role: "USER", privacyAcceptedAt: new Date() },
  });

  return NextResponse.json({ id: user.id, username: user.username, fullName: user.fullName }, { status: 201 });
}
