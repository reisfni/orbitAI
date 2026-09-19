"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { PaneState, PaneType } from "@/lib/types";
import PaneNode, { type PaneNodeData } from "./PaneNode";
import SettingsModal from "./SettingsModal";
import { ThemeContext, type Theme } from "./ThemeContext";

const STORAGE_KEY = "orbitai:canvas-layout";
const THEME_KEY = "orbitai:theme";
const WORKDIR_KEY = "orbitai:working-dir";

const nodeTypes: NodeTypes = { paneNode: PaneNode };

interface PanePreset {
  label: string;
  title: string;
  type: PaneType;
  command?: string;
  shortcut: string;
}

const PANE_PRESETS: PanePreset[] = [
  { label: "+ Terminal", title: "Terminal", type: "terminal", shortcut: "t" },
  { label: "+ Claude Code", title: "Claude Code", type: "terminal", command: "claude", shortcut: "c" },
  { label: "+ OpenCode", title: "OpenCode", type: "terminal", command: "opencode", shortcut: "o" },
  { label: "+ Files", title: "Files", type: "file-diff", shortcut: "f" },
];

const SHORTCUTS_HELP = [
  ...PANE_PRESETS.map((p) => `${p.shortcut} → ${p.label}`),
  "⌘, → Settings",
  "Esc → close dialog",
].join("  ·  ");

function defaultPanes(): PaneState[] {
  return [
    { id: crypto.randomUUID(), type: "terminal", title: "Terminal", x: 120, y: 120, width: 640, height: 400 },
  ];
}

function loadLayout(): PaneState[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPanes();
    const parsed = JSON.parse(raw) as PaneState[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultPanes();
  } catch {
    return defaultPanes();
  }
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable || Boolean(target.closest(".xterm"));
}

export default function Canvas() {
  const [panes, setPanes] = useState<PaneState[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [workingDir, setWorkingDir] = useState("");

  useEffect(() => {
    // One-time sync from localStorage on mount; SSR has no access to it, so
    // this can't be a lazy useState initializer without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPanes(loadLayout());
    setTheme(loadTheme());
    setWorkingDir(window.localStorage.getItem(WORKDIR_KEY) ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(panes));
  }, [panes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(WORKDIR_KEY, workingDir);
  }, [workingDir, hydrated]);

  const closePane = useCallback((id: string) => {
    setPanes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resizePane = useCallback((id: string, width: number, height: number) => {
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, width, height } : p)));
  }, []);

  const addPane = useCallback(
    (preset: PanePreset) => {
      setPanes((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: preset.type,
          title: preset.title,
          command: preset.command,
          dir: workingDir.trim() || undefined,
          x: 120 + prev.length * 24,
          y: 120 + prev.length * 24,
          width: 640,
          height: 400,
        },
      ]);
    },
    [workingDir]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Escape and the Settings shortcut work regardless of focus (e.g. to
      // close the settings modal while its input is focused); everything
      // else is suppressed while typing in an input, textarea, or terminal.
      if (e.key === "Escape") {
        setSettingsOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const preset = PANE_PRESETS.find((p) => p.shortcut === e.key.toLowerCase());
      if (preset) {
        e.preventDefault();
        addPane(preset);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addPane]);

  const nodes: Node<PaneNodeData>[] = useMemo(
    () =>
      panes.map((pane) => ({
        id: pane.id,
        type: "paneNode",
        position: { x: pane.x, y: pane.y },
        width: pane.width,
        height: pane.height,
        style: { width: pane.width, height: pane.height },
        dragHandle: ".pane-drag-handle",
        data: { pane, onClose: closePane, onResize: resizePane },
      })),
    [panes, closePane, resizePane]
  );

  const onNodesChange = useCallback((changes: NodeChange<Node<PaneNodeData>>[]) => {
    setPanes((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          const pane = byId.get(change.id);
          if (pane) byId.set(change.id, { ...pane, x: change.position.x, y: change.position.y });
        }
      }
      return prev.map((p) => byId.get(p.id) ?? p);
    });
  }, []);

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={theme}>
      <div data-oa-theme={theme} className="relative h-screen w-screen bg-[var(--oa-bg)]">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          elevateNodesOnSelect
          minZoom={0.2}
          maxZoom={2}
          colorMode={theme}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--oa-dot)" />
        </ReactFlow>

        <div className="pointer-events-none absolute left-4 top-4 z-50 flex flex-wrap items-center gap-2">
          {PANE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="pointer-events-auto rounded-md bg-[var(--oa-surface-2)] px-3 py-1.5 text-sm text-[var(--oa-text)] shadow hover:bg-[var(--oa-surface-2-hover)]"
              onClick={() => addPane(preset)}
              title={`Shortcut: ${preset.shortcut}`}
            >
              {preset.label}
            </button>
          ))}
          <input
            value={workingDir}
            onChange={(e) => setWorkingDir(e.target.value)}
            placeholder="Working directory (optional)"
            title="Project directory used by new panes (terminal cwd / file tree root). Leave blank for orbitAI's own directory."
            className="pointer-events-auto w-56 rounded-md border border-[var(--oa-border)] bg-[var(--oa-surface)] px-2 py-1.5 text-xs text-[var(--oa-text)] outline-none placeholder:text-[var(--oa-text-dim)] focus:border-[var(--oa-text-dim)]"
          />
          <button
            className="pointer-events-auto rounded-md bg-[var(--oa-surface-2)] px-3 py-1.5 text-sm text-[var(--oa-text)] shadow hover:bg-[var(--oa-surface-2-hover)]"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title="Toggle light/dark theme"
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
          <button
            className="pointer-events-auto rounded-md bg-[var(--oa-surface-2)] px-3 py-1.5 text-sm text-[var(--oa-text)] shadow hover:bg-[var(--oa-surface-2-hover)]"
            onClick={() => setSettingsOpen(true)}
            title={`Shortcut: ⌘,`}
          >
            ⚙ Settings
          </button>
          <span
            className="pointer-events-auto hidden cursor-help rounded-md px-2 py-1.5 text-xs text-[var(--oa-text-dim)] lg:inline"
            title={SHORTCUTS_HELP}
          >
            ⌨ shortcuts
          </span>
        </div>

        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </div>
    </ThemeContext.Provider>
  );
}
