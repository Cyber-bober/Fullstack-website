import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redis } from "@/lib/redis";
import { hasSqlInjection, hasXSS, validateLength, validatePayloadSize } from "@/lib/validate";

const CACHE_TTL = 300;

async function invalidateNewsCache() {
  try {
    const keys = await redis.keys("news:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} news cache keys`);
    }
  } catch (err) {
    console.error("News cache invalidation error:", err);
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
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let title: string, content: string, imageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = formData.get("title") as string;
      content = formData.get("content") as string;
      const file = formData.get("image") as File | null;

      if (file && file.size > 0) {
        if (!file.type.startsWith("image/")) {
          return NextResponse.json({ error: "Только изображения" }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "Фото слишком большое (макс 10MB)" }, { status: 400 });
        }

        let sharp: any;
        try {
          sharp = (await import("sharp")).default;
        } catch (err) {
          console.error("Sharp import error:", err);
          return NextResponse.json(
            { error: "Обработка изображений недоступна на сервере" },
            { status: 503 }
          );
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const fileName = `news-${timestamp}-${randomStr}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const optimizedImage = await sharp(buffer)
          .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
          .jpeg({ quality: 80, progressive: true, mozjpeg: true })
          .toBuffer();

        await writeFile(filePath, optimizedImage);
        imageUrl = `/uploads/news/${fileName}`;

        console.log(`Image optimized: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(optimizedImage.length / 1024 / 1024).toFixed(2)}MB`);
      }
    } else {
      const body = await req.json();
      title = body.title;
      content = body.content;
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Заголовок и контент обязательны" }, { status: 400 });
    }

    if (hasSqlInjection(title) || hasSqlInjection(content)) {
      return NextResponse.json({ error: "Обнаружены недопустимые символы" }, { status: 400 });
    }

    if (hasXSS(title) || hasXSS(content)) {
      return NextResponse.json({ error: "Обнаружены недопустимые символы" }, { status: 400 });
    }

    const titleError = validateLength(title, 10, 35, "Заголовок");
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const contentError = validateLength(content, 10, 5000, "Контент");
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Ошибка сессии" }, { status: 500 });
    }

    const post = await prisma.newsPost.create({
      data: { title, content, imageUrl, authorId: session.user.id, isPublished: true },
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });

    await invalidateNewsCache();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("News create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("q") || "";

    const cacheKey = `news:list:page:${page}:limit:${limit}:q:${query}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Redis cache error:", err);
    }

    const skip = (page - 1) * limit;

    const where: any = query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } }
          ],
          isPublished: true
        }
      : { isPublished: true };

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, fullName: true, username: true } } }
      }),
      prisma.newsPost.count({ where }),
    ]);

    const result = { 
      data: posts, 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    };

    try {
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.error("Redis cache set error:", err);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("News load error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 });

  try {
    await prisma.newsPost.delete({ where: { id } });
    await invalidateNewsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News delete error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}