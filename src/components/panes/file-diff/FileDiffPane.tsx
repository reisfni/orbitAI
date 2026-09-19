"use client";

import { useCallback, useEffect, useState } from "react";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  changed: boolean;
}

function DiffView({ diff }: { diff: string }) {
  if (!diff.trim()) {
    return <p className="p-3 text-xs text-[var(--oa-text-dim)]">No changes.</p>;
  }
  return (
    <pre className="overflow-auto p-3 font-mono text-[11px] leading-5 whitespace-pre text-[var(--oa-text-muted)]">
      {diff.split("\n").map((line, i) => {
        let color = "";
        if (line.startsWith("+") && !line.startsWith("+++")) color = "text-emerald-500";
        else if (line.startsWith("-") && !line.startsWith("---")) color = "text-red-500";
        else if (line.startsWith("@@")) color = "text-sky-500";
        else if (line.startsWith("diff --git") || line.startsWith("index ")) color = "text-[var(--oa-text-dim)]";
        return (
          <div key={i} className={color}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

function TreeNode({
  entry,
  depth,
  root,
  selectedPath,
  onSelectFile,
}: {
  entry: FileEntry;
  depth: number;
  root: string;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[] | null>(null);

  const toggle = useCallback(async () => {
    if (entry.type === "file") {
      onSelectFile(entry.path);
      return;
    }
    if (!expanded && children === null) {
      const res = await fetch(`/api/files/tree?root=${encodeURIComponent(root)}&sub=${encodeURIComponent(entry.path)}`);
      const data = await res.json();
      setChildren(data.entries ?? []);
    }
    setExpanded((e) => !e);
  }, [entry, expanded, children, onSelectFile, root]);

  return (
    <div>
      <button
        onClick={toggle}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`flex w-full items-center gap-1.5 py-0.5 pr-2 text-left text-xs hover:bg-[var(--oa-hover)] ${
          selectedPath === entry.path ? "bg-[var(--oa-selected)] text-[var(--oa-text)]" : "text-[var(--oa-text-muted)]"
        }`}
      >
        <span className="w-3 text-[var(--oa-text-dim)]">{entry.type === "dir" ? (expanded ? "▾" : "▸") : ""}</span>
        <span className="truncate">{entry.name}</span>
        {entry.changed && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
      </button>
      {entry.type === "dir" && expanded && children && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              root={root}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileDiffPane({ dir }: { dir?: string }) {
  const root = dir || ".";
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    const res = await fetch(`/api/files/tree?root=${encodeURIComponent(root)}`);
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setEntries([]);
      return;
    }
    setError(null);
    setEntries(data.entries ?? []);
  }, [root]);

  const loadDiff = useCallback(
    async (path?: string) => {
      const params = new URLSearchParams({ root });
      if (path) params.set("path", path);
      const res = await fetch(`/api/files/diff?${params}`);
      const data = await res.json();
      setDiff(data.diff ?? "");
    },
    [root]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTree(), loadDiff(selectedPath ?? undefined)]);
    setLoading(false);
  }, [loadTree, loadDiff, selectedPath]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPath(null);
    setLoading(true);
    Promise.all([loadTree(), loadDiff()]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  const selectFile = useCallback(
    (path: string) => {
      setSelectedPath(path);
      loadDiff(path);
    },
    [loadDiff]
  );

  return (
    <div className="flex h-full w-full text-[var(--oa-text-muted)]">
      <div className="flex w-48 shrink-0 flex-col border-r border-[var(--oa-border)]">
        <div className="flex items-center justify-between border-b border-[var(--oa-border)] px-2 py-1">
          <span className="text-[10px] uppercase tracking-wide text-[var(--oa-text-dim)]">Files</span>
          <button className="text-xs text-[var(--oa-text-dim)] hover:text-[var(--oa-text)]" onClick={refresh}>
            ⟳
          </button>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {error && <p className="p-2 text-xs text-red-400">{error}</p>}
          {entries.map((entry) => (
            <TreeNode key={entry.path} entry={entry} depth={0} root={root} selectedPath={selectedPath} onSelectFile={selectFile} />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--oa-border)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--oa-text-dim)]">
          {selectedPath ?? "Working tree diff"}
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? <p className="p-3 text-xs text-[var(--oa-text-dim)]">Loading…</p> : <DiffView diff={diff} />}
        </div>
      </div>
    </div>
  );
}
