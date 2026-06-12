// src/app/api/admin/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Генератор безопасного временного пароля
function generateTempPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  try {
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });

    // Возвращаем временный пароль ТОЛЬКО админу в ответе
    return NextResponse.json({ success: true, tempPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка обновления БД" }, { status: 500 });
  }
}