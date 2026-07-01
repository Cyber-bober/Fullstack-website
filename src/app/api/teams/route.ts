// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redis } from "@/lib/redis";

const CACHE_TTL = 300;

async function invalidateTeamsCache() {
  try {
    const keys = await redis.keys("teams:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} teams cache keys`);
    }
  } catch (err) {
    console.error("Teams cache invalidation error:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const query = searchParams.get("q") || "";

  const cacheKey = `teams:list:page:${page}:limit:${limit}:q:${query}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return NextResponse.json(JSON.parse(cached));
    }
    console.log(`Cache miss: ${cacheKey}`);
  } catch (err) {
    console.error("Redis cache error:", err);
  }

  const skip = (page - 1) * limit;

  const where = query 
    ? { name: { contains: query, mode: Prisma.QueryMode.insensitive } } 
    : {};

  const allTeamsByRating = await prisma.team.findMany({
    orderBy: [
      { rating: "desc" },
      { name: "asc" }
    ],
    select: { id: true }
  });

  const globalIndexMap = new Map<string, number>();
  allTeamsByRating.forEach((t, i) => globalIndexMap.set(t.id, i + 1));

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

  const data = teams.map(t => ({
    ...t,
    globalIndex: globalIndexMap.get(t.id) || 0
  }));

  const result = {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };

  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  
  const team = await prisma.team.create({ data: { name, rating: 1500 } });
  
  await invalidateTeamsCache();
  
  return NextResponse.json(team, { status: 201 });
}