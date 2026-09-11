import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Только изображения" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл слишком большой (макс 10MB)" }, { status: 400 });
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

    const uploadDir = path.join(process.cwd(), "public", "uploads", "teams");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);

    const jpegBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    const webpBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 75 })
      .toBuffer();

    const jpegFileName = `team-${params.id}-${timestamp}-${randomStr}.jpg`;
    const webpFileName = `team-${params.id}-${timestamp}-${randomStr}.webp`;

    await writeFile(path.join(uploadDir, jpegFileName), jpegBuffer);
    await writeFile(path.join(uploadDir, webpFileName), webpBuffer);

    const fileUrl = `/api/uploads/teams/${jpegFileName}`;

    const type = formData.get("type") as string;
    if (type === "logo") {
      const team = await prisma.team.findUnique({ 
        where: { id: params.id }, 
        select: { logoUrl: true } 
      });
      
      if (team?.logoUrl) {
        try {
          const oldPath = path.join(process.cwd(), "public", team.logoUrl);
          await unlink(oldPath).catch(() => {});
          await unlink(oldPath.replace('.jpg', '.webp')).catch(() => {});
        } catch (err) {
          console.error("Error deleting old logo:", err);
        }
      }

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { url, type } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL не предоставлен" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: params.id } });
    if (!team) {
      return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
    }

    if (type === "logo") {
      if (team.logoUrl) {
        try {
          const oldPath = path.join(process.cwd(), "public", team.logoUrl);
          await unlink(oldPath).catch(() => {});
          await unlink(oldPath.replace('.jpg', '.webp')).catch(() => {});
        } catch (err) {
          console.error("Error deleting logo:", err);
        }
      }
      
      await prisma.team.update({ where: { id: params.id }, data: { logoUrl: null } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}