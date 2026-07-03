import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink, writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let title: string, content: string, imageUrl: string | undefined;

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

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const post = await prisma.newsPost.update({
      where: { id: params.id },
      data: updateData,
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("News update error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const post = await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  if (session.user.role !== "ADMIN" && post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 });
  }

  if (post.imageUrl) {
    try { await unlink(path.join(process.cwd(), "public", post.imageUrl)); } catch {}
  }

  await prisma.newsPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
