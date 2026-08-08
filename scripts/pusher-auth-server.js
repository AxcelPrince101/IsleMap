/**
 * Local Pusher presence auth for IsleMap groups.
 *
 * No player accounts — auth body carries pcId + username only.
 *
 * Usage:
 *   set ISLEMAP_PUSHER_APP_ID / KEY / SECRET / CLUSTER
 *   npm run group:auth
 */
const http = require("http");
const path = require("path");
const Pusher = require("pusher");
require(path.join(__dirname, "..", "electron", "load-env")).loadProjectEnv();

const port = Number(process.env.ISLEMAP_PUSHER_AUTH_PORT || 8787);
const appId = process.env.ISLEMAP_PUSHER_APP_ID || "";
const key = process.env.ISLEMAP_PUSHER_KEY || "";
const secret = process.env.ISLEMAP_PUSHER_SECRET || "";
const cluster = process.env.ISLEMAP_PUSHER_CLUSTER || "mt1";

if (!appId || !key || !secret) {
  console.error(
    "Set ISLEMAP_PUSHER_APP_ID, ISLEMAP_PUSHER_KEY, ISLEMAP_PUSHER_SECRET"
  );
  process.exit(1);
}

const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const type = req.headers["content-type"] || "";
      try {
        if (type.includes("application/json")) {
          resolve(JSON.parse(raw || "{}"));
          return;
        }
        const params = new URLSearchParams(raw);
        resolve(Object.fromEntries(params.entries()));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || !String(req.url || "").startsWith("/pusher/auth")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  try {
    const body = await readBody(req);
    const socketId = body.socket_id || body.socketId;
    const channelName = body.channel_name || body.channelName;
    const pcId = String(body.pcId || body.pc_id || "").trim();
    const username = String(body.username || "Hunter")
      .trim()
      .slice(0, 24) || "Hunter";

    if (!socketId || !channelName || !pcId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "socket_id, channel_name, pcId required" }));
      return;
    }
    if (!String(channelName).startsWith("presence-islemap-")) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "channel not allowed" }));
      return;
    }

    const auth = pusher.authorizeChannel(socketId, channelName, {
      user_id: pcId,
      user_info: { username, pcId },
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(auth));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "auth failed" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[group-auth] http://127.0.0.1:${port}/pusher/auth`);
  console.log("[group-auth] No player accounts — pcId + username only");
});
