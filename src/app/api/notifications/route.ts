import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ chat: 0, support: 0 });
  const userId = session.user.id;
  const unreadChat = await prisma.chatMessage.count({ where: { receiverId: userId, isRead: false } });
  return NextResponse.json({ chat: unreadChat, support: 0 });
}
