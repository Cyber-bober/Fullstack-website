import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { players: { select: { id: true, fullName: true, username: true, position: true, photos: true } } },
  });
  if (!team) return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  return NextResponse.json(team.players);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { id: params.id }, include: { captain: true } });
  if (!team) return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });

  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCaptain && !isAdmin) return NextResponse.json({ error: "Нет прав" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "ID пользователя обязателен" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true, fullName: true } });
  if (!targetUser) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  if (targetUser.teamId === params.id) {
    return NextResponse.json({ success: true, message: `${targetUser.fullName} уже в команде` });
  }

  if (targetUser.teamId && !isAdmin) {
    return NextResponse.json({ error: "Игрок уже в другой команде. Только админ может переводить." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { teamId: params.id } });
  return NextResponse.json({ success: true, message: `${targetUser.fullName} добавлен` });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { id: params.id }, include: { captain: true } });
  if (!team) return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });

  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCaptain && !isAdmin) return NextResponse.json({ error: "Нет прав" }, { status: 403 });

  // Читаем userId из query-параметров (как в тесте: ?userId=...)
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId обязателен" }, { status: 400 });

  if (userId === team.captainId) {
    return NextResponse.json({ error: "Нельзя удалить капитана" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { teamId: null } });
  return NextResponse.json({ success: true });
}
