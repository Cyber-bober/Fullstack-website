import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 60; // 1 минута

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json([]);
  }
  
  const cacheKey = `users:search:${query.toLowerCase()}`;

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
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { id: query }, 
      ],
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      photos: true,
      teamId: true,
    },
    take: 10,
  });

  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(users));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(users);
}