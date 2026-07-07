import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Матч не найден" }, { status: 404 });
    }

    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Events load error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  try {
    const { matchId, minute, text } = await req.json();

    // Валидация обязательных полей
    if (!matchId || !text) {
      return NextResponse.json({ error: "matchId и text обязательны" }, { status: 400 });
    }

    if (text.trim().length === 0 || text.length > 500) {
      return NextResponse.json({ 
        error: "Текст события должен быть от 1 до 500 символов" 
      }, { status: 400 });
    }

    let parsedMinute: number | null = null;
    if (minute !== undefined && minute !== null && minute !== "") {
      parsedMinute = parseInt(minute);
      if (isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 120) {
        return NextResponse.json({ 
          error: "Минута должна быть числом от 0 до 120" 
        }, { status: 400 });
      }
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Матч не найден" }, { status: 404 });
    }

    const event = await prisma.matchEvent.create({
      data: { 
        matchId, 
        minute: parsedMinute, 
        text: text.trim() 
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Event create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const matchId = searchParams.get("matchId");
  const clearAll = searchParams.get("clearAll");

  try {
    if (clearAll === "true" && matchId) {
      await prisma.matchEvent.deleteMany({ where: { matchId } });
      return NextResponse.json({ success: true, deleted: "all" });
    }

    if (!eventId) {
      return NextResponse.json({ 
        error: "eventId или matchId+clearAll=true обязательны" 
      }, { status: 400 });
    }

    await prisma.matchEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}