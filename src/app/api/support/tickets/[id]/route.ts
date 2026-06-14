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

    // Проверка прав: юзер видит только свои тикеты, админ — любые
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ошибка загрузки тикета:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}