import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  
  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCaptain && !isAdmin) return NextResponse.json({ error: "Только админ или капитан" }, { status: 403 });

  const { userId } = await req.json();
  await prisma.user.update({ where: { id: userId }, data: { teamId: params.id } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
  
  const isCaptain = team.captainId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCaptain && !isAdmin) return NextResponse.json({ error: "Только админ или капитан" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  
  await prisma.user.update({ where: { id: userId }, data: { teamId: null } });
  return NextResponse.json({ success: true });
}
