// src/app/api/teams/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Проверка авторизации и прав админа
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор может изменять статистику" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Разрешаем обновлять только поле stats
    const updateData: any = {};
    if (body.stats !== undefined) updateData.stats = body.stats;

    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Ошибка обновления команды:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}