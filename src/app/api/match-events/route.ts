import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Получить события матча
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const events = await prisma.matchEvent.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(events);
}

// POST: Добавить событие (только EDITOR/ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  const { matchId, minute, text } = await req.json();

  if (!matchId || !text) {
    return NextResponse.json({ error: "matchId и text обязательны" }, { status: 400 });
  }

  const event = await prisma.matchEvent.create({
    data: { matchId, minute: minute ? parseInt(minute) : null, text },
  });

  return NextResponse.json(event, { status: 201 });
}

// DELETE: Очистить все события матча (только ADMIN)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  await prisma.matchEvent.deleteMany({ where: { matchId } });

  return NextResponse.json({ success: true });
}