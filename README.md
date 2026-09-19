# orbitAI

A self-hosted, single-user canvas for vibe coding — an infinite workspace of draggable/resizable panes (terminals running coding agents, AI chat, file/diff views) instead of juggling terminal tabs and editor windows.

Inspired by [sshx.io](https://sshx.io)'s canvas-of-terminal-panes UX, without the multiplayer/relay layer: everything runs locally, on your own machine, for one person.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **+ Terminal** to spawn a new pane running your default shell; drag its title bar to move it, drag the bottom-right corner to resize it. Canvas layout persists across reloads (browser `localStorage`).

## How it works

- `server.ts` — custom Node server hosting the Next.js app plus a WebSocket endpoint (`/api/ws/terminal`) for PTY streaming.
- `src/server/pty.ts` — spawns a real shell per WebSocket connection via `node-pty` and pipes I/O in both directions.
- `src/components/canvas/` — the pan-able canvas surface and draggable/resizable pane windows.
- `src/components/panes/terminal/` — the `xterm.js`-based terminal pane, wired to the WebSocket.

## Security

orbitAI spawns real shell processes and can read the local filesystem. The server binds to `localhost` by default — never expose it beyond your own machine without adding authentication in front of it.

## Roadmap

See the project plan for AI chat panes, file/diff panes, and agent-CLI presets (Claude Code, Aider, Codex).
