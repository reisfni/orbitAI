import { NextResponse } from "next/server";
import path from "path";
import { gitStatus, isDirectory, listDir, resolveProjectPath } from "@/server/files";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedRoot = searchParams.get("root") || undefined;
  const sub = searchParams.get("sub") ?? undefined;

  const root = path.resolve(process.cwd(), requestedRoot ?? ".");

  if (!isDirectory(root)) {
    return NextResponse.json({ error: "Workspace directory not found" }, { status: 400 });
  }

  let dir: string;
  try {
    dir = resolveProjectPath(root, sub);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!isDirectory(dir)) {
    return NextResponse.json({ error: "Not a directory" }, { status: 400 });
  }

  const [entries, changed] = await Promise.all([listDir(dir), gitStatus(root)]);

  return NextResponse.json({
    root,
    entries: entries.map((e) => ({ ...e, path: e.path.slice(root.length + 1), changed: changed.has(e.path) })),
  });
}
