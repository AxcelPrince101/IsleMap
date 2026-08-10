/**
 * Primal Pinas species roster — same feed as https://primalpinas.online/caps
 * GET /api/public/classes + portraits at /dinos/{Name}.png
 */

const API_URL = "https://primalpinas.online/api/public/classes";
const DINO_IMG_BASE = "https://primalpinas.online/dinos";
const REFRESH_MS = 30000;

/** @type {{ ts: string|null, players: number, connected: number|null, classes: object[], fetchedAt: number } | null} */
let cache = null;
/** @type {ReturnType<typeof setInterval> | null} */
let timer = null;
/** @type {boolean} */
let inFlight = false;

function normalizeName(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function imageUrlFor(name) {
  const n = String(name || "").trim();
  if (!n) return "";
  return `${DINO_IMG_BASE}/${encodeURIComponent(n)}.png`;
}

function getRoster() {
  return (
    cache || {
      ts: null,
      players: 0,
      connected: null,
      classes: [],
      fetchedAt: 0,
    }
  );
}

function findClass(name) {
  const key = normalizeName(name);
  if (!key || !cache?.classes?.length) return null;
  return (
    cache.classes.find((c) => normalizeName(c.name) === key) ||
    cache.classes.find((c) => normalizeName(c.name).includes(key)) ||
    cache.classes.find((c) => key.includes(normalizeName(c.name))) ||
    null
  );
}

function enrichPlayer(player) {
  if (!player || typeof player !== "object") return null;
  const clsName = player.class || player.cls || player.name || "";
  const matched = findClass(clsName);
  const displayName = matched?.name || String(clsName || "").trim() || null;
  if (!displayName) return null;
  return {
    name: player.name != null ? String(player.name) : "",
    class: displayName,
    growth: Number.isFinite(Number(player.growth))
      ? Number(player.growth)
      : null,
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    imageUrl: imageUrlFor(displayName),
    caps: matched
      ? {
          online: matched.online,
          cap: matched.cap,
          state: matched.state,
          apex: Boolean(matched.apex),
        }
      : null,
    serverPlayers: cache?.players ?? null,
    serverConnected: cache?.connected ?? null,
  };
}

async function refresh() {
  if (inFlight) return cache;
  inFlight = true;
  try {
    const res = await fetch(`${API_URL}?_=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || body.error) {
      console.warn(
        "[primal-classes]",
        body?.error || `HTTP ${res.status}`
      );
      return cache;
    }
    const classes = Array.isArray(body.classes) ? body.classes : [];
    cache = {
      ts: body.ts != null ? String(body.ts) : null,
      players: Number(body.players) || 0,
      connected:
        body.connected != null && Number.isFinite(Number(body.connected))
          ? Number(body.connected)
          : null,
      classes: classes.map((c) => ({
        name: String(c.name || ""),
        online: Number(c.online) || 0,
        cap: c.cap == null ? null : Number(c.cap),
        state: String(c.state || "playable"),
        apex: Boolean(c.apex),
        imageUrl: imageUrlFor(c.name),
      })),
      fetchedAt: Date.now(),
    };
    return cache;
  } catch (err) {
    console.warn("[primal-classes]", err?.message || err);
    return cache;
  } finally {
    inFlight = false;
  }
}

function start() {
  if (timer) return;
  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, REFRESH_MS);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  API_URL,
  DINO_IMG_BASE,
  imageUrlFor,
  getRoster,
  findClass,
  enrichPlayer,
  refresh,
  start,
  stop,
};
