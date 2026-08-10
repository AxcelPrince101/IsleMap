/**
 * Bosch Island live location — polls map-tracker JSON with a partitioned session.
 * Site: https://bosch-island.com/map-tracker
 * Protocol (from their map-tracker.js):
 *   GET data-map-tracker-state-url → { ok: true, data: { currentPoint: { x, y, altitude, ... } } }
 *   credentials: same-origin (cookies after interactive login)
 *   Site default poll ≥ 5s. IsleMap targets ~2s; backs off on HTTP 429.
 */
const { BrowserWindow, session } = require("electron");
const { pixelToWorld } = require("./gateway-coords");

const PARTITION = "persist:islemap-bosch";
const MAP_TRACKER_URL = "https://bosch-island.com/map-tracker";
/** Fastest steady poll — 1s triggers Bosch/Cloudflare 429 */
const DEFAULT_POLL_MS = 2000;
const MIN_POLL_MS = 2000;
const MAX_POLL_MS = 15000;
const ORIGIN = "https://bosch-island.com";

/** @type {ReturnType<typeof setTimeout> | null} */
let pollTimer = null;
/** @type {BrowserWindow | null} */
let authWindow = null;
/** Hidden window kept for same-origin polling after connect */
/** @type {BrowserWindow | null} */
let trackerWindow = null;
/** @type {((coords: object) => void) | null} */
let onLocation = null;
/** @type {((status: object) => void) | null} */
let onStatus = null;
/** @type {((connected: boolean) => void) | null} */
let onConnectedChange = null;

let stateUrl = "";
let pollMs = DEFAULT_POLL_MS;
let mapWidth = 1254;
let mapHeight = 1254;
let inFlight = false;
/** @type {object | null} */
let lastStatus = null;
let connected = false;
/** Consecutive hard failures before we declare auth dead */
let authFailStreak = 0;

function boschSession() {
  return session.fromPartition(PARTITION);
}

function emitStatus(partial) {
  lastStatus = {
    provider: "bosch-island",
    connected,
    hasStateUrl: Boolean(stateUrl),
    updatedAt: Date.now(),
    ...partial,
  };
  try {
    onStatus?.(lastStatus);
  } catch (err) {
    console.warn("[bosch-island] onStatus", err);
  }
}

function setConnected(next) {
  const v = Boolean(next);
  if (connected === v) return;
  connected = v;
  try {
    onConnectedChange?.(connected);
  } catch (err) {
    console.warn("[bosch-island] onConnectedChange", err);
  }
}

function asNum(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(String(v).replace(/,/g, "").replace(/\u2212/g, "-"));
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function pointToWorld(point) {
  if (!point || typeof point !== "object") return null;

  // Bosch ships Unreal cm as world_x/world_y, but axes are swapped vs
  // in-game Asset Location / Copy Location (verified against live samples).
  const boschWx = asNum(
    point.world_x,
    point.worldX,
    point.ueX,
    point.locX,
    point.unreal_x,
    point.unrealX
  );
  const boschWy = asNum(
    point.world_y,
    point.worldY,
    point.ueY,
    point.locY,
    point.unreal_y,
    point.unrealY
  );
  if (Number.isFinite(boschWx) && Number.isFinite(boschWy)) {
    return {
      x: boschWy,
      y: boschWx,
      z: asNum(point.altitude, point.z, point.world_z, point.ueZ) || 0,
      space: "world",
    };
  }

  // simple_* uses the same swapped Bosch axis labels
  const boschSx = asNum(point.simple_x, point.simpleX);
  const boschSy = asNum(point.simple_y, point.simpleY);
  if (Number.isFinite(boschSx) && Number.isFinite(boschSy)) {
    return {
      x: boschSy * 1000,
      y: boschSx * 1000,
      z: asNum(point.altitude, point.z) || 0,
      space: "simple",
    };
  }

  const px = asNum(point.x, point.X, point.map_x, point.mapX);
  const py = asNum(point.y, point.Y, point.map_y, point.mapY);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

  const z = asNum(point.altitude, point.z) || 0;

  // Unreal cm (Gateway playable area is typically |coord| >> map pixels)
  if (Math.abs(px) > 2500 || Math.abs(py) > 2500) {
    return { x: px, y: py, z, space: "cm" };
  }

  // Vulnona “simple” units (cm/1000) — often negative / outside the pixel canvas
  const outsidePixelCanvas =
    px < -0.5 ||
    py < -0.5 ||
    px > mapWidth + 0.5 ||
    py > mapHeight + 0.5;
  if (
    outsidePixelCanvas &&
    Math.abs(px) <= 900 &&
    Math.abs(py) <= 900
  ) {
    return { x: px * 1000, y: py * 1000, z, space: "simple" };
  }

  const world = pixelToWorld(px, py, mapWidth, mapHeight);
  return { x: world.x, y: world.y, z, space: "pixel", px, py };
}

function closeAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    try {
      authWindow.close();
    } catch {
      /* ignore */
    }
  }
  authWindow = null;
}

function destroyTrackerWindow() {
  if (trackerWindow && !trackerWindow.isDestroyed()) {
    try {
      trackerWindow.destroy();
    } catch {
      /* ignore */
    }
  }
  trackerWindow = null;
}

function ensureTrackerWindow() {
  if (trackerWindow && !trackerWindow.isDestroyed()) {
    return trackerWindow;
  }
  trackerWindow = new BrowserWindow({
    width: 980,
    height: 720,
    show: false,
    title: "Bosch Island tracker (background)",
    autoHideMenuBar: true,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  trackerWindow.on("closed", () => {
    trackerWindow = null;
  });
  return trackerWindow;
}

async function loadTrackerPage() {
  const win = ensureTrackerWindow();
  const url = win.webContents.getURL() || "";
  if (url.startsWith(ORIGIN) && !url.includes("/login")) {
    return win;
  }
  await win.loadURL(MAP_TRACKER_URL);
  return win;
}

/**
 * Poll the way Bosch’s own map-tracker.js does: in-page fetch + cookies.
 */
async function fetchStateViaPage() {
  if (!stateUrl) return null;
  const win = await loadTrackerPage();
  if (!win || win.isDestroyed()) {
    const err = new Error("Bosch tracker window unavailable");
    err.code = "no_window";
    throw err;
  }

  const result = await win.webContents.executeJavaScript(
    `(() => {
      const url = ${JSON.stringify(stateUrl)};
      return fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        cache: "no-store",
      }).then(async (res) => {
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (_) {}
        return {
          ok: res.ok,
          status: res.status,
          redirected: res.redirected,
          finalUrl: res.url || "",
          pageUrl: location.href || "",
          json,
          textPreview: String(text || "").slice(0, 180),
        };
      }).catch((err) => ({
        ok: false,
        status: 0,
        error: String(err && err.message || err),
        pageUrl: location.href || "",
      }));
    })()`,
    true
  );

  if (!result) {
    const err = new Error("Empty Bosch page fetch");
    err.code = "empty";
    throw err;
  }

  const pageUrl = String(result.pageUrl || "");
  if (/\/login/i.test(pageUrl) || /\/login/i.test(String(result.finalUrl || ""))) {
    const err = new Error("Bosch login required");
    err.status = 401;
    err.code = "login_page";
    throw err;
  }

  if (!result.ok) {
    const err = new Error(`HTTP ${result.status || 0}`);
    err.status = result.status || 0;
    err.code = "http";
    err.bodyPreview = result.textPreview || "";
    throw err;
  }

  if (result.json && typeof result.json === "object") {
    return result.json;
  }

  const err = new Error("Bosch tracker returned non-JSON");
  err.status = result.status || 200;
  err.code = "non_json";
  err.bodyPreview = result.textPreview || "";
  throw err;
}

async function readXsrfToken() {
  try {
    const cookies = await boschSession().cookies.get({
      url: ORIGIN,
    });
    const xsrf = cookies.find((c) => c.name === "XSRF-TOKEN");
    if (!xsrf?.value) return "";
    try {
      return decodeURIComponent(xsrf.value);
    } catch {
      return xsrf.value;
    }
  } catch {
    return "";
  }
}

/** Fallback when no tracker window — still send browser-like headers + XSRF. */
async function fetchStateViaSession() {
  if (!stateUrl) return null;
  const ses = boschSession();
  const xsrf = await readXsrfToken();
  const headers = {
    Accept: "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
    Referer: MAP_TRACKER_URL,
    Origin: ORIGIN,
  };
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  const res = await ses.fetch(stateUrl, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.code = "http";
    throw err;
  }
  return res.json();
}

async function fetchState() {
  try {
    return await fetchStateViaPage();
  } catch (pageErr) {
    // Real logout → don't bother with session.fetch
    if (pageErr?.code === "login_page" || pageErr?.status === 401) {
      throw pageErr;
    }
    try {
      return await fetchStateViaSession();
    } catch (sessionErr) {
      // Prefer the more informative page error when both fail
      if (pageErr?.status) throw pageErr;
      throw sessionErr;
    }
  }
}

function publishFromData(data) {
  const point =
    data?.currentPoint && typeof data.currentPoint === "object"
      ? data.currentPoint
      : null;
  const world = pointToWorld(point);
  if (!world) {
    emitStatus({
      state: "waiting",
      message: data?.message || "Connected — waiting for a live position…",
      status: data?.status || "",
      lastUpdated: data?.lastUpdated || "",
      serverName: point?.server_name || "",
    });
    return false;
  }

  setConnected(true);
  authFailStreak = 0;
  const coords = {
    x: world.x,
    y: world.y,
    z: world.z,
    source: "bosch-island",
    name: point?.player_name || point?.name || "",
    predicted: false,
    space: world.space || "pixel",
  };
  const heading = asNum(point.heading, point.raw_heading, point.yaw);
  if (Number.isFinite(heading)) coords.yaw = heading;
  const species = String(point.species || point.class || "").trim();
  if (species) coords.class = species.replace(/^BP_/i, "");
  try {
    onLocation?.(coords);
  } catch (err) {
    console.warn("[bosch-island] onLocation", err);
  }

  // Persist last sample for calibration / debugging
  try {
    const { app } = require("electron");
    const fs = require("fs");
    const path = require("path");
    const sample = {
      t: Date.now(),
      space: world.space || "pixel",
      mapWidth,
      mapHeight,
      raw: point,
      world: { x: world.x, y: world.y, z: world.z },
      px: world.px,
      py: world.py,
    };
    fs.writeFileSync(
      path.join(app.getPath("userData"), "bosch-last-sample.json"),
      JSON.stringify(sample, null, 2),
      "utf8"
    );
    console.log(
      `[bosch-island] ${world.space || "pixel"}` +
        (Number.isFinite(world.px)
          ? ` px ${Math.round(world.px)},${Math.round(world.py)}`
          : "") +
        ` → ${Math.round(world.x)}, ${Math.round(world.y)} (map ${mapWidth}×${mapHeight})`
    );
  } catch (err) {
    console.warn("[bosch-island] sample log", err?.message || err);
  }

  emitStatus({
    state: "ok",
    message: data?.message || "Tracking on Bosch Island",
    status: data?.status || "live",
    lastUpdated: data?.lastUpdated || "",
    serverName: point?.server_name || "",
    space: world.space || "pixel",
    px: world.px,
    py: world.py,
    mapWidth,
    mapHeight,
    x: world.x,
    y: world.y,
    z: world.z,
  });
  return true;
}

function looksLikeAuthFailure(err) {
  const status = Number(err?.status) || 0;
  if (err?.code === "login_page") return true;
  if (status === 401) return true;
  // 403 alone is often Cloudflare — only treat as auth after repeated failures
  // and when we also saw a login redirect / explicit message.
  const preview = String(err?.bodyPreview || err?.message || "").toLowerCase();
  if (
    status === 403 &&
    (preview.includes("unauthenticated") ||
      preview.includes("unauthorized") ||
      preview.includes("login") ||
      preview.includes("csrf token mismatch"))
  ) {
    return true;
  }
  return false;
}

/** Consecutive successful polls before speeding back up after a 429 */
let okStreak = 0;

async function pollOnce() {
  if (!stateUrl || inFlight) return;
  inFlight = true;
  try {
    const body = await fetchState();
    if (!body?.ok || !body?.data) {
      emitStatus({
        state: "waiting",
        message:
          body?.message ||
          "Bosch tracker responded without location data — still connected",
        connected: true,
      });
      scheduleNextPoll();
      return;
    }
    authFailStreak = 0;
    okStreak += 1;
    // After a rate-limit cooldown, ease back toward the target interval
    if (okStreak >= 3 && pollMs > DEFAULT_POLL_MS) {
      pollMs = Math.max(DEFAULT_POLL_MS, Math.floor(pollMs * 0.75));
    }
    publishFromData(body.data);
    scheduleNextPoll();
  } catch (err) {
    const status = Number(err?.status) || 0;
    console.warn(
      "[bosch-island] poll failed",
      status || err?.code || "",
      err?.message || err
    );

    if (status === 429) {
      okStreak = 0;
      pollMs = Math.min(MAX_POLL_MS, Math.max(5000, Math.floor(pollMs * 2)));
      emitStatus({
        state: "error",
        message: `Bosch rate limit — slowing to ${(pollMs / 1000).toFixed(0)}s…`,
      });
      scheduleNextPoll();
      return;
    }

    if (looksLikeAuthFailure(err)) {
      authFailStreak += 1;
      if (authFailStreak >= 2) {
        setConnected(false);
        emitStatus({
          state: "auth",
          message: "Bosch login required — click Connect Bosch again",
        });
        stopPolling();
        return;
      }
      emitStatus({
        state: "auth",
        message: "Checking Bosch login… if this persists, reconnect",
      });
      scheduleNextPoll();
      return;
    }

    emitStatus({
      state: "error",
      message:
        status === 403
          ? "Bosch tracker blocked a background request (Cloudflare). Retrying…"
          : err?.message || "Bosch poll failed — retrying…",
    });
    scheduleNextPoll();
  } finally {
    inFlight = false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function scheduleNextPoll() {
  stopPolling();
  if (!stateUrl) return;
  pollTimer = setTimeout(() => {
    pollTimer = null;
    void pollOnce();
  }, Math.max(MIN_POLL_MS, pollMs));
}

function startPolling() {
  stopPolling();
  if (!stateUrl) return;
  pollMs = Math.max(MIN_POLL_MS, Math.min(pollMs || DEFAULT_POLL_MS, MAX_POLL_MS));
  void pollOnce();
}

async function probePageMeta(win) {
  const meta = await win.webContents.executeJavaScript(
    `(() => {
      const root = document.getElementById("map-tracker-root");
      if (!root) return null;
      const url = root.dataset.mapTrackerStateUrl || "";
      const poll = Number(root.dataset.mapTrackerPollMs || 1000);
      const overlay = document.getElementById("map-tracker-overlay");
      const image = document.getElementById("map-tracker-image");
      let w = 1254;
      let h = 1254;
      if (overlay && overlay.viewBox && overlay.viewBox.baseVal) {
        w = overlay.viewBox.baseVal.width || w;
        h = overlay.viewBox.baseVal.height || h;
      } else if (image && image.naturalWidth > 0) {
        w = image.naturalWidth;
        h = image.naturalHeight;
      }
      const stateEl = document.getElementById("map-tracker-state");
      let initial = null;
      try {
        initial = stateEl ? JSON.parse(stateEl.textContent || "{}") : null;
      } catch (_) {}
      const href = location.href || "";
      return { url, poll, w, h, initial, href };
    })()`,
    true
  );
  return meta;
}

/**
 * Open Bosch map-tracker in a partitioned window so the user can log in.
 * Resolves when state URL is found and a poll succeeds (or rejects on cancel/timeout).
 */
function connectInteractive() {
  return new Promise((resolve, reject) => {
    closeAuthWindow();
    destroyTrackerWindow();
    authFailStreak = 0;
    emitStatus({
      state: "connecting",
      message: "Open Bosch Island and sign in if prompted…",
    });

    const win = new BrowserWindow({
      width: 1100,
      height: 800,
      title: "Bosch Island — Map Tracker",
      autoHideMenuBar: true,
      backgroundColor: "#0a0a0a",
      webPreferences: {
        partition: PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    authWindow = win;

    let settled = false;
    let checkTimer = null;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      if (checkTimer) clearInterval(checkTimer);
      checkTimer = null;
      if (err) {
        setConnected(false);
        emitStatus({
          state: "error",
          message: err.message || "Bosch connect failed",
        });
        reject(err);
        setTimeout(() => closeAuthWindow(), 400);
      } else {
        resolve(result);
        // Reuse this window as the hidden poller (same cookies + page context)
        try {
          win.hide();
          win.setTitle("Bosch Island tracker (background)");
          trackerWindow = win;
          authWindow = null;
          win.removeAllListeners("closed");
          win.on("closed", () => {
            if (trackerWindow === win) trackerWindow = null;
          });
        } catch {
          closeAuthWindow();
          void loadTrackerPage().catch(() => {});
        }
      }
    };

    win.on("closed", () => {
      authWindow = null;
      if (!settled) {
        finish(new Error("Bosch login window closed"));
      }
    });

    const tryCapture = async () => {
      if (settled || win.isDestroyed()) return;
      try {
        const meta = await probePageMeta(win);
        if (!meta?.url) return;
        if (/\/login/i.test(String(meta.href || ""))) return;

        stateUrl = meta.url.startsWith("http")
          ? meta.url
          : new URL(meta.url, MAP_TRACKER_URL).toString();
        pollMs = DEFAULT_POLL_MS;
        if (Number.isFinite(meta.w) && meta.w > 0) mapWidth = meta.w;
        if (Number.isFinite(meta.h) && meta.h > 0) mapHeight = meta.h;

        try {
          const body = await win.webContents.executeJavaScript(
            `fetch(${JSON.stringify(stateUrl)}, {
              method: "GET",
              credentials: "same-origin",
              headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
              cache: "no-store",
            }).then(async (res) => {
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.json();
            })`,
            true
          );
          if (body?.ok && body?.data) {
            publishFromData(body.data);
            startPolling();
            finish(null, { ok: true, stateUrl });
            return;
          }
        } catch (probeErr) {
          console.warn(
            "[bosch-island] live probe",
            probeErr?.message || probeErr
          );
        }

        if (meta.initial && typeof meta.initial === "object") {
          publishFromData(meta.initial);
          startPolling();
          finish(null, { ok: true, stateUrl });
        }
      } catch (err) {
        console.warn("[bosch-island] capture", err?.message || err);
      }
    };

    win.webContents.on("did-finish-load", () => {
      void tryCapture();
    });
    checkTimer = setInterval(() => {
      void tryCapture();
    }, 1500);

    win.loadURL(MAP_TRACKER_URL).catch((err) => {
      finish(err || new Error("Failed to open Bosch map tracker"));
    });

    setTimeout(() => {
      if (!settled) finish(new Error("Timed out waiting for Bosch login"));
    }, 5 * 60 * 1000);
  });
}

async function disconnect() {
  stopPolling();
  stateUrl = "";
  authFailStreak = 0;
  setConnected(false);
  closeAuthWindow();
  destroyTrackerWindow();
  try {
    await boschSession().clearStorageData();
  } catch (err) {
    console.warn("[bosch-island] clearStorage", err);
  }
  emitStatus({
    state: "off",
    message: "Bosch Island disconnected",
  });
}

function start(opts = {}) {
  onLocation = typeof opts.onLocation === "function" ? opts.onLocation : null;
  onStatus = typeof opts.onStatus === "function" ? opts.onStatus : null;
  onConnectedChange =
    typeof opts.onConnectedChange === "function" ? opts.onConnectedChange : null;

  if (opts.stateUrl) {
    stateUrl = String(opts.stateUrl);
  }
  if (Number.isFinite(Number(opts.mapWidth))) mapWidth = Number(opts.mapWidth);
  if (Number.isFinite(Number(opts.mapHeight))) mapHeight = Number(opts.mapHeight);
  pollMs = DEFAULT_POLL_MS;

  if (stateUrl) {
    setConnected(true);
    authFailStreak = 0;
    void loadTrackerPage()
      .then(() => startPolling())
      .catch(() => startPolling());
    emitStatus({
      state: "ok",
      message: "Resuming Bosch Island tracking…",
    });
  } else if (opts.connected) {
    setConnected(false);
    emitStatus({
      state: "auth",
      message: "Reconnect Bosch Island to resume live tracking",
    });
  } else {
    setConnected(false);
    emitStatus({
      state: "off",
      message: "Connect Bosch Island under Setup to enable live tracking",
    });
  }
}

function stop() {
  stopPolling();
  closeAuthWindow();
  destroyTrackerWindow();
  emitStatus({
    state: "off",
    message: "Bosch Island location is off",
  });
}

function getStatus() {
  return (
    lastStatus || {
      provider: "bosch-island",
      connected,
      hasStateUrl: Boolean(stateUrl),
      state: connected ? "ok" : "off",
      message: "",
      updatedAt: Date.now(),
    }
  );
}

function isRunning() {
  return Boolean(pollTimer);
}

function isConnected() {
  return connected;
}

function getStateUrl() {
  return stateUrl;
}

function getMapSize() {
  return { width: mapWidth, height: mapHeight, pollMs };
}

module.exports = {
  PARTITION,
  MAP_TRACKER_URL,
  start,
  stop,
  connectInteractive,
  disconnect,
  getStatus,
  isRunning,
  isConnected,
  getStateUrl,
  getMapSize,
};
