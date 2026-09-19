"use client";

import { useCallback, useRef } from "react";
import type { PaneState } from "@/lib/types";

interface PaneWindowProps {
  pane: PaneState;
  children: React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

export default function PaneWindow({ pane, children, onMove, onResize, onFocus, onClose }: PaneWindowProps) {
  const dragState = useRef<{ startX: number; startY: number; paneX: number; paneY: number } | null>(null);
  const resizeState = useRef<{ startX: number; startY: number; width: number; height: number } | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      onFocus(pane.id);
      dragState.current = { startX: e.clientX, startY: e.clientY, paneX: pane.x, paneY: pane.y };
      const onPointerMove = (ev: PointerEvent) => {
        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const dy = ev.clientY - dragState.current.startY;
        onMove(pane.id, dragState.current.paneX + dx, dragState.current.paneY + dy);
      };
      const onPointerUp = () => {
        dragState.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [onFocus, onMove, pane.id, pane.x, pane.y]
  );

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onFocus(pane.id);
      resizeState.current = { startX: e.clientX, startY: e.clientY, width: pane.width, height: pane.height };
      const onPointerMove = (ev: PointerEvent) => {
        if (!resizeState.current) return;
        const dx = ev.clientX - resizeState.current.startX;
        const dy = ev.clientY - resizeState.current.startY;
        onResize(
          pane.id,
          Math.max(MIN_WIDTH, resizeState.current.width + dx),
          Math.max(MIN_HEIGHT, resizeState.current.height + dy)
        );
      };
      const onPointerUp = () => {
        resizeState.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [onFocus, onResize, pane.id, pane.width, pane.height]
  );

  return (
    <div
      className="absolute flex flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-[#111113] shadow-2xl"
      style={{ left: pane.x, top: pane.y, width: pane.width, height: pane.height, zIndex: pane.zIndex }}
      onPointerDown={() => onFocus(pane.id)}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-zinc-700/60 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 select-none active:cursor-grabbing"
        onPointerDown={startDrag}
      >
        <span className="truncate">{pane.title}</span>
        <button
          className="rounded px-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onClose(pane.id)}
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        onPointerDown={startResize}
      />
    </div>
  );
}
