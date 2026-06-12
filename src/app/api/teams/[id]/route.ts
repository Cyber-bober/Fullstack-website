//src/app/api/teams/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      players: {
        select: {
          id: true,
          username: true,
          fullName: true,
          position: true,
          photos: true,
        },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  }

  return NextResponse.json(team);
}