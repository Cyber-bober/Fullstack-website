import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teams = await prisma.team.findMany();
  return NextResponse.json(teams);
}
