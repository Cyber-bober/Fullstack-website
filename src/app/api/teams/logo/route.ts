// src/app/api/teams/logo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    // Находим команду пользователя
    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { teamId: true } 
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "Вы не состоите в команде" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File;
    
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    // Удаляем старый логотип
    const currentTeam = await prisma.team.findUnique({ 
      where: { id: user.teamId }, 
      select: { logoUrl: true } 
    });
    
    if (currentTeam?.logoUrl) {
      try {
        const oldPath = path.join(process.cwd(), "public", currentTeam.logoUrl);
        await unlink(oldPath);
      } catch (err) { console.warn("Не удалось удалить старый лого:", err); }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "teams");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `team-${user.teamId}-${Date.now()}.png`;
    await writeFile(path.join(uploadDir, fileName), buffer);

    const logoUrl = `/uploads/teams/${fileName}`;

    await prisma.team.update({
      where: { id: user.teamId },
      data: { logoUrl }
    });

    return NextResponse.json({ url: logoUrl });
  } catch (error) {
    console.error("Ошибка загрузки лого команды:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}