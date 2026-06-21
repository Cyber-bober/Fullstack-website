// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const query = searchParams.get("q") || "";

  const skip = (page - 1) * limit;

  const where = query 
    ? { name: { contains: query, mode: Prisma.QueryMode.insensitive } } 
    : {};

  const allTeamsByRating = await prisma.team.findMany({
    orderBy: [
      { rating: "desc" },  // Сначала по рейтингу (убывание)
      { name: "asc" }      // При одинаковом рейтинге — по имени (возрастание)
    ],
    select: { id: true }
  });

  // Создаём мапу: id команды → её позиция в общем рейтинге
  const globalIndexMap = new Map<string, number>();
  allTeamsByRating.forEach((t, i) => globalIndexMap.set(t.id, i + 1));

  // Получаем команды для текущей страницы (с фильтром поиска)
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { rating: "desc" },
        { name: "asc" }
      ],
      include: {
        captain: { select: { fullName: true } },
        _count: { select: { players: true } }
      }
    }),
    prisma.team.count({ where })
  ]);

  // Добавляем глобальные позиции к каждой команде
  const data = teams.map(t => ({
    ...t,
    globalIndex: globalIndexMap.get(t.id) || 0
  }));

  return NextResponse.json({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  const team = await prisma.team.create({ data: { name, rating: 1500 } });
  return NextResponse.json(team, { status: 201 });
}