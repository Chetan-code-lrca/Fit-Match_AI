import { NextResponse } from "next/server";

import { checkSupabaseDatabaseHealth, getSupabaseConfig } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { status: "not_ready", service: "fitmatch-ai", checks: { configuration: false, database: false } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const database = await checkSupabaseDatabaseHealth();
  return NextResponse.json(
    { status: database ? "ok" : "not_ready", service: "fitmatch-ai", checks: { configuration: true, database } },
    { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
