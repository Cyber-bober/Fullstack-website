// src/app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  if (!session?.user || (userRole !== "ADMIN" && userRole !== "EDITOR")) {
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
        const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
        await mkdir(uploadDir, { recursive: true });
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `news-${Date.now()}-${file.name.replace(/\s/g, "-")}`;
        await writeFile(path.join(uploadDir, fileName), buffer);
        imageUrl = `/uploads/news/${fileName}`;
      }
    } else {
      const body = await req.json();
      title = body.title;
      content = body.content;
    }

    if (!title || !content) return NextResponse.json({ error: "Заголовок и контент обязательны" }, { status: 400 });

    if (!session.user.id) return NextResponse.json({ error: "Ошибка сессии" }, { status: 500 });

    const post = await prisma.newsPost.create({
      data: { title, content, imageUrl, authorId: session.user.id, isPublished: true },
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });

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
    const skip = (page - 1) * limit;
    const where = query
      ? { OR: [{ title: { contains: query, mode: Prisma.QueryMode.insensitive } }, { content: { contains: query, mode: Prisma.QueryMode.insensitive } }], isPublished: true }
      : { isPublished: true };

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, fullName: true, username: true } } } }),
      prisma.newsPost.count({ where }),
    ]);

    return NextResponse.json({ data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("News load error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
