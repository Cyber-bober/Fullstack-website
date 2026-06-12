//src/app/api/teams/[id]/players/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получить список игроков команды
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      players: {
        select: {
          id: true,
          fullName: true,
          username: true,
          position: true,
          photos: true,
        },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  }

  return NextResponse.json(team.players);
}

// POST - добавить игрока в команду
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  // Проверяем, что пользователь админ или капитан команды
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { captain: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  }

  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isCaptain && !isAdmin) {
    return NextResponse.json({ error: "Только админ или капитан может добавлять игроков" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  // Проверяем, не состоит ли уже в другой команде
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  if (existingUser?.teamId) {
    return NextResponse.json({ error: "Игрок уже состоит в другой команде" }, { status: 400 });
  }

  // Добавляем игрока в команду
  await prisma.user.update({
    where: { id: userId },
    data: { teamId: params.id },
  });

  return NextResponse.json({ success: true });
}

// DELETE - удалить игрока из команды
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { captain: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  }

  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isCaptain && !isAdmin) {
    return NextResponse.json({ error: "Только админ или капитан может удалять игроков" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  // Нельзя удалить капитана через этот endpoint
  if (userId === team.captainId) {
    return NextResponse.json({ error: "Нельзя удалить капитана. Сначала назначьте нового капитана" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { teamId: null },
  });

  return NextResponse.json({ success: true });
}