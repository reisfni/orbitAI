"use client";

import { NodeResizeControl } from "@xyflow/react";
import type { PaneState } from "@/lib/types";
import TerminalPane from "@/components/panes/terminal/TerminalPane";
import FileDiffPane from "@/components/panes/file-diff/FileDiffPane";

export interface PaneNodeData {
  pane: PaneState;
  onClose: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  [key: string]: unknown;
}

export default function PaneNode({ data }: { data: PaneNodeData }) {
  const { pane, onClose, onResize } = data;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-[#111113] shadow-2xl">
      <NodeResizeControl
        nodeId={pane.id}
        position="bottom-right"
        minWidth={320}
        minHeight={200}
        style={{ background: "transparent", border: "none" }}
        onResizeEnd={(_, params) => onResize(pane.id, params.width, params.height)}
      >
        <div className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize" />
      </NodeResizeControl>

      <div className="pane-drag-handle flex cursor-grab items-center justify-between border-b border-zinc-700/60 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 select-none active:cursor-grabbing">
        <span className="truncate">{pane.title}</span>
        <button
          className="rounded px-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
          onClick={() => onClose(pane.id)}
        >
          ✕
        </button>
      </div>

      <div className="nowheel min-h-0 flex-1">
        {pane.type === "terminal" && (
          <TerminalPane paneId={pane.id} width={pane.width} height={pane.height} command={pane.command} />
        )}
        {pane.type === "file-diff" && <FileDiffPane />}
      </div>
    </div>
  );
}
