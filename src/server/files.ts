import { execFile } from "child_process";
import { readdirSync, statSync } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const IGNORED = new Set(["node_modules", ".git", ".next", ".orbitai"]);

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

/** Resolves a user-supplied relative dir against the project root, refusing to escape it. */
export function resolveProjectPath(root: string, requested?: string): string {
  const resolved = path.resolve(root, requested ?? ".");
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Path escapes project root");
  }
  return resolved;
}

export function listDir(dir: string): FileEntry[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !IGNORED.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => ({
      name: entry.name,
      path: path.join(dir, entry.name),
      type: entry.isDirectory() ? ("dir" as const) : ("file" as const),
    }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
}

export function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export async function gitDiff(cwd: string, filePath?: string): Promise<string> {
  const args = ["diff", "--no-color"];
  if (filePath) args.push("--", filePath);
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  } catch (err) {
    const e = err as { stdout?: string; message: string };
    return e.stdout ?? `git diff failed: ${e.message}`;
  }
}

export async function gitStatus(cwd: string): Promise<Set<string>> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain=v1"], { cwd });
    return new Set(
      stdout
        .split("\n")
        .filter(Boolean)
        .map((line) => path.resolve(cwd, line.slice(3).trim()))
    );
  } catch {
    return new Set();
  }
}
