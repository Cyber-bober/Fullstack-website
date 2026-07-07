import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 60; // 1 минута

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = `profile:${userId}`;

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      city: true,
      position: true,
      contacts: true,
      stats: true,
      birthDate: true,
      photos: true,
      teamId: true,
      team: {
        select: { name: true }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(user));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(user);
}