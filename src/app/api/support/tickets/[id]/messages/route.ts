// src/app/api/support/tickets/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { text } = await req.json();
  if (!text || text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: "Сообщение от 1 до 2000 символов" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  
  // Проверка прав: юзер пишет только в свой тикет, админ в любой
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: params.id,
      senderId: session.user.id,
      text,
      isAdmin,
    },
    include: { sender: { select: { fullName: true, username: true } } }
  });

  // Обновляем статус тикета
  await prisma.supportTicket.update({
    where: { id: params.id },
    data: { 
      updatedAt: new Date(),
      status: isAdmin ? "IN_PROGRESS" : "OPEN" 
    }
  });

  return NextResponse.json(message);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const ticket = await prisma.supportTicket.findUnique({ 
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, fullName: true, username: true, role: true } } }
      }
    }
  });

  if (!ticket) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  
  // Проверка прав
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}