import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { senderId } = await req.json();
  if (!senderId) return NextResponse.json({ error: "senderId required" }, { status: 400 });

  await prisma.chatMessage.updateMany({
    where: {
      senderId,
      receiverId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
