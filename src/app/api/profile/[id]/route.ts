import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
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
      team: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json(user);
}
