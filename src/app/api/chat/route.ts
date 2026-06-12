//src/app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Получаем последние 50 сообщений текущего пользователя
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, fullName: true, username: true } },
      receiver: { select: { id: true, fullName: true, username: true } },
    },
  });

  return NextResponse.json(messages);
}