import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 120; // 2 минуты

async function invalidateMatchesCache() {
  try {
    const keys = await redis.keys("matches:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} matches cache keys`);
    }
  } catch (err) {
    console.error("Matches cache invalidation error:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const skip = (page - 1) * limit;

  const cacheKey = `matches:list:page:${page}:limit:${limit}:status:${status || 'all'}`;

  // Пробуем кэш
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

  const where: any = {};
  if (status === 'upcoming') { where.date = { gte: new Date() }; where.status = 'SCHEDULED'; }
  else if (status === 'live') where.status = 'LIVE';
  else if (status === 'finished') where.status = 'FINISHED';

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where, skip, take: limit, orderBy: { date: "desc" },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  const result = {
    data: matches,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };

  // Сохраняем в кэш
  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }
  const { homeTeamId, awayTeamId, date, venue } = await req.json();
  if (homeTeamId === awayTeamId) return NextResponse.json({ error: "Команда не может играть сама с собой" }, { status: 400 });
  
  const match = await prisma.match.create({ data: { homeTeamId, awayTeamId, date: new Date(date), venue } });
  
  // Инвалидируем кэш
  await invalidateMatchesCache();
  
  return NextResponse.json(match, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
  
  await prisma.match.delete({ where: { id } });
  
  // Инвалидируем кэш
  await invalidateMatchesCache();
  
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Только редактор или админ" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
  const data = await req.json();
  const match = await prisma.match.update({ where: { id }, data });
  
  // Инвалидируем кэш
  await invalidateMatchesCache();
  
  return NextResponse.json(match);
}