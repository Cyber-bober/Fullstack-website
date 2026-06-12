// src/app/api/teams/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const query = searchParams.get("q") || "";

  const skip = (page - 1) * limit;

  const where = query 
    ? { name: { contains: query, mode: Prisma.QueryMode.insensitive } } 
    : {};

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        captain: { select: { fullName: true } },
        _count: { select: { players: true } }
      }
    }),
    prisma.team.count({ where })
  ]);

  return NextResponse.json({
    data: teams,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
}