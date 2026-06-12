//src/app/api/teams/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ может создавать команды" }, { status: 403 });
  }

  const { name, logoUrl } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Название команды обязательно" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name,
      logoUrl: logoUrl || null,
    },
  });

  return NextResponse.json(team, { status: 201 });
}