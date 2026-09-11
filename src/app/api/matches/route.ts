import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePayloadSize } from "@/lib/validate";
import { invalidateCache } from "@/lib/redis";

const matchInclude = {
  homeTeam: { select: { id: true, name: true, logoUrl: true } },
  awayTeam: { select: { id: true, name: true, logoUrl: true } },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    let page = parseInt(searchParams.get("page") || "1");
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get("limit") || "50");
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 1000) limit = 1000;

    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status === "upcoming") {
      where.date = { gte: new Date() };
      where.status = "SCHEDULED";
    } else if (status === "live") {
      where.status = "LIVE";
    } else if (status === "finished") {
      where.status = "FINISHED";
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: matchInclude,
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({
      data: matches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Matches load error:", error);
    return NextResponse.json({ error: "Ошибка сервера при загрузке матчей" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const payloadError = validatePayloadSize(req, 10);
  if (payloadError) {
    return NextResponse.json({ error: payloadError }, { status: 413 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { homeTeamId, awayTeamId, date, venue, status } = body;

    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json({ error: "Обязательные поля отсутствуют" }, { status: 400 });
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: "Команда не может играть сама с собой" }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Неверный формат даты" }, { status: 400 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (parsedDate < startOfToday) {
      return NextResponse.json({ error: "Дата не может быть в прошлом" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        date: parsedDate,
        venue: venue || null,
        status: status || "SCHEDULED",
      },
      include: matchInclude,
    });

    await invalidateCache("matches");

    return NextResponse.json(match, { status: 201 });
  } catch (error: any) {
    console.error("Match create error:", error);
    if (error.code === "P2003" || error.code === "P2025") {
      return NextResponse.json({ error: "Неверные данные: команда не найдена" }, { status: 400 });
    }
    return NextResponse.json({ error: "Ошибка сервера при создании матча" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Только администратор" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  try {
    await prisma.match.delete({ where: { id } });
    await invalidateCache("matches");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Match delete error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Матч не найден" }, { status: 404 });
    }
    return NextResponse.json({ error: "Ошибка сервера при удалении матча" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  try {
    const body = await req.json();
    const { date, venue, status, score, stats } = body;

    const updateData: any = {};

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Неверный формат даты" }, { status: 400 });
      }
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (parsedDate < startOfToday) {
        return NextResponse.json({ error: "Дата не может быть в прошлом" }, { status: 400 });
      }
      updateData.date = parsedDate;
    }
    if (venue !== undefined) updateData.venue = venue || null;
    if (status !== undefined) updateData.status = status;
    if (score !== undefined) updateData.score = score || null;
    if (stats !== undefined) updateData.stats = stats || null;

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: matchInclude,
    });

    await invalidateCache("matches");
    return NextResponse.json(match);
  } catch (error: any) {
    console.error("Match update error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Матч не найден" }, { status: 404 });
    }
    return NextResponse.json({ error: "Ошибка сервера при обновлении матча" }, { status: 500 });
  }
}
