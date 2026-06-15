// src/app/api/teams/logo/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id }, 
      select: { teamId: true } 
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "Вы не состоите в команде" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({ 
      where: { id: user.teamId }, 
      select: { logoUrl: true } 
    });

    if (team?.logoUrl) {
      try {
        const fullPath = path.join(process.cwd(), "public", team.logoUrl);
        await unlink(fullPath);
        console.log(`Лого команды удален: ${team.logoUrl}`);
      } catch (err) { console.error("Ошибка удаления файла лого:", err); }
    }

    await prisma.team.update({
      where: { id: user.teamId },
      data: { logoUrl: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления лого команды:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}