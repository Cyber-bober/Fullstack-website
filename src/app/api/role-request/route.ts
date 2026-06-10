import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { requestedRole } = await req.json();
  const existing = await prisma.roleRequest.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Уже есть активный запрос" }, { status: 400 });
  await prisma.roleRequest.create({ data: { userId: session.user.id, requestedRole } });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }
  const requests = await prisma.roleRequest.findMany({
    include: { user: { select: { username: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const { status } = await req.json();
  const request = await prisma.roleRequest.update({ where: { id }, data: { status } });
  if (status === "APPROVED") {
    await prisma.user.update({ where: { id: request.userId }, data: { role: request.requestedRole } });
  }
  return NextResponse.json({ success: true });
}
