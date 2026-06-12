// src/app/api/profile/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const data = await req.json();
  
  // Проверяем уникальность username, если он изменился
  if (data.username && data.username !== session.user.username) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Этот username уже занят" }, 
        { status: 400 }
      );
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: data.fullName,
        username: data.username,
        city: data.city || "",
        position: data.position || "",
        contacts: data.contacts || "",
        stats: data.stats || "",
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}