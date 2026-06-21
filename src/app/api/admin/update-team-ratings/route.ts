// src/app/api/admin/update-team-ratings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ratings } = body; // { teamId1: 1500, teamId2: 1600, ... }

    if (!ratings || typeof ratings !== 'object') {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    // Обновляем все рейтинги в транзакции
    const updates = Object.entries(ratings).map(([teamId, rating]) => 
      prisma.team.update({
        where: { id: teamId },
        data: { rating: Number(rating) }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка обновления рейтингов:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}