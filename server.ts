import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { attachTerminalSocket } from "./src/server/pty";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const handleUpgrade = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "/");

    if (pathname === "/api/ws/terminal") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        attachTerminalSocket(ws, parse(req.url ?? "/", true).query);
      });
      return;
    }

    // Let Next.js handle everything else (e.g. its HMR websocket in dev).
    handleUpgrade(req, socket, head);
  });

  server.listen(port, hostname, () => {
    // Bind to localhost by default: orbitAI spawns real shells and reads the
    // local filesystem, so it must never be exposed beyond this machine.
    console.log(`> orbitAI ready on http://${hostname}:${port}`);
  });
});
