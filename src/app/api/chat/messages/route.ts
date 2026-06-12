//src/app/api/chat/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const otherUserId = searchParams.get("userId");

  if (!otherUserId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Получаем все сообщения между двумя пользователями
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiverId, text } = await req.json();

  if (!receiverId || !text) {
    return NextResponse.json({ error: "receiverId and text required" }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      senderId: session.user.id,
      receiverId,
      text,
    },
    include: {
      sender: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json(msg);
}