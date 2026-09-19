"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaneState } from "@/lib/types";
import PaneWindow from "./PaneWindow";
import TerminalPane from "@/components/panes/terminal/TerminalPane";
import SettingsModal from "./SettingsModal";

const STORAGE_KEY = "orbitai:canvas-layout";

interface PanePreset {
  label: string;
  title: string;
  command?: string;
}

const PANE_PRESETS: PanePreset[] = [
  { label: "+ Terminal", title: "Terminal" },
  { label: "+ Claude Code", title: "Claude Code", command: "claude" },
  { label: "+ OpenCode", title: "OpenCode", command: "opencode" },
];

function defaultPanes(): PaneState[] {
  return [{ id: crypto.randomUUID(), type: "terminal", title: "Terminal", x: 120, y: 120, width: 640, height: 400, zIndex: 1 }];
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
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const maxZ = useRef(1);

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

  const focusPane = useCallback((id: string) => {
    maxZ.current += 1;
    const z = maxZ.current;
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, zIndex: z } : p)));
  }, []);

  const movePane = useCallback((id: string, x: number, y: number) => {
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  }, []);

  const resizePane = useCallback((id: string, width: number, height: number) => {
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, width, height } : p)));
  }, []);

  const closePane = useCallback((id: string) => {
    setPanes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPane = useCallback((preset: PanePreset) => {
    maxZ.current += 1;
    setPanes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "terminal",
        title: preset.title,
        command: preset.command,
        x: 120 + prev.length * 24,
        y: 120 + prev.length * 24,
        width: 640,
        height: 400,
        zIndex: maxZ.current,
      },
    ]);
  }, []);

  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      panRef.current = { startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y };
      const onPointerMove = (ev: PointerEvent) => {
        if (!panRef.current) return;
        const dx = ev.clientX - panRef.current.startX;
        const dy = ev.clientY - panRef.current.startY;
        setView((v) => ({ ...v, x: panRef.current!.viewX + dx, y: panRef.current!.viewY + dy }));
      };
      const onPointerUp = () => {
        panRef.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [view.x, view.y]
  );

  if (!hydrated) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0b]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px)",
          backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
        onPointerDown={onBackgroundPointerDown}
      />

      <div
        className="absolute left-0 top-0 h-full w-full"
        style={{ transform: `translate(${view.x}px, ${view.y}px)`, transformOrigin: "0 0" }}
      >
        {panes.map((pane) => (
          <PaneWindow key={pane.id} pane={pane} onMove={movePane} onResize={resizePane} onFocus={focusPane} onClose={closePane}>
            {pane.type === "terminal" && (
              <TerminalPane paneId={pane.id} width={pane.width} height={pane.height} command={pane.command} />
            )}
          </PaneWindow>
        ))}
      </div>

      <div className="absolute left-4 top-4 z-50 flex gap-2">
        {PANE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 shadow hover:bg-zinc-700"
            onClick={() => addPane(preset)}
          >
            {preset.label}
          </button>
        ))}
        <button
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 shadow hover:bg-zinc-700"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙ Settings
        </button>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
