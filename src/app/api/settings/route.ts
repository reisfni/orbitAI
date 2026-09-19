import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/server/settings";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ hasAnthropicApiKey: Boolean(settings.anthropicApiKey) });
}

export async function POST(req: Request) {
  const body = await req.json();
  const anthropicApiKey = typeof body.anthropicApiKey === "string" ? body.anthropicApiKey.trim() : undefined;

  if (anthropicApiKey !== undefined) {
    saveSettings({ anthropicApiKey: anthropicApiKey || undefined });
  }

  const settings = getSettings();
  return NextResponse.json({ hasAnthropicApiKey: Boolean(settings.anthropicApiKey) });
}
