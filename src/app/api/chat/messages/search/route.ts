import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);
  const messages = await prisma.chatMessage.findMany({
    where: { text: { contains: q, mode: "insensitive" }, OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    include: { sender: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return NextResponse.json(messages);
}