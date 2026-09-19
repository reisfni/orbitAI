import { NextResponse } from "next/server";
import { gitDiff, resolveProjectPath } from "@/server/files";

const ROOT = process.cwd();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedPath = searchParams.get("path") ?? undefined;

  let filePath: string | undefined;
  try {
    filePath = requestedPath ? resolveProjectPath(ROOT, requestedPath) : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const diff = await gitDiff(ROOT, filePath);
  return NextResponse.json({ diff });
}
