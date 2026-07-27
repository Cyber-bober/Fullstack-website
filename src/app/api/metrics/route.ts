import { NextResponse } from "next/server";
import client from "prom-client";

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: "nextjs_" });

export async function GET() {
  const metrics = await client.register.metrics();
  return new NextResponse(metrics, {
    headers: { "Content-Type": client.register.contentType },
  });
}