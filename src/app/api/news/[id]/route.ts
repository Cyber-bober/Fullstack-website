import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink, writeFile, mkdir } from "fs/promises";
import path from "path";
import { redis } from "@/lib/redis";
import sharp from "sharp";
import { hasSqlInjection, hasXSS, validateLength } from "@/lib/validate";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.newsPost.findUnique({
      where: { id: params.id },
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("News get error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Сначала проверка авторизации (401)
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  try {
    const existingPost = await prisma.newsPost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let title: string | undefined;
    let content: string | undefined;
    let imageUrl: string | null | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = formData.get("title") as string | undefined;
      content = formData.get("content") as string | undefined;
      const image = formData.get("image") as File | null;
      const removeImage = formData.get("removeImage") === "true";

      if (removeImage) {
        imageUrl = null;
        console.log(`Removing image from news ${params.id}`);
        
        // Удаляем старый файл
        if (existingPost.imageUrl) {
          try {
            const oldFilePath = path.join(process.cwd(), "public", existingPost.imageUrl);
            await unlink(oldFilePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
      else if (image && image.size > 0) {
        if (!image.type.startsWith("image/")) {
          return NextResponse.json({ error: "Только изображения" }, { status: 400 });
        }

        if (image.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "Фото слишком большое (макс 10MB)" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const fileName = `news-${timestamp}-${randomStr}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const optimizedImage = await sharp(buffer)
          .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
          .jpeg({ quality: 80, progressive: true, mozjpeg: true })
          .toBuffer();

        await writeFile(filePath, optimizedImage);
        imageUrl = `/uploads/news/${fileName}`;

        console.log(`Image updated: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(optimizedImage.length / 1024 / 1024).toFixed(2)}MB`);

        // Удаляем старое фото
        if (existingPost.imageUrl) {
          try {
            const oldFilePath = path.join(process.cwd(), "public", existingPost.imageUrl);
            await unlink(oldFilePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
    } else {
      const body = await req.json();
      title = body.title;
      content = body.content;
    }

    if (title !== undefined) {
      if (title.length < 10 || title.length > 200) {
        return NextResponse.json({ error: "Заголовок должен быть от 10 до 200 символов" }, { status: 400 });
      }
      if (hasSqlInjection(title) || hasXSS(title)) {
        return NextResponse.json({ error: "Обнаружены недопустимые символы" }, { status: 400 });
      }
    }

    if (content !== undefined) {
      if (content.length < 10 || content.length > 5000) {
        return NextResponse.json({ error: "Контент должен быть от 10 до 5000 символов" }, { status: 400 });
      }
      if (hasSqlInjection(content) || hasXSS(content)) {
        return NextResponse.json({ error: "Обнаружены недопустимые символы" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const post = await prisma.newsPost.update({
      where: { id: params.id },
      data: updateData,
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });

    await invalidateNewsCache();

    return NextResponse.json(post);
  } catch (error) {
    console.error("News update error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Сначала проверка авторизации (401)
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const post = await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  try {
    // Удаляем файл изображения
    if (post.imageUrl) {
      try {
        const filePath = path.join(process.cwd(), "public", post.imageUrl);
        await unlink(filePath);
      } catch (err) {
        console.error("Error deleting image file:", err);
      }
    }

    await prisma.newsPost.delete({ where: { id: params.id } });
    await invalidateNewsCache();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News delete error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}