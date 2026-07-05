import OpenAI from "openai";
import { NextResponse } from "next/server";

const MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function requireAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI not configured. Set OPENAI_API_KEY in .env");
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

type CallOpts = { system: string; user: string; json?: boolean };

export async function callModel(opts: CallOpts): Promise<string | Record<string, unknown>> {
  const ai = requireAI();
  const res = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
  });
  const text = res.choices[0]?.message?.content ?? "";
  if (opts.json) {
    try { return JSON.parse(text); } catch { return {}; }
  }
  return text;
}

export function handleAIError(err: unknown): NextResponse {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("AI not configured")) {
    return NextResponse.json({ error: "AI features are coming soon", code: "ai_coming_soon" }, { status: 503 });
  }
  return NextResponse.json({ error: "AI request failed", code: "ai_coming_soon" }, { status: 503 });
}
