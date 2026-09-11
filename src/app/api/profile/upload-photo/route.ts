import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не предоставлен" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    await mkdir(uploadDir, { recursive: true });
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profile-${session.user.id}-${Date.now()}.jpg`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    
    const photoUrl = `/api/uploads/profiles/${fileName}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        photos: {
          set: [photoUrl],
        },
      },
    });

    return NextResponse.json({ url: photoUrl }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}