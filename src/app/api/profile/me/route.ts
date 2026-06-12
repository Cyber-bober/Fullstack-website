// src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      fullName: true,
      city: true,
      position: true,
      contacts: true,
      stats: true,
      birthDate: true,
      photos: true,
      teamId: true,
      team: {
        select: { name: true }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json(user);
}