import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 10;

async function invalidateChatCache(userId: string, otherUserId: string) {
  try {
    const key1 = `chat:messages:${userId}:${otherUserId}`;
    const key2 = `chat:messages:${otherUserId}:${userId}`;
    await redis.del([key1, key2]);
    console.log(`Invalidated chat cache for ${userId} <-> ${otherUserId}`);
  } catch (err) {
    console.error("Chat cache invalidation error:", err);
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId");

  if (!otherUserId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const userId = session.user.id;
  const [id1, id2] = [userId, otherUserId].sort();
  const cacheKey = `chat:messages:${id1}:${id2}`;

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

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, fullName: true, username: true, photos: true } },
      receiver: { select: { id: true, fullName: true, username: true, photos: true } },
    },
  });

  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(messages));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { receiverId, text } = await req.json();

  if (!receiverId || !text) {
    return NextResponse.json({ error: "receiverId и text обязательны" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: session.user.id,
      receiverId,
      text,
    },
    include: {
      sender: { select: { id: true, fullName: true, username: true, photos: true } },
      receiver: { select: { id: true, fullName: true, username: true, photos: true } },
    },
  });

  await invalidateChatCache(session.user.id, receiverId);

  return NextResponse.json(message, { status: 201 });
}