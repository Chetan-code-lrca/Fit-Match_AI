import { NextResponse } from "next/server";

import { buildChatReply } from "@/lib/style-engine";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json(
      { message: "Prompt is required.", recommendations: [] },
      { status: 400 },
    );
  }

  return NextResponse.json(buildChatReply(prompt));
}
