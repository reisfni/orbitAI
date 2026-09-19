import * as pty from "node-pty";
import type { WebSocket } from "ws";
import type { ParsedUrlQuery } from "querystring";

type ClientMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number };

const shell = process.env.SHELL ?? (process.platform === "win32" ? "powershell.exe" : "bash");

export function attachTerminalSocket(ws: WebSocket, query: ParsedUrlQuery) {
  const cwd = typeof query.cwd === "string" && query.cwd.length > 0 ? query.cwd : process.env.HOME;
  const command = typeof query.command === "string" && query.command.length > 0 ? query.command : undefined;

  const term = pty.spawn(command ?? shell, command ? [] : [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd,
    env: process.env as Record<string, string>,
  });

  term.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "output", data }));
    }
  });

  term.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "exit", exitCode }));
      ws.close();
    }
  });

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "input") {
      term.write(msg.data);
    } else if (msg.type === "resize") {
      term.resize(msg.cols, msg.rows);
    }
  });

  ws.on("close", () => {
    term.kill();
  });
}
