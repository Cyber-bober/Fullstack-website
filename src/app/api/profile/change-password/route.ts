import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = body.current || body.currentPassword;
    const newPassword = body.new || body.newPassword;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "У аккаунта нет пароля. Возможно, вы вошли через Google." }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Новый пароль должен быть минимум 6 символов" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка смены пароля:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}