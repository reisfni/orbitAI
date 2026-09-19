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
    return <p className="p-3 text-xs text-zinc-500">No changes.</p>;
  }
  return (
    <pre className="overflow-auto p-3 font-mono text-[11px] leading-5 whitespace-pre">
      {diff.split("\n").map((line, i) => {
        let color = "text-zinc-400";
        if (line.startsWith("+") && !line.startsWith("+++")) color = "text-emerald-400";
        else if (line.startsWith("-") && !line.startsWith("---")) color = "text-red-400";
        else if (line.startsWith("@@")) color = "text-sky-400";
        else if (line.startsWith("diff --git") || line.startsWith("index ")) color = "text-zinc-500";
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
  selectedPath,
  onSelectFile,
}: {
  entry: FileEntry;
  depth: number;
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
      const res = await fetch(`/api/files/tree?dir=${encodeURIComponent(entry.path)}`);
      const data = await res.json();
      setChildren(data.entries ?? []);
    }
    setExpanded((e) => !e);
  }, [entry, expanded, children, onSelectFile]);

  return (
    <div>
      <button
        onClick={toggle}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`flex w-full items-center gap-1.5 py-0.5 pr-2 text-left text-xs hover:bg-white/5 ${
          selectedPath === entry.path ? "bg-white/10 text-zinc-100" : "text-zinc-300"
        }`}
      >
        <span className="w-3 text-zinc-500">{entry.type === "dir" ? (expanded ? "▾" : "▸") : ""}</span>
        <span className="truncate">{entry.name}</span>
        {entry.changed && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
      </button>
      {entry.type === "dir" && expanded && children && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} selectedPath={selectedPath} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileDiffPane() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTree = useCallback(async () => {
    const res = await fetch("/api/files/tree");
    const data = await res.json();
    setEntries(data.entries ?? []);
  }, []);

  const loadDiff = useCallback(async (path?: string) => {
    const res = await fetch(`/api/files/diff${path ? `?path=${encodeURIComponent(path)}` : ""}`);
    const data = await res.json();
    setDiff(data.diff ?? "");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTree(), loadDiff(selectedPath ?? undefined)]);
    setLoading(false);
  }, [loadTree, loadDiff, selectedPath]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectFile = useCallback(
    (path: string) => {
      setSelectedPath(path);
      loadDiff(path);
    },
    [loadDiff]
  );

  return (
    <div className="flex h-full w-full text-zinc-200">
      <div className="flex w-48 shrink-0 flex-col border-r border-zinc-700/60">
        <div className="flex items-center justify-between border-b border-zinc-700/60 px-2 py-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Files</span>
          <button className="text-xs text-zinc-400 hover:text-zinc-100" onClick={refresh}>
            ⟳
          </button>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {entries.map((entry) => (
            <TreeNode key={entry.path} entry={entry} depth={0} selectedPath={selectedPath} onSelectFile={selectFile} />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-700/60 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500">
          {selectedPath ?? "Working tree diff"}
        </div>
        <div className="flex-1 overflow-auto">{loading ? <p className="p-3 text-xs text-zinc-500">Loading…</p> : <DiffView diff={diff} />}</div>
      </div>
    </div>
  );
}
