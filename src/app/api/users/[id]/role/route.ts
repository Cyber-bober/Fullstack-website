import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { role } = await req.json();

  if (!["USER", "EDITOR", "CAPTAIN", "ADMIN"].includes(role)) {
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