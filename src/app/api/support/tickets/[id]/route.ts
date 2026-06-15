// src/app/api/support/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
            sender: { select: { id: true, username: true, fullName: true, role: true } }
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа к этому обращению" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ошибка загрузки тикета:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор может менять статус" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["OPEN", "IN_PROGRESS", "CLOSED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Ошибка обновления статуса:", error);
    return NextResponse.json({ error: "Ошибка сервера при обновлении" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только администратор может удалять тикеты" }, { status: 403 });
  }

  try {
    await prisma.supportTicket.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления тикета:", error);
    return NextResponse.json({ error: "Ошибка сервера при удалении" }, { status: 500 });
  }
}