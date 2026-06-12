// src/app/api/users/[id]/role/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Проверка прав: только ADMIN может менять роли
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { role } = await req.json();

  // Валидация роли
  if (!["USER", "EDITOR", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, username: true, fullName: true, role: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Ошибка обновления роли:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}