// src/app/api/support/tickets/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Отправка сообщения в тикет
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { text } = await req.json();

  // Валидация текста сообщения
  if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > 2000) {
    return NextResponse.json({ error: "Сообщение должно быть от 1 до 2000 символов" }, { status: 400 });
  }

  try {
    // Находим тикет
    const ticket = await prisma.supportTicket.findUnique({ 
      where: { id: params.id } 
    });

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";

    // Проверка прав доступа:
    // Админ может писать в любой тикет
    // Пользователь может писать только в свой тикет
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа к этому обращению" }, { status: 403 });
    }

    // Создаем сообщение и обновляем статус тикета транзакцией
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.supportMessage.create({
        data: {
          ticketId: params.id,
          senderId: session.user.id,
          text: text.trim(),
          isAdmin,
        },
        include: {
          sender: { select: { id: true, fullName: true, username: true, role: true } }
        }
      });

      // Если отвечает админ, меняем статус на "В работе"
      // Если отвечает пользователь, оставляем "Открыт" или меняем на "Ожидает ответа"
      await tx.supportTicket.update({
        where: { id: params.id },
        data: { 
          updatedAt: new Date(),
          status: isAdmin ? "IN_PROGRESS" : "OPEN" 
        }
      });

      return newMessage;
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
    return NextResponse.json({ error: "Ошибка сервера при отправке сообщения" }, { status: 500 });
  }
}

// GET: Получение всех сообщений конкретного тикета
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, fullName: true, username: true, role: true } }
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    }

    // Проверка прав доступа
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа к этому обращению" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ошибка загрузки сообщений:", error);
    return NextResponse.json({ error: "Ошибка сервера при загрузке сообщений" }, { status: 500 });
  }
}