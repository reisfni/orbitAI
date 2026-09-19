"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalPaneProps {
  paneId: string;
  width: number;
  height: number;
  command?: string;
}

export default function TerminalPane({ paneId, width, height, command }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "var(--font-geist-mono), monospace",
      theme: { background: "#111113" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const params = command ? `?command=${encodeURIComponent(command)}` : "";
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/ws/terminal${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "output") {
        term.write(msg.data);
      } else if (msg.type === "exit") {
        term.write(`\r\n\x1b[90m[process exited with code ${msg.exitCode}]\x1b[0m\r\n`);
      }
    };

    const onData = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    return () => {
      onData.dispose();
      ws.close();
      term.dispose();
    };
  }, [paneId, command]);

  useEffect(() => {
    fitAddonRef.current?.fit();
    const term = termRef.current;
    const ws = wsRef.current;
    if (term && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    }
  }, [width, height]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden p-2" />;
}
