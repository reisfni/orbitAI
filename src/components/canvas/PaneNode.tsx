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
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[var(--oa-border)] bg-[var(--oa-surface)] shadow-2xl">
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

      <div className="pane-drag-handle flex cursor-grab items-center justify-between border-b border-[var(--oa-border)] bg-[var(--oa-surface-2)] px-3 py-1.5 text-xs text-[var(--oa-text-muted)] select-none active:cursor-grabbing">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate">{pane.title}</span>
          {pane.dir && <span className="truncate text-[10px] text-[var(--oa-text-dim)]">{pane.dir}</span>}
        </span>
        <button
          className="rounded px-1.5 text-[var(--oa-text-dim)] hover:bg-[var(--oa-surface-2-hover)] hover:text-[var(--oa-text)]"
          onClick={() => onClose(pane.id)}
        >
          ✕
        </button>
      </div>

      <div className="nowheel min-h-0 flex-1">
        {pane.type === "terminal" && (
          <TerminalPane paneId={pane.id} width={pane.width} height={pane.height} command={pane.command} dir={pane.dir} />
        )}
        {pane.type === "file-diff" && <FileDiffPane dir={pane.dir} />}
      </div>
    </div>
  );
}
