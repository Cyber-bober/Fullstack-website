import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 30; // 30 секунд

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const cacheKey = `conversations:${userId}`;

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

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, fullName: true, username: true, photos: true } },
      receiver: { select: { id: true, fullName: true, username: true, photos: true } },
    },
  });

  const conversationsMap = new Map();

  messages.forEach((msg) => {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!otherUser) return;
    const otherUserId = otherUser.id;
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        user: otherUser,
        lastMessage: msg,
        unreadCount: 0,
      });
    }
  });

  const result = Array.from(conversationsMap.values());

  // Сохраняем в кэш
  try {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    console.error("Redis cache set error:", err);
  }

  return NextResponse.json(result);
}