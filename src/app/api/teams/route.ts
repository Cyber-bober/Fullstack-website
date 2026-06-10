import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { players: true } },
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
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }
  const { name, logoUrl } = await req.json();
  const team = await prisma.team.create({ data: { name, logoUrl } });
  return NextResponse.json(team, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}