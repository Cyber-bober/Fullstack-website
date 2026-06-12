//src/app/api/teams/[id]/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string;

  if (!file) {
    return NextResponse.json({ error: "Файл не предоставлен" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `team-${params.id}-${Date.now()}.${file.name.split(".").pop()}`;
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);

  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/${fileName}`;

  if (type === "logo") {
    await prisma.team.update({
      where: { id: params.id },
      data: { logoUrl: fileUrl },
    });
  } else if (type === "photo") {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      select: { photos: true },
    });

    if (team && team.photos.length >= 3) {
      return NextResponse.json(
        { error: "Максимум 3 фото команды" },
        { status: 400 }
      );
    }

    await prisma.team.update({
      where: { id: params.id },
      data: {
        photos: {
          push: fileUrl,
        },
      },
    });
  }

  return NextResponse.json({ url: fileUrl });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { url, type } = await req.json();

  if (type === "logo") {
    await prisma.team.update({
      where: { id: params.id },
      data: { logoUrl: null },
    });
  } else if (type === "photo") {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      select: { photos: true },
    });

    if (team) {
      await prisma.team.update({
        where: { id: params.id },
        data: {
          photos: {
            set: team.photos.filter((p) => p !== url),
          },
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}