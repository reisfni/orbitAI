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

const STORAGE_KEY = "orbitai:canvas-layout";

const nodeTypes: NodeTypes = { paneNode: PaneNode };

interface PanePreset {
  label: string;
  title: string;
  type: PaneType;
  command?: string;
}

const PANE_PRESETS: PanePreset[] = [
  { label: "+ Terminal", title: "Terminal", type: "terminal" },
  { label: "+ Claude Code", title: "Claude Code", type: "terminal", command: "claude" },
  { label: "+ OpenCode", title: "OpenCode", type: "terminal", command: "opencode" },
  { label: "+ Files", title: "Files", type: "file-diff" },
];

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

export default function Canvas() {
  const [panes, setPanes] = useState<PaneState[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // One-time sync from localStorage on mount; SSR has no access to it, so
    // this can't be a lazy useState initializer without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPanes(loadLayout());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(panes));
  }, [panes, hydrated]);

  const closePane = useCallback((id: string) => {
    setPanes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resizePane = useCallback((id: string, width: number, height: number) => {
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, width, height } : p)));
  }, []);

  const addPane = useCallback((preset: PanePreset) => {
    setPanes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: preset.type,
        title: preset.title,
        command: preset.command,
        x: 120 + prev.length * 24,
        y: 120 + prev.length * 24,
        width: 640,
        height: 400,
      },
    ]);
  }, []);

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
    <div className="relative h-screen w-screen bg-[#0a0a0b]">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        elevateNodesOnSelect
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
      </ReactFlow>

      <div className="pointer-events-none absolute left-4 top-4 z-50 flex gap-2">
        {PANE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="pointer-events-auto rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 shadow hover:bg-zinc-700"
            onClick={() => addPane(preset)}
          >
            {preset.label}
          </button>
        ))}
        <button
          className="pointer-events-auto rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 shadow hover:bg-zinc-700"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙ Settings
        </button>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
