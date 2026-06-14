// src/app/api/news/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink, writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  const userRole = session?.user?.role;
  if (!session?.user || (userRole !== "ADMIN" && userRole !== "EDITOR")) {
    return NextResponse.json({ error: "Нет прав на редактирование" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;

    let imageUrl: string | undefined = undefined;

    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "news");
      await mkdir(uploadDir, { recursive: true });
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `news-${Date.now()}-${file.name.replace(/\s/g, "-")}`;
      await writeFile(path.join(uploadDir, fileName), buffer);
      imageUrl = `/uploads/news/${fileName}`;
    }

    const post = await prisma.newsPost.update({
      where: { id: params.id },
      data: {
        title,
        content,
        ...(imageUrl && { imageUrl }),
      },
      include: { 
        author: { select: { id: true, fullName: true, username: true } } 
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Ошибка обновления новости:", error);
    return NextResponse.json({ error: "Ошибка сервера при обновлении" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const post = await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;
  if (!isAdmin && !isAuthor) return NextResponse.json({ error: "Нет прав" }, { status: 403 });

  if (post.imageUrl) {
    try {
      const filePath = path.join(process.cwd(), "public", post.imageUrl);
      await unlink(filePath);
    } catch (err) {
      console.error("Ошибка удаления файла:", err);
    }
  }

  await prisma.newsPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}