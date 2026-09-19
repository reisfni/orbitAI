"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "@/components/canvas/ThemeContext";

const XTERM_THEME = {
  dark: { background: "#111113", foreground: "#e4e4e7", cursor: "#e4e4e7" },
  light: { background: "#ffffff", foreground: "#18181b", cursor: "#18181b" },
};

interface TerminalPaneProps {
  paneId: string;
  width: number;
  height: number;
  command?: string;
  dir?: string;
}

export default function TerminalPane({ paneId, width, height, command, dir }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "var(--font-geist-mono), monospace",
      theme: XTERM_THEME[theme],
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const query = new URLSearchParams();
    if (command) query.set("command", command);
    if (dir) query.set("cwd", dir);
    const qs = query.toString();
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/ws/terminal${qs ? `?${qs}` : ""}`);
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
    // `theme` is intentionally omitted: toggling it shouldn't recreate the
    // terminal (and kill the shell session) — the effect below updates the
    // live theme in place instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paneId, command, dir]);

  useEffect(() => {
    fitAddonRef.current?.fit();
    const term = termRef.current;
    const ws = wsRef.current;
    if (term && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    }
  }, [width, height]);

  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = XTERM_THEME[theme];
  }, [theme]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden p-2" />;
}
