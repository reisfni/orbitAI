import { NextResponse } from "next/server";
import path from "path";
import { gitDiff, isDirectory, resolveProjectPath } from "@/server/files";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedRoot = searchParams.get("root") || undefined;
  const requestedPath = searchParams.get("path") ?? undefined;

  const root = path.resolve(process.cwd(), requestedRoot ?? ".");
  if (!isDirectory(root)) {
    return NextResponse.json({ error: "Workspace directory not found" }, { status: 400 });
  }

  let filePath: string | undefined;
  try {
    filePath = requestedPath ? resolveProjectPath(root, requestedPath) : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const diff = await gitDiff(root, filePath);
  return NextResponse.json({ diff });
}
