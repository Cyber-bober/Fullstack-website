//src/app/api/teams/[id]/captain/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ может назначать капитана" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  // Проверяем, что пользователь существует и состоит в команде
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (user.teamId !== params.id) {
    return NextResponse.json({ error: "Пользователь не состоит в этой команде" }, { status: 400 });
  }

  // Назначаем капитана
  await prisma.team.update({
    where: { id: params.id },
    data: { captainId: userId },
  });

  return NextResponse.json({ success: true });
}