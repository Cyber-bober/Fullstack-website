import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file || !file.size) {
      return NextResponse.json({ error: "Файл не предоставлен" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `team-${params.id}-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));
    const fileUrl = `/uploads/${fileName}`;

    const type = formData.get("type") as string;
    if (type === "logo") {
      await prisma.team.update({ where: { id: params.id }, data: { logoUrl: fileUrl } });
    } else {
      const team = await prisma.team.findUnique({ where: { id: params.id }, select: { photos: true } });
      if (team && team.photos.length >= 3) {
        return NextResponse.json({ error: "Максимум 3 фото" }, { status: 400 });
      }
      await prisma.team.update({ where: { id: params.id }, data: { photos: { push: fileUrl } } });
    }

    return NextResponse.json({ url: fileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
