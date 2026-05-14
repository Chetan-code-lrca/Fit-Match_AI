import { NextResponse } from "next/server";

import { buildOutfitOfTheDay } from "@/lib/style-engine";

export async function GET() {
  return NextResponse.json({ outfit: buildOutfitOfTheDay() });
}
