// src/app/api/support/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { subject, text } = await req.json();

  // ВАЛИДАЦИЯ АНТИ-СПАМ
  if (!subject || subject.length < 5 || subject.length > 100) {
    return NextResponse.json({ error: "Тема должна быть от 5 до 100 символов" }, { status: 400 });
  }
  if (!text || text.length < 50 || text.length > 2000) {
    return NextResponse.json({ error: "Сообщение должно быть от 50 до 2000 символов" }, { status: 400 });
  }

  // RATE LIMITING: Проверка последнего тикета (не чаще 1 раза в 5 мин)
  const lastTicket = await prisma.supportTicket.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true }
  });

  if (lastTicket) {
    const minutesSinceLast = (Date.now() - new Date(lastTicket.createdAt).getTime()) / 60000;
    if (minutesSinceLast < 5) {
      const waitTime = Math.ceil(5 - minutesSinceLast);
      return NextResponse.json(
        { error: `Подождите ${waitTime} мин. перед новым обращением` }, 
        { status: 429 }
      );
    }
  }

  // Создаем тикет и первое сообщение транзакцией
  try {
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          userId: session.user.id,
          subject,
          status: "OPEN",
        }
      });

      await tx.supportMessage.create({
        data: {
          ticketId: newTicket.id,
          senderId: session.user.id,
          text,
          isAdmin: false,
        }
      });

      return newTicket;
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания тикета:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  try {
    if (isAdmin) {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          user: { select: { username: true, fullName: true } },
          messages: { 
            orderBy: { createdAt: "asc" },
            take: 1,
            include: { sender: { select: { fullName: true } } }
          },
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json(tickets);
    } else {
      const tickets = await prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        include: {
          messages: { 
            orderBy: { createdAt: "asc" },
            take: 1,
            include: { sender: { select: { fullName: true } } }
          },
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json(tickets);
    }
  } catch (error) {
    console.error("Ошибка загрузки тикетов:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}