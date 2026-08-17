import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id };

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { subject, text } = await req.json();

  if (!subject || !text) {
    return NextResponse.json({ error: "Тема и текст обязательны" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
    },
  });

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: session.user.id,
      text,
      isAdmin: false,
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}