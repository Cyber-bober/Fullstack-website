import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = session.user.role === "ADMIN"
    ? await prisma.supportTicket.findMany({
        include: { messages: { orderBy: { createdAt: "asc" } }, user: { select: { fullName: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : await prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
      });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, text } = await req.json();
  if (!subject || !text) return NextResponse.json({ error: "Тема и текст обязательны" }, { status: 400 });

  const ticket = await prisma.$transaction(async (tx) => {
    const t = await tx.supportTicket.create({
      data: { userId: session.user.id, subject },
    });
    await tx.supportMessage.create({
      data: { ticketId: t.id, senderId: session.user.id, text },
    });
    return t;
  });

  return NextResponse.json(ticket, { status: 201 });
}
