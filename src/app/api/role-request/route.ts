import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["EDITOR", "CAPTAIN"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { requestedRole } = await req.json();
  
  if (!requestedRole || !VALID_ROLES.includes(requestedRole)) {
    return NextResponse.json({ error: "Invalid role. Must be EDITOR or CAPTAIN" }, { status: 400 });
  }

  const existing = await prisma.roleRequest.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Already have pending request" }, { status: 400 });

  await prisma.roleRequest.create({
    data: { userId: session.user.id, requestedRole },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  
  const requests = await prisma.roleRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, fullName: true, username: true } } },
  });
  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
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