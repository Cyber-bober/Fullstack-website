import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 30; // 30 секунд

async function invalidateAdminUsersCache() {
  try {
    const keys = await redis.keys("admin:users:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} admin users cache keys`);
    }
  } catch (err) {
    console.error("Admin users cache invalidation error:", err);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const cacheKey = "admin:users:list";

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

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(users));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(users);
}

export { invalidateAdminUsersCache };