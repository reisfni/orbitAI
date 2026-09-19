import { NextResponse } from "next/server";
import { gitStatus, isDirectory, listDir, resolveProjectPath } from "@/server/files";

const ROOT = process.cwd();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("dir") ?? undefined;

  let dir: string;
  try {
    dir = resolveProjectPath(ROOT, requested);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!isDirectory(dir)) {
    return NextResponse.json({ error: "Not a directory" }, { status: 400 });
  }

  const [entries, changed] = await Promise.all([listDir(dir), gitStatus(ROOT)]);

  return NextResponse.json({
    dir: dir === ROOT ? "." : dir.slice(ROOT.length + 1),
    entries: entries.map((e) => ({ ...e, path: e.path.slice(ROOT.length + 1), changed: changed.has(e.path) })),
  });
}
