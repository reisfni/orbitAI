# orbitAI

A self-hosted, single-user canvas for vibe coding — an infinite workspace of draggable/resizable panes (terminals running coding agents, AI chat, file/diff views) instead of juggling terminal tabs and editor windows.

Inspired by [sshx.io](https://sshx.io)'s canvas-of-terminal-panes UX, without the multiplayer/relay layer: everything runs locally, on your own machine, for one person.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the toolbar to add panes:

- **+ Terminal** — a plain shell.
- **+ Claude Code** / **+ OpenCode** — spawns that CLI agent instead of a plain shell. Set your Anthropic API key first via **⚙ Settings**.
- **+ Files** — a file tree for the project orbitAI is running in, with a `git diff` viewer (click a file to see just its diff, or leave nothing selected for the full working-tree diff).

Drag a pane's title bar to move it, drag the bottom-right corner to resize it, scroll to zoom, and drag the empty canvas to pan — it's an infinite canvas (built on [React Flow](https://reactflow.dev)). Layout persists across reloads (browser `localStorage`).

**Multiple project workspaces**: type a path into the "Working directory" field before adding a pane — new terminal panes spawn with that `cwd`, and new Files panes scope their tree/diff to it. Different panes can point at different directories at the same time, so you can have several projects open on one canvas.

**Keyboard shortcuts** (ignored while typing in a text field or terminal): `t` / `c` / `o` / `f` add a Terminal / Claude Code / OpenCode / Files pane, `⌘,` opens Settings, `Esc` closes dialogs. Hover the "⌨ shortcuts" hint in the toolbar for the full list.

**Theme**: the sun/moon button in the toolbar toggles light/dark, persisted across reloads.

## How it works

- `server.ts` — custom Node server hosting the Next.js app plus a WebSocket endpoint (`/api/ws/terminal`) for PTY streaming.
- `src/server/pty.ts` — spawns a shell (or an agent CLI) per WebSocket connection via `node-pty` and pipes I/O in both directions, in the pane's chosen working directory; the user's saved Anthropic API key is injected into the process env.
- `src/server/settings.ts` — reads/writes the local, gitignored `.orbitai/settings.json` holding the API key.
- `src/server/files.ts` + `src/app/api/files/` — list a directory and run `git diff`, scoped to a `root` workspace directory (defaults to the server's cwd).
- `src/components/canvas/Canvas.tsx` — the React Flow canvas; each pane is a custom node (`PaneNode.tsx`) with a drag handle and a resize control. Owns the working-directory field, keyboard shortcuts, and theme state (`ThemeContext.tsx`).
- `src/components/panes/terminal/` — the `xterm.js`-based terminal pane, wired to the WebSocket.
- `src/components/panes/file-diff/` — the file tree + diff viewer pane.

## Security

orbitAI spawns real shell/agent processes, can read the local filesystem (anywhere the working-directory field points), and stores your API key in a local file. The server binds to `localhost` by default — never expose it beyond your own machine without adding authentication in front of it.
