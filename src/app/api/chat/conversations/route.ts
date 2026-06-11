import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Получаем все сообщения где пользователь отправитель или получатель
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, fullName: true, username: true, photos: true } },
      receiver: { select: { id: true, fullName: true, username: true, photos: true } },
    },
  });

  // Группируем по собеседнику и берем последнее сообщение
  const conversationsMap = new Map();

  messages.forEach((msg) => {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    const otherUserId = otherUser.id;

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        user: otherUser,
        lastMessage: msg,
        unreadCount: 0,
      });
    }
  });

  const conversations = Array.from(conversationsMap.values());

  return NextResponse.json(conversations);
}