/**
 * Primal Pinas live location — polls the public !map code API.
 * Same endpoint as https://primalpinas.online/map (GET /api/public/self?code=)
 *
 * Their public API refreshes yaw often but X/Y only every ~5–15s. Between those
 * authoritative XY fixes we coast using velocity measured from the last real move
 * (not yaw — yaw-only dead-reckoning drifted badly).
 */

const POLL_MS = 1000;
const TICK_MS = 50;
const API_BASE = "https://primalpinas.online/api/public/self";

/** Ignore sub-meter jitter when deciding “moved” */
const MIN_MOVE_CM = 80;
/** Cap coast speed (~14 m/s — covers most sprinting dinos) */
const MAX_SPEED_CM_S = 1400;
/** Don’t invent motion forever if the server never confirms */
const MAX_COAST_MS = 12000;

/** @type {ReturnType<typeof setInterval> | null} */
let pollTimer = null;
/** @type {ReturnType<typeof setInterval> | null} */
let tickTimer = null;
/** @type {string} */
let mapCode = "";
/** @type {((coords: object) => void) | null} */
let onLocation = null;
/** @type {((status: object) => void) | null} */
let onStatus = null;
/** @type {boolean} */
let inFlight = false;
/** @type {object | null} */
let lastStatus = null;

/** Last authoritative sample from the API */
let auth = null;
/** cm/s from last confirmed XY delta */
let vel = { vx: 0, vy: 0 };
/** Stop coasting after this timestamp */
let coastUntil = 0;
/** Last display publish (for status / dedupe) */
let lastDisplay = null;
let stuckPolls = 0;
/** Pause XY coasting when Asset Location just won (dual mode) */
let externalHoldUntil = 0;

function normalizeCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function extractCode(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    if (/^https?:\/\//i.test(text)) {
      const u = new URL(text);
      const q = u.searchParams.get("code");
      if (q) return normalizeCode(q);
    }
  } catch {
    /* bare */
  }
  const m = text.match(/[?&]code=([A-Za-z0-9]+)/i);
  if (m) return normalizeCode(m[1]);
  return normalizeCode(text);
}

function asNum(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(String(v).replace(/,/g, "").replace(/\u2212/g, "-"));
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function readPlayerXYZ(p) {
  if (!p || typeof p !== "object") return { x: NaN, y: NaN, z: NaN };
  const nest = p.location || p.pos || p.position || p.coords || null;
  return {
    x: asNum(p.x, p.X, p.locX, p.ueX, nest?.x, nest?.X),
    y: asNum(p.y, p.Y, p.locY, p.ueY, nest?.y, nest?.Y),
    z: asNum(p.z, p.Z, p.locZ, p.ueZ, nest?.z, nest?.Z),
  };
}

function emitStatus(partial) {
  lastStatus = {
    provider: "primal-pinas",
    code: mapCode ? `${mapCode.slice(0, 2)}…` : "",
    hasCode: Boolean(mapCode),
    updatedAt: Date.now(),
    ...partial,
  };
  try {
    onStatus?.(lastStatus);
  } catch (err) {
    console.warn("[primal-pinas] onStatus", err);
  }
}

function coastActive(now = Date.now()) {
  if (now < externalHoldUntil) return false;
  if (now > coastUntil) return false;
  return Math.hypot(vel.vx, vel.vy) > 8;
}

function displayXYZ(now = Date.now()) {
  if (!auth) return null;
  if (!coastActive(now)) {
    return { x: auth.x, y: auth.y, z: auth.z, predicted: false };
  }
  const elapsed = Math.max(0, (now - auth.t) / 1000);
  return {
    x: auth.x + vel.vx * elapsed,
    y: auth.y + vel.vy * elapsed,
    z: auth.z,
    predicted: true,
  };
}

function publishDisplay(opts = {}) {
  if (!auth) return;
  const now = Date.now();
  const pos = displayXYZ(now);
  if (!pos) return;

  // Skip tiny XY spam on ticks; always allow yaw/force publishes
  if (
    !opts.force &&
    lastDisplay &&
    pos.predicted &&
    Math.hypot(pos.x - lastDisplay.x, pos.y - lastDisplay.y) < 25
  ) {
    return;
  }

  lastDisplay = { x: pos.x, y: pos.y, z: pos.z, t: now };

  const coords = {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    source: "primal-pinas",
    name: auth.name,
    class: auth.class,
    growth: auth.growth,
    predicted: pos.predicted,
    ts: auth.serverTs,
  };
  if (Number.isFinite(auth.yaw)) coords.yaw = auth.yaw;

  try {
    onLocation?.(coords);
  } catch (err) {
    console.warn("[primal-pinas] onLocation", err);
  }
}

function applyAuthSample(sample) {
  const now = Date.now();
  const { x, y, z, yaw, name, cls, growth, serverTs } = sample;
  const movedCm = auth ? Math.hypot(x - auth.x, y - auth.y) : 0;

  if (auth && movedCm >= MIN_MOVE_CM) {
    const dt = Math.max(0.25, (now - auth.t) / 1000);
    let vx = (x - auth.x) / dt;
    let vy = (y - auth.y) / dt;
    const sp = Math.hypot(vx, vy);
    if (sp > MAX_SPEED_CM_S) {
      const s = MAX_SPEED_CM_S / sp;
      vx *= s;
      vy *= s;
    }
    vel = { vx, vy };
    // Coast a bit longer than the gap we just observed
    const coastMs = Math.min(
      MAX_COAST_MS,
      Math.max(3500, dt * 1000 * 1.35)
    );
    coastUntil = now + coastMs;
    stuckPolls = 0;
    auth = {
      x,
      y,
      z,
      t: now,
      yaw: Number.isFinite(yaw) ? yaw : auth.yaw ?? null,
      name,
      class: cls,
      growth,
      serverTs: Number.isFinite(serverTs) ? serverTs : now,
    };
  } else if (auth && movedCm < MIN_MOVE_CM) {
    stuckPolls += 1;
    // Confirmed stop: stuck after coast window → kill velocity
    if (stuckPolls >= 2 && now > coastUntil) {
      vel = { vx: 0, vy: 0 };
    }
    // Keep auth.t so coasting keeps advancing; only refresh yaw/meta
    auth = {
      ...auth,
      z,
      yaw: Number.isFinite(yaw) ? yaw : auth.yaw ?? null,
      name,
      class: cls,
      growth,
      serverTs: Number.isFinite(serverTs) ? serverTs : auth.serverTs,
    };
  } else {
    stuckPolls = 0;
    auth = {
      x,
      y,
      z,
      t: now,
      yaw: Number.isFinite(yaw) ? yaw : null,
      name,
      class: cls,
      growth,
      serverTs: Number.isFinite(serverTs) ? serverTs : now,
    };
  }

  let message =
    `${name || "Player"}` +
    (cls ? ` — ${cls}` : "") +
    (growth != null ? ` · ${Math.round(growth * 100)}%` : "") +
    ` · X ${Math.round(x)}  Y ${Math.round(y)}  Z ${Math.round(z)}`;
  if (movedCm >= MIN_MOVE_CM) {
    message += ` · moved ${Math.round(movedCm / 100)}m`;
  } else if (coastActive(now)) {
    message += " · smoothing between server fixes";
  } else if (stuckPolls >= 3) {
    message +=
      " · server position lag (~5–15s) — IsleMap coasts on your last measured speed";
  }

  emitStatus({
    state: "ok",
    message,
    stuck: stuckPolls >= 3,
    movedCm,
    coasting: coastActive(now),
    player: {
      name,
      class: cls,
      growth,
      x,
      y,
      z,
      yaw: Number.isFinite(yaw) ? yaw : null,
    },
  });

  if (movedCm >= MIN_MOVE_CM) {
    console.log(
      `[primal-pinas] X ${Math.round(x)} Y ${Math.round(y)} Z ${Math.round(z)}` +
        (Number.isFinite(yaw) ? ` yaw=${yaw.toFixed(1)}` : "") +
        ` Δ=${Math.round(movedCm)}cm` +
        ` v=${Math.round(Math.hypot(vel.vx, vel.vy) / 100)}m/s`
    );
  }

  publishDisplay({ force: true });
}

function tickCoast() {
  if (!auth || !coastActive()) return;
  publishDisplay({ force: false });
}

async function pollOnce() {
  if (!mapCode || inFlight) return;
  inFlight = true;
  try {
    const url = `${API_BASE}?code=${encodeURIComponent(mapCode)}&_=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      emitStatus({
        state: res.status === 404 || res.status === 400 ? "bad_code" : "error",
        message: String(
          (body && body.error) ||
            (res.status === 404
              ? "invalid or expired code — type !map in game"
              : `HTTP ${res.status}`)
        ),
        httpStatus: res.status,
      });
      return;
    }
    if (body?.error) {
      emitStatus({
        state: "error",
        message: String(body.error),
        httpStatus: res.status,
      });
      return;
    }
    if (!body?.spawned || !body?.player) {
      vel = { vx: 0, vy: 0 };
      coastUntil = 0;
      auth = null;
      emitStatus({
        state: "not_spawned",
        message:
          "Not spawned — join the Primal Pinas server and spawn to see your position.",
        httpStatus: res.status,
      });
      return;
    }

    const p = body.player;
    const { x, y, z } = readPlayerXYZ(p);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      emitStatus({
        state: "error",
        message: "Position payload missing x/y",
        httpStatus: res.status,
      });
      return;
    }

    const yaw = asNum(p.yaw, p.Yaw, p.rotation, p.Rot);
    const zz = Number.isFinite(z) ? z : 0;
    const name = p.name != null ? String(p.name) : "";
    const cls =
      p.cls != null ? String(p.cls) : p.class != null ? String(p.class) : "";
    const growth = Number.isFinite(Number(p.growth)) ? Number(p.growth) : null;

    applyAuthSample({
      x,
      y,
      z: zz,
      yaw,
      name,
      cls,
      growth,
      serverTs: Number.isFinite(Number(body.ts)) ? Number(body.ts) : Date.now(),
    });
  } catch (err) {
    emitStatus({
      state: "error",
      message: err?.message || String(err),
    });
  } finally {
    inFlight = false;
  }
}

function stopTimers() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function stop() {
  stopTimers();
}

function resetMotion() {
  auth = null;
  vel = { vx: 0, vy: 0 };
  coastUntil = 0;
  lastDisplay = null;
  stuckPolls = 0;
  externalHoldUntil = 0;
}

function start(opts = {}) {
  onLocation = typeof opts.onLocation === "function" ? opts.onLocation : null;
  onStatus = typeof opts.onStatus === "function" ? opts.onStatus : null;
  mapCode = extractCode(opts.code);
  stopTimers();
  resetMotion();
  if (!mapCode) {
    emitStatus({
      state: "idle",
      message: "Paste your !map code to start live tracking.",
    });
    return;
  }
  emitStatus({ state: "locating", message: "Locating…" });
  void pollOnce();
  pollTimer = setInterval(() => {
    void pollOnce();
  }, POLL_MS);
  tickTimer = setInterval(tickCoast, TICK_MS);
}

function setCode(code) {
  const next = extractCode(code);
  if (next === mapCode && pollTimer) return;
  mapCode = next;
  resetMotion();
  if (!mapCode) {
    stop();
    emitStatus({
      state: "idle",
      message: "Paste your !map code to start live tracking.",
    });
    return;
  }
  if (pollTimer) {
    emitStatus({ state: "locating", message: "Locating…" });
    void pollOnce();
  } else if (onLocation || onStatus) {
    start({ code: mapCode, onLocation, onStatus });
  }
}

/**
 * Dual-mode: Asset Location just provided a fresh XY — keep Primal yaw,
 * but don’t let coasting overwrite the clipboard pin for a while.
 */
function holdExternalFix(ms = 45000) {
  externalHoldUntil = Date.now() + Math.max(0, ms);
  vel = { vx: 0, vy: 0 };
  coastUntil = 0;
  if (auth) {
    // Keep publishing yaw-only against the held external pin (main merges XY).
    publishDisplay({ force: true });
  }
}

function getStatus() {
  return lastStatus;
}

function isRunning() {
  return Boolean(pollTimer);
}

module.exports = {
  POLL_MS,
  API_BASE,
  normalizeCode,
  extractCode,
  start,
  stop,
  setCode,
  holdExternalFix,
  getStatus,
  isRunning,
};
