import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const messages = await prisma.chatMessage.findMany({ take: 50, orderBy: { createdAt: "desc" } });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text } = await req.json();
  const msg = await prisma.chatMessage.create({
    data: { senderId: session.user.id, receiverId: "admin", text },
  });
  return NextResponse.json(msg);
}
