import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasXSS, hasSqlInjection } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ может создавать команды" }, { status: 403 });
  }

  const { name, logoUrl } = await req.json();

  if (!name || name.length < 2 || name.length > 35) {
    return NextResponse.json({ error: "Название: от 2 до 35 символов" }, { status: 400 });
  }

  if (hasXSS(name) || hasSqlInjection(name)) {
    return NextResponse.json({ error: "Название содержит недопустимые символы" }, { status: 400 });
  }

  const team = await prisma.team.create({ data: { name, logoUrl: logoUrl || null } });
  return NextResponse.json(team, { status: 201 });
}