// src/app/api/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Безопасная проверка роли
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  const { homeTeamId, awayTeamId, date, venue } = await req.json();

  if (homeTeamId === awayTeamId) {
    return NextResponse.json({ error: "Команда не может играть сама с собой" }, { status: 400 });
  }

  try {
    const match = await prisma.match.create({ 
      data: { 
        homeTeamId, 
        awayTeamId, 
        date: new Date(date), 
        venue,
        status: "SCHEDULED" // Явно задаем статус по умолчанию
      } 
    });
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания матча:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор может удалять матчи" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID матча обязателен" }, { status: 400 });

  try {
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления матча:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
  const data = await req.json();
  const match = await prisma.match.update({ where: { id }, data });
  return NextResponse.json(match);
}