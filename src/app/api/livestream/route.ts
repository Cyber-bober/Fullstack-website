import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_TTL = 30;
const CACHE_KEY = "livestream:current";

function cleanVideoUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  let url = String(raw).trim();
  if (!url) return "";

  const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  url = url.replace(/<[^>]+>/g, "").trim();

  return url;
}

async function invalidateLivestreamCache() {
  try {
    await redis.del(CACHE_KEY);

    try {
      const keys = await redis.keys("livestream:*");
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Invalidated ${keys.length} livestream cache keys`);
      }
    } catch (err) {
      console.warn("Wildcard keys invalidation skipped:", err);
    }
  } catch (err) {
    console.error("Livestream cache invalidation error:", err);
  }
}

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      console.log(`Cache hit: ${CACHE_KEY}`);
      return NextResponse.json(JSON.parse(cached));
    }
    console.log(`Cache miss: ${CACHE_KEY}`);
  } catch (err) {
    console.error("Redis cache error:", err);
  }

  try {
    const stream = await prisma.liveStream.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("GET /api/livestream - найдена трансляция:", stream ? stream.id : "нет");

    let result;
    if (!stream) {
      result = {
        isActive: false,
        title: "Прямая трансляция",
        vkVideoUrl: process.env.VK_STREAM_URL || "",
        vkGroupUrl: process.env.VK_GROUP_URL || "",
        tgGroupUrl: process.env.TG_GROUP_URL || "",
      };
    } else {
      result = stream;
    }

    try {
      await redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.error("Redis cache set error:", err);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/livestream error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const body = await req.json();
    console.log("PATCH /api/livestream - данные:", body);

    const { title, vkVideoUrl, vkGroupUrl, tgGroupUrl, isActive } = body;

    const cleanVkVideoUrl = cleanVideoUrl(vkVideoUrl);
    const cleanVkGroupUrl = (vkGroupUrl || process.env.VK_GROUP_URL || "").trim();
    const cleanTgGroupUrl = (tgGroupUrl || process.env.TG_GROUP_URL || "").trim();

    console.log("Очищенный URL видео:", cleanVkVideoUrl);

    // Отключаем все старые активные трансляции
    await prisma.liveStream.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const stream = await prisma.liveStream.create({
      data: {
        title: (title || "Прямая трансляция").trim(),
        vkVideoUrl: cleanVkVideoUrl,
        vkGroupUrl: cleanVkGroupUrl,
        tgGroupUrl: cleanTgGroupUrl,
        isActive: isActive !== false,
      },
    });

    console.log("Создана трансляция:", stream.id, "| URL:", cleanVkVideoUrl);

    await invalidateLivestreamCache();

    return NextResponse.json(stream);
  } catch (error) {
    console.error("PATCH /api/livestream error:", error);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}
