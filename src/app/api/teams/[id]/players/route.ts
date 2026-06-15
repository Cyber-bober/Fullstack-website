// src/app/api/teams/[id]/players/route.ts

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

// POST - добавить или перевести игрока в команду
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  // 1. Проверяем существование команды и права пользователя
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
    return NextResponse.json({ 
      error: "Только администратор или капитан команды может управлять составом" 
    }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "ID пользователя обязателен" }, { status: 400 });
  }

  // 2. Получаем данные целевого пользователя
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true, fullName: true, username: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  // 3. Логика проверки в зависимости от роли
  if (targetUser.teamId) {
    // Игрок уже в какой-то команде
    if (targetUser.teamId === params.id) {
      // Игрок уже в ЭТОЙ команде
      return NextResponse.json({ 
        success: true, 
        message: `${targetUser.fullName} уже состоит в этой команде` 
      });
    } 
    
    // Игрок в ДРУГОЙ команде
    if (!isAdmin) {
      // Капитан НЕ может забирать игроков из других команд
      return NextResponse.json({ 
        error: "Этот игрок уже состоит в другой команде. Только администратор может переводить игроков." 
      }, { status: 400 });
    }
    
    // Если ADMIN - разрешаем принудительный перевод
    console.log(`[ADMIN] Принудительный перевод ${targetUser.username} из команды ${targetUser.teamId} в ${params.id}`);
  }

  // 4. Обновляем привязку к команде (создаем новую или перезаписываем старую)
  await prisma.user.update({
    where: { id: userId },
    data: { teamId: params.id },
  });

  return NextResponse.json({ 
    success: true, 
    message: `${targetUser.fullName} успешно добавлен в команду` 
  });
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