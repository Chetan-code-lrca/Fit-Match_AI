import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "fitmatch-ai",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
