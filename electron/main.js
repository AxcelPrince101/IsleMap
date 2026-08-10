const {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  protocol,
  screen,
  session,
  shell,
  Tray,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { spawn } = require("child_process");
let ffmpegPath = null;
try {
  ffmpegPath = require("ffmpeg-static");
  if (typeof ffmpegPath === "string" && ffmpegPath.includes("app.asar")) {
    ffmpegPath = ffmpegPath.replace("app.asar", "app.asar.unpacked");
  }
} catch {
  ffmpegPath = null;
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "islemedia",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

require("./load-env").loadProjectEnv();
const {
  loadSettings,
  saveSettings,
  DEFAULTS,
  HOTKEY_KEYS,
  isLocationSetupReady,
} = require("./settings");
const {
  initUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateStatus,
  releasePageUrl,
  openInstallerDownload,
  setForceUpdateHandler,
  isForceUpdateRequired,
} = require("./updater");
const {
  readPlacesDoc,
  writePlacesDoc,
  flattenPlaces,
  rebuildDocFromPlaces,
  validatePlaceInput,
  uniqueId,
  placesFilePath,
  userPlacesPath,
} = require("./places-store");
const groupSync = require("./group-sync");
const { getPcId, getStoredUsername } = require("./identity");
const primalPinasLocation = require("./location-primal-pinas");
const primalPinasClasses = require("./primal-pinas-classes");
const boschIslandLocation = require("./location-bosch-island");
const {
  buildImxBuffer,
  parseImxBuffer,
  applyRadarSettings,
  isImxPath,
  listRadarTemplates,
  getRadarTemplate,
} = require("./radar-config");

// Fullscreen games mark other HWNDs as occluded; Chromium then stops painting.
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    openDashboard();
    const imxPath = findImxPathFromArgv(commandLine || []);
    if (imxPath) queueRadarConfigFromPath(imxPath);
  });
}

/** Unpackaged `electron .` / npm start — never true in a packaged build */
const IS_DEV = !app.isPackaged;

/** Default Gateway test pin (Dam) — cm world coords */
const DEV_DUMMY_DEFAULT = Object.freeze({
  x: -285800,
  y: 72000,
  z: 12000,
  label: "Dam",
});

const DEV_DUMMY_PRESETS = Object.freeze([
  { id: "dam", label: "Dam", x: -285800, y: 72000, z: 12000 },
  { id: "lakeport", label: "Lakeport (F11)", x: -239000, y: 37000, z: 8000 },
  { id: "derelict", label: "Derelict Base (C14)", x: -429800, y: 201000, z: 10000 },
  { id: "volcano", label: "Volcano (Extinct)", x: -267800, y: 250000, z: 20000 },
  { id: "center", label: "Map center", x: -77273, y: 44929, z: 10000 },
]);

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let dashboardWindow = null;
let clickThrough = true;
let lastClipboard = "";
let pollTimer = null;
let topmostTimer = null;
/** @type {{ x: number, y: number, z: number, label?: string } | null} */
let lastDevDummy = null;
/** @type {{ x: number, y: number, z: number, source?: string } | null} */
let lastPlayerLocation = null;
/** Overlay starts hidden — user enables it with Show map */
let userHidden = true;
/** Consecutive focus-poll ticks with The Isle not active (hides after threshold) */
let gameFocusHideTicks = 0;
/** @type {Tray | null} */
let tray = null;
/** When true, windows may close for real (Quit from tray) */
let isQuitting = false;
let toldAboutTray = false;
/** undefined = not loaded, null = failed, object = ready */
let win32;
/** @type {any} */
let attachedGameHwnd = null;
let koffiRef = null;
/** @type {ReturnType<typeof loadSettings>} */
let settings = { ...DEFAULTS };

/** Pending .imx offer until dashboard is ready to receive it */
let pendingRadarConfigOffer = null;

const POLL_MS = 300;
const TOPMOST_MS = 400;
/** Hide after this many inactive polls (~800ms) to avoid Alt-Tab flicker */
const GAME_FOCUS_HIDE_TICKS = 2;
const TOP_LEVEL = "screen-saver";
const GAME_TITLE_RE = /the\s*isle|theisle/i;
const APP_ICON = path.join(__dirname, "..", "build", "icon.png");

if (process.platform === "win32") {
  app.setAppUserModelId("online.balakegaming.islemap");
}

/** Guard against rapid hotkey spam */
let screenshotBusy = false;
/** @type {{ state: string, elapsedMs: number, saved?: string, path?: string }} */
let recordingState = { state: "idle", elapsedMs: 0, encodingJobs: [] };
/** @type {Map<string, object>} */
const encodingJobs = new Map();

function getEncodingJobsList() {
  return Array.from(encodingJobs.values()).sort(
    (a, b) => (b.startedAt || 0) - (a.startedAt || 0)
  );
}

function broadcastEncodingJobs() {
  const jobs = getEncodingJobsList();
  recordingState = {
    ...recordingState,
    encodingJobs: jobs,
    encodingCount: jobs.length,
  };
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("recording:state", recordingState);
    dashboardWindow.webContents.send("recording:encoding", { jobs });
  }
  refreshTrayMenu();
}

function beginEncodingJob(meta = {}) {
  const id = `enc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const job = {
    id,
    pending: true,
    name: "Encoding clip…",
    status: "encoding",
    startedAt: Date.now(),
    elapsedMs: meta?.elapsedMs ?? meta?.debug?.elapsedMs ?? null,
    hasAudio: Boolean(meta?.debug?.capture?.hasAudio),
  };
  encodingJobs.set(id, job);
  broadcastEncodingJobs();
  broadcastRecordingsUpdated({ encoding: id });
  return id;
}

function finishEncodingJob(id, result = {}) {
  if (id && encodingJobs.has(id)) encodingJobs.delete(id);
  broadcastEncodingJobs();
  if (result?.saved) {
    broadcastRecordingsUpdated({ saved: result.saved, meta: result.meta });
  } else if (result?.failed) {
    broadcastRecordingsUpdated({ encodingFailed: id, message: result.message });
  } else {
    broadcastRecordingsUpdated({ encodingDone: id });
  }
}

function overlayOuterSize(s = settings) {
  const is3dFx =
    String(s.borderEffect) === "dragon" ||
    String(s.borderEffect) === "dinosaur";
  const distOut = is3dFx
    ? Math.max(0, Number(s.borderEffectDistance) || 0)
    : 0;
  const fxExtra = is3dFx
    ? 32 + Math.round(distOut * 0.7)
    : s.borderEffect && String(s.borderEffect) !== "none"
      ? 16
      : 0;
  const pad = Math.ceil(s.borderGlow + s.borderWidth + 10 + fxExtra);
  const core = s.mapSize;
  let width = core + pad * 2;
  let height = s.showChrome ? core + pad * 2 + 72 : core + pad * 2;
  // Stone frame uses content-box padding around a square radar
  if (
    String(s.borderStyle) === "isle-evrima" ||
    String(s.borderStyle) === "primal-pinas"
  ) {
    const padRatio = Number(s.framePad);
    const side = Math.ceil(core * (Number.isFinite(padRatio) ? padRatio : 0.26));
    const scale = Number(s.frameScale) || 1.49;
    const top = Math.ceil(core * Math.max(0.16, (scale - 1) * 0.45));
    const bottom = Math.ceil(core * Math.max(0.28, (scale - 1) * 0.7));
    width = core + side * 2 + 8 + fxExtra * 2;
    height = core + top + bottom + 8 + fxExtra * 2 + (s.showChrome ? 72 : 0);
  }
  return { width, height, pad };
}

function getGameWindowCenter() {
  const api = loadWin32();
  if (!api?.GetWindowRect) return null;
  const gameHwnd = findIsleGameWindow();
  if (!gameHwnd) return null;
  try {
    const buf = Buffer.alloc(16);
    if (!api.GetWindowRect(gameHwnd, buf)) return null;
    const left = buf.readInt32LE(0);
    const top = buf.readInt32LE(4);
    const right = buf.readInt32LE(8);
    const bottom = buf.readInt32LE(12);
    if (right <= left || bottom <= top) return null;
    return {
      x: Math.round((left + right) / 2),
      y: Math.round((top + bottom) / 2),
    };
  } catch {
    return null;
  }
}

function listOverlayDisplays() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().map((d, index) => ({
    id: String(d.id),
    label: d.label || `Monitor ${index + 1}`,
    primary: d.id === primary.id,
    width: d.size.width,
    height: d.size.height,
    scaleFactor: d.scaleFactor,
  }));
}

function resolveOverlayDisplay(s = settings) {
  const primary = screen.getPrimaryDisplay();
  const mode = String(s?.overlayDisplay || "primary");
  if (mode === "game") {
    const center = getGameWindowCenter();
    if (center) return screen.getDisplayNearestPoint(center);
    return primary;
  }
  if (mode !== "primary") {
    const id = Number(mode);
    if (Number.isFinite(id)) {
      const found = screen.getAllDisplays().find((d) => d.id === id);
      if (found) return found;
    }
  }
  return primary;
}

let lastPlacedDisplayId = null;

function placeOverlayWindow(s = settings) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = overlayOuterSize(s);
  const display = resolveOverlayDisplay(s);
  const area = display.workArea;
  lastPlacedDisplayId = display.id;
  const margin = 20;
  let x = area.x + area.width - width - margin;
  let y = area.y + margin;
  if (s.position === "top-left") {
    x = area.x + margin;
    y = area.y + margin;
  } else if (s.position === "bottom-right") {
    x = area.x + area.width - width - margin;
    y = area.y + area.height - height - margin;
  } else if (s.position === "bottom-left") {
    x = area.x + margin;
    y = area.y + area.height - height - margin;
  }
  mainWindow.setMinimumSize(180, 180);
  mainWindow.setSize(width, height);
  mainWindow.setPosition(Math.round(x), Math.round(y));
}

function maybeFollowGameDisplay() {
  if (!settings || String(settings.overlayDisplay) !== "game") return;
  const display = resolveOverlayDisplay(settings);
  if (display.id === lastPlacedDisplayId) return;
  placeOverlayWindow(settings);
}

function broadcastDisplays() {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
  dashboardWindow.webContents.send("dashboard:displays", listOverlayDisplays());
}

function broadcastSettings() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("settings:updated", settings);
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("settings:updated", settings);
  }
}

function applyWindowOpacity(s = settings) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const opacity = Number(s.windowOpacity);
  mainWindow.setOpacity(
    Number.isFinite(opacity) ? Math.min(1, Math.max(0.15, opacity)) : 1
  );
}

function hotkeySnapshot(s) {
  const out = {};
  for (const key of HOTKEY_KEYS) out[key] = s[key];
  return out;
}

function hotkeysChanged(prev, next) {
  return HOTKEY_KEYS.some((key) => prev[key] !== next[key]);
}

function applySettings(partial) {
  const prevHotkeys = hotkeySnapshot(settings);
  const prevRequireFocus = settings.requireGameFocus !== false;
  const prevLocMethod = settings.locationMethod || "clipboard";
  const prevMapCode = settings.primalPinasMapCode || "";
  const prevLiveServer = settings.liveMapServer || "primal-pinas";
  const prevBosch = Boolean(settings.boschIslandConnected);
  settings = saveSettings({ ...settings, ...partial });
  placeOverlayWindow(settings);
  applyWindowOpacity(settings);
  try {
    groupSync.updateConfigFromSettings(settings);
  } catch (err) {
    console.warn("[group] settings update", err);
  }
  broadcastSettings();
  if ((settings.requireGameFocus !== false) !== prevRequireFocus) {
    if (settings.requireGameFocus === false) {
      detachFromGameWindow();
    }
    syncOverlayToGameFocus();
  } else {
    keepAboveGame(true);
  }
  if (hotkeysChanged(prevHotkeys, settings)) {
    registerHotkeys();
  }
  if (
    prevLocMethod !== (settings.locationMethod || "clipboard") ||
    prevMapCode !== (settings.primalPinasMapCode || "") ||
    prevLiveServer !== (settings.liveMapServer || "primal-pinas") ||
    prevBosch !== Boolean(settings.boschIslandConnected)
  ) {
    syncLocationProviders();
  }
  // Changing strategy / clearing a Primal code can invalidate Show map
  if (!isLocationSetupReady(settings) && !userHidden) {
    userHidden = true;
    gameFocusHideTicks = 0;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    broadcastOverlayVisibility();
  }
  return settings;
}

const PLACE_FILTER_CYCLE = [
  "all",
  "waters",
  "areas",
  "landmarks",
  "wallows",
  "sanctuaries",
];
const PLACE_FILTER_LABELS = {
  all: "All places",
  waters: "Water only",
  areas: "Areas only",
  landmarks: "Landmarks only",
  wallows: "Wallows only",
  sanctuaries: "Sanctuaries only",
};

function cyclePlaceFilter() {
  const cur = settings.placeFilter || "all";
  const idx = PLACE_FILTER_CYCLE.indexOf(cur);
  const next = PLACE_FILTER_CYCLE[(idx + 1) % PLACE_FILTER_CYCLE.length];
  applySettings({ placeFilter: next });
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(
      "overlay:toast",
      `Filter: ${PLACE_FILTER_LABELS[next] || next}`
    );
  }
}

function loadWin32() {
  if (process.platform !== "win32") return null;
  if (win32 !== undefined) return win32;

  try {
    koffiRef = require("koffi");
    const user32 = koffiRef.load("user32.dll");
    let dwmapi = null;
    try {
      dwmapi = koffiRef.load("dwmapi.dll");
    } catch {
      dwmapi = null;
    }

    const EnumWindowsProc = koffiRef.proto(
      "int __stdcall EnumWindowsProc(void *hwnd, intptr lParam)"
    );

    win32 = {
      SetWindowPos: user32.func(
        "int __stdcall SetWindowPos(void *hWnd, void *hWndInsertAfter, int X, int Y, int cx, int cy, uint32 uFlags)"
      ),
      GetWindowLongPtrW: user32.func(
        "intptr __stdcall GetWindowLongPtrW(void *hWnd, int nIndex)"
      ),
      SetWindowLongPtrW: user32.func(
        "intptr __stdcall SetWindowLongPtrW(void *hWnd, int nIndex, intptr dwNewLong)"
      ),
      GetForegroundWindow: user32.func("void * __stdcall GetForegroundWindow()"),
      IsWindow: user32.func("int __stdcall IsWindow(void *hWnd)"),
      IsWindowVisible: user32.func("int __stdcall IsWindowVisible(void *hWnd)"),
      GetWindowTextW: user32.func(
        "int __stdcall GetWindowTextW(void *hWnd, void *lpString, int nMaxCount)"
      ),
      GetWindowRect: user32.func(
        "int __stdcall GetWindowRect(void *hWnd, void *lpRect)"
      ),
      FindWindowW: user32.func(
        "void * __stdcall FindWindowW(void *lpClassName, str16 lpWindowName)"
      ),
      EnumWindows: user32.func(
        "int __stdcall EnumWindows(EnumWindowsProc *lpEnumFunc, intptr lParam)"
      ),
      EnumWindowsProc,
      DwmSetWindowAttribute: dwmapi
        ? dwmapi.func(
            "long __stdcall DwmSetWindowAttribute(void *hwnd, uint32 dwAttribute, void *pvAttribute, uint32 cbAttribute)"
          )
        : null,
      // HWND_TOPMOST=-1, HWND_NOTOPMOST=-2 — pass as numbers
      HWND_TOPMOST: -1,
      HWND_NOTOPMOST: -2,
      GWL_STYLE: -16,
      GWLP_HWNDPARENT: -8,
      GWL_EXSTYLE: -20,
      // Native caption / border bits that DWM sometimes restores on transparent overlays
      WS_POPUP: 0x80000000,
      WS_BORDER: 0x00800000,
      WS_DLGFRAME: 0x00400000,
      WS_CAPTION: 0x00c00000,
      WS_SYSMENU: 0x00080000,
      WS_THICKFRAME: 0x00040000,
      WS_MINIMIZEBOX: 0x00020000,
      WS_MAXIMIZEBOX: 0x00010000,
      WS_EX_NOACTIVATE: 0x08000000,
      WS_EX_TRANSPARENT: 0x00000020,
      WS_EX_TOOLWINDOW: 0x00000080,
      WS_EX_WINDOWEDGE: 0x00000100,
      WS_EX_CLIENTEDGE: 0x00000200,
      WS_EX_DLGMODALFRAME: 0x00000001,
      WS_EX_STATICEDGE: 0x00020000,
      // DWMWA_NCRENDERING_POLICY = 2, DWMNCRP_DISABLED = 1
      DWMWA_NCRENDERING_POLICY: 2,
      DWMNCRP_DISABLED: 1,
      // DWMWA_WINDOW_CORNER_PREFERENCE = 33, DWMWCP_DONOTROUND = 1
      DWMWA_WINDOW_CORNER_PREFERENCE: 33,
      DWMWCP_DONOTROUND: 1,
      // NOSIZE | NOMOVE | NOACTIVATE | FRAMECHANGED
      SWP_REAPPLY: 0x0001 | 0x0002 | 0x0010 | 0x0020,
      // NOSIZE | NOMOVE | NOACTIVATE | SHOWWINDOW
      SWP_TOPMOST: 0x0001 | 0x0002 | 0x0010 | 0x0040,
    };
    return win32;
  } catch (err) {
    console.warn("[win32] unavailable, using Electron-only topmost", err);
    win32 = null;
    return null;
  }
}

function hwndOf(win) {
  return win.getNativeWindowHandle();
}

/** @returns {bigint} */
function hwndToInt(hwnd) {
  if (hwnd == null || hwnd === 0) return 0n;
  if (typeof hwnd === "bigint") return hwnd;
  if (typeof hwnd === "number") return BigInt(hwnd >>> 0);
  if (Buffer.isBuffer(hwnd)) {
    return hwnd.length >= 8
      ? hwnd.readBigUInt64LE(0)
      : BigInt(hwnd.readUInt32LE(0));
  }
  // koffi External handles
  if (koffiRef && typeof hwnd === "object") {
    try {
      return koffiRef.address(hwnd);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function readWindowTitle(api, hwnd) {
  const buf = Buffer.alloc(512);
  const len = api.GetWindowTextW(hwnd, buf, 256);
  if (!len) return "";
  return buf.toString("utf16le", 0, len * 2).replace(/\0+$/, "");
}

function findIsleGameWindow() {
  const api = loadWin32();
  if (!api || !koffiRef) return null;

  // Fast path: known titles (Evrima uses "TheIsle")
  for (const title of ["TheIsle", "The Isle", "TheIsle "]) {
    try {
      const direct = api.FindWindowW(null, title);
      if (direct && api.IsWindow(direct) && api.IsWindowVisible(direct)) {
        return direct;
      }
    } catch {
      // try next
    }
  }

  let found = null;
  const callback = koffiRef.register((hwnd, _lParam) => {
    try {
      if (!api.IsWindowVisible(hwnd)) return 1;
      const title = readWindowTitle(api, hwnd);
      if (title && GAME_TITLE_RE.test(title)) {
        found = hwnd;
        return 0; // stop
      }
    } catch {
      // keep enumerating
    }
    return 1;
  }, koffiRef.pointer(api.EnumWindowsProc));

  try {
    api.EnumWindows(callback, 0);
  } finally {
    try {
      koffiRef.unregister(callback);
    } catch {
      // ignore
    }
  }
  return found;
}

/**
 * True when The Isle is the foreground app (or the overlay is focused in Map mode).
 * Map stays off for desktop, browsers, Discord, Control Center, etc.
 */
function isForegroundIsleSession() {
  const api = loadWin32();
  if (!api) {
    // Non-Windows: no reliable game focus probe — leave visibility to the user.
    return true;
  }

  const gameHwnd = findIsleGameWindow();
  if (!gameHwnd) return false;

  let fg;
  try {
    fg = api.GetForegroundWindow();
  } catch {
    return false;
  }
  if (!fg || !api.IsWindow(fg)) return false;

  const fgId = hwndToInt(fg);
  if (!fgId) return false;
  if (fgId === hwndToInt(gameHwnd)) return true;

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (fgId === hwndToInt(hwndOf(mainWindow))) return true;
    } catch {
      // ignore
    }
  }

  // Fallback: title match (some builds use a different top-level HWND)
  try {
    const title = readWindowTitle(api, fg);
    if (title && GAME_TITLE_RE.test(title)) return true;
  } catch {
    // ignore
  }

  return false;
}

/** Whether the enabled map is allowed to paint right now. */
function mayShowOverlayNow() {
  if (settings?.requireGameFocus === false) return true;
  return isForegroundIsleSession();
}

/** Own the overlay by the game HWND so Windows keeps us above it while playing. */
function attachToGameWindow(gameHwnd) {
  const api = loadWin32();
  if (!api || !mainWindow || mainWindow.isDestroyed() || !gameHwnd) return false;

  try {
    const gameId = hwndToInt(gameHwnd);
    if (!gameId) return false;
    if (attachedGameHwnd && hwndToInt(attachedGameHwnd) === gameId) {
      return true;
    }

    const overlayHwnd = hwndOf(mainWindow);
    api.SetWindowLongPtrW(overlayHwnd, api.GWLP_HWNDPARENT, gameId);
    attachedGameHwnd = gameHwnd;
    // Parenting can restore a native caption strip — strip it (and again shortly after)
    stripOverlayCaptionSoon(overlayHwnd);
    console.log("[overlay] attached to game window", gameId.toString(16));
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("overlay:toast", "Attached to The Isle");
    }
    return true;
  } catch (err) {
    console.warn("[overlay] attach failed", err);
    return false;
  }
}

/** Unparent from The Isle so the map can stay visible on the desktop. */
function detachFromGameWindow() {
  if (!attachedGameHwnd) return;
  const prev = attachedGameHwnd;
  attachedGameHwnd = null;
  const api = loadWin32();
  if (!api || !mainWindow || mainWindow.isDestroyed()) return;
  try {
    const overlayHwnd = hwndOf(mainWindow);
    api.SetWindowLongPtrW(overlayHwnd, api.GWLP_HWNDPARENT, 0);
    stripOverlayCaptionSoon(overlayHwnd);
    console.log(
      "[overlay] detached from game window",
      hwndToInt(prev)?.toString(16) || ""
    );
  } catch (err) {
    console.warn("[overlay] detach failed", err);
  }
}

/**
 * Re-pin above the game without activating.
 * Games often steal HWND_TOPMOST on the first WASD/mouse input — toggle fixes it.
 */
function keepAboveGame(forceToggle = false) {
  if (!mainWindow || mainWindow.isDestroyed() || userHidden) return;
  // With game-focus mode: never force-show over the desktop
  if (settings?.requireGameFocus !== false && !isForegroundIsleSession()) return;

  if (!mainWindow.isVisible()) {
    mainWindow.showInactive();
  }

  const api = loadWin32();
  const gameHwnd = findIsleGameWindow();
  // Parenting to the game hides the overlay when the game is minimized /
  // in the background — only attach when "only while The Isle is active" is on.
  if (settings?.requireGameFocus === false) {
    detachFromGameWindow();
  } else if (gameHwnd) {
    attachToGameWindow(gameHwnd);
  } else {
    detachFromGameWindow();
  }

  try {
    mainWindow.setAlwaysOnTop(true, TOP_LEVEL);
  } catch {
    // ignore
  }

  if (!api) return;

  try {
    const overlayHwnd = hwndOf(mainWindow);
    const fg = api.GetForegroundWindow();
    const gameIsForeground =
      gameHwnd && fg && hwndToInt(fg) !== 0n && hwndToInt(fg) === hwndToInt(gameHwnd);

    // When the game is focused (moving/typing), force a topmost refresh.
    // Also refresh when floating freely (requireGameFocus off).
    if (
      forceToggle ||
      gameIsForeground ||
      settings?.requireGameFocus === false
    ) {
      api.SetWindowPos(
        overlayHwnd,
        api.HWND_NOTOPMOST,
        0,
        0,
        0,
        0,
        api.SWP_TOPMOST
      );
      api.SetWindowPos(
        overlayHwnd,
        api.HWND_TOPMOST,
        0,
        0,
        0,
        0,
        api.SWP_TOPMOST
      );
    } else {
      api.SetWindowPos(
        overlayHwnd,
        api.HWND_TOPMOST,
        0,
        0,
        0,
        0,
        api.SWP_TOPMOST
      );
    }
    stripOverlayCaption(overlayHwnd);
  } catch (err) {
    console.warn("[overlay] keepAboveGame", err);
  }
}

/**
 * Kill the intermittent Windows caption / title-bar strip on the frameless overlay.
 * DWM sometimes paints WS_CAPTION after focus, parenting, or style toggles —
 * that shows up as a solid white/light rectangle across the top of the radar.
 */
function stripOverlayCaption(hwnd = null) {
  if (process.platform !== "win32") return;
  const api = loadWin32();
  if (!api || !mainWindow || mainWindow.isDestroyed()) return;
  const target = hwnd || hwndOf(mainWindow);
  if (!target) return;

  try {
    let style = Number(api.GetWindowLongPtrW(target, api.GWL_STYLE));
    if (!Number.isFinite(style)) style = 0;
    const styleMask =
      api.WS_CAPTION |
      api.WS_THICKFRAME |
      api.WS_BORDER |
      api.WS_DLGFRAME |
      api.WS_SYSMENU |
      api.WS_MINIMIZEBOX |
      api.WS_MAXIMIZEBOX;
    // Keep popup so Win11 doesn't reintroduce a caption chrome strip
    let nextStyle = (style & ~styleMask) | api.WS_POPUP;
    if (nextStyle !== style) {
      api.SetWindowLongPtrW(target, api.GWL_STYLE, nextStyle);
    }

    let ex = Number(api.GetWindowLongPtrW(target, api.GWL_EXSTYLE));
    if (!Number.isFinite(ex)) ex = 0;
    const exMask =
      api.WS_EX_WINDOWEDGE |
      api.WS_EX_CLIENTEDGE |
      api.WS_EX_DLGMODALFRAME |
      api.WS_EX_STATICEDGE;
    let nextEx = (ex | api.WS_EX_TOOLWINDOW) & ~exMask;
    if (nextEx !== ex) {
      api.SetWindowLongPtrW(target, api.GWL_EXSTYLE, nextEx);
    }

    // Stop DWM from painting non-client caption / rounded chrome
    if (api.DwmSetWindowAttribute && koffiRef) {
      try {
        const ncPolicy = Buffer.alloc(4);
        ncPolicy.writeInt32LE(api.DWMNCRP_DISABLED, 0);
        api.DwmSetWindowAttribute(
          target,
          api.DWMWA_NCRENDERING_POLICY,
          ncPolicy,
          4
        );
        const corners = Buffer.alloc(4);
        corners.writeInt32LE(api.DWMWCP_DONOTROUND, 0);
        api.DwmSetWindowAttribute(
          target,
          api.DWMWA_WINDOW_CORNER_PREFERENCE,
          corners,
          4
        );
      } catch {
        // older Windows builds may reject some attributes
      }
    }

    api.SetWindowPos(target, api.HWND_TOPMOST, 0, 0, 0, 0, api.SWP_REAPPLY);

    try {
      mainWindow.setBackgroundColor("#00000000");
      mainWindow.setTitle("");
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn("[win32] stripOverlayCaption", err);
  }
}

/** DWM often restores the caption a few frames after attach/show — re-strip shortly after. */
function stripOverlayCaptionSoon(hwnd = null) {
  stripOverlayCaption(hwnd);
  for (const ms of [16, 50, 120, 300, 800]) {
    setTimeout(() => stripOverlayCaption(hwnd), ms);
  }
}

/**
 * Play mode: OS-level click-through + no-activate so WASD/mouse stay in-game.
 * Interact mode: normal window so the map can be zoomed/dragged.
 */
function applyPlayInputMode(playMode) {
  clickThrough = playMode;
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (playMode) {
    mainWindow.setFocusable(false);
    mainWindow.setIgnoreMouseEvents(true);

    const api = loadWin32();
    if (api) {
      try {
        const hwnd = hwndOf(mainWindow);
        stripOverlayCaption(hwnd);
        let ex = Number(api.GetWindowLongPtrW(hwnd, api.GWL_EXSTYLE));
        if (!Number.isFinite(ex)) ex = 0;
        ex |= api.WS_EX_NOACTIVATE | api.WS_EX_TRANSPARENT | api.WS_EX_TOOLWINDOW;
        api.SetWindowLongPtrW(hwnd, api.GWL_EXSTYLE, ex);
        api.SetWindowPos(hwnd, api.HWND_TOPMOST, 0, 0, 0, 0, api.SWP_REAPPLY);
      } catch (err) {
        console.warn("[win32 play mode]", err);
      }
    }
    keepAboveGame(true);
  } else {
    const api = loadWin32();
    if (api) {
      try {
        const hwnd = hwndOf(mainWindow);
        stripOverlayCaption(hwnd);
        let ex = Number(api.GetWindowLongPtrW(hwnd, api.GWL_EXSTYLE));
        if (!Number.isFinite(ex)) ex = 0;
        ex &= ~api.WS_EX_NOACTIVATE;
        ex &= ~api.WS_EX_TRANSPARENT;
        ex |= api.WS_EX_TOOLWINDOW;
        api.SetWindowLongPtrW(hwnd, api.GWL_EXSTYLE, ex);
        api.SetWindowPos(hwnd, api.HWND_TOPMOST, 0, 0, 0, 0, api.SWP_REAPPLY);
      } catch (err) {
        console.warn("[win32 map mode]", err);
      }
    }
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setFocusable(true);
    mainWindow.focus();
  }

  mainWindow.webContents.send("overlay:click-through", playMode);
}

/** User turned the map on (may still be waiting for The Isle focus). */
function isOverlayEnabled() {
  return !userHidden && !isForceUpdateRequired();
}

function getOverlayVisibilityState() {
  const enabled = isOverlayEnabled();
  const visible = Boolean(
    enabled &&
      mainWindow &&
      !mainWindow.isDestroyed() &&
      mainWindow.isVisible()
  );
  const requireGameFocus = settings?.requireGameFocus !== false;
  const setupReady = isLocationSetupReady(settings);
  return {
    enabled,
    visible,
    waitingForGame: enabled && !visible && requireGameFocus,
    requireGameFocus,
    setupReady,
    locationMethod: settings?.locationMethod || "clipboard",
  };
}

function notifyNeedLocationSetup() {
  openDashboard();
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("dashboard:need-location-setup");
  }
}

/** @deprecated Prefer getOverlayVisibilityState — true means map is enabled */
function isOverlayVisible() {
  return isOverlayEnabled();
}

function broadcastOverlayVisibility() {
  const state = getOverlayVisibilityState();
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("overlay:visibility", state);
  }
  refreshTrayMenu();
  return state;
}

/**
 * Show the overlay while enabled.
 * When requireGameFocus is on, hide across Alt-Tab until The Isle is focused again.
 */
function syncOverlayToGameFocus() {
  if (!mainWindow || mainWindow.isDestroyed()) return getOverlayVisibilityState();

  if (!isOverlayEnabled()) {
    gameFocusHideTicks = 0;
    if (mainWindow.isVisible()) mainWindow.hide();
    return broadcastOverlayVisibility();
  }

  if (mayShowOverlayNow()) {
    gameFocusHideTicks = 0;
    const wasHidden = !mainWindow.isVisible();
    if (wasHidden) {
      mainWindow.showInactive();
      stripOverlayCaption();
    }
    keepAboveGame(wasHidden);
    if (wasHidden) return broadcastOverlayVisibility();
    return getOverlayVisibilityState();
  }

  gameFocusHideTicks += 1;
  if (gameFocusHideTicks >= GAME_FOCUS_HIDE_TICKS && mainWindow.isVisible()) {
    mainWindow.hide();
    return broadcastOverlayVisibility();
  }
  return getOverlayVisibilityState();
}

function setOverlayVisible(visible) {
  if (visible && isForceUpdateRequired()) {
    // Block map while a mandatory update is pending
    openDashboard();
    userHidden = true;
    gameFocusHideTicks = 0;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    return broadcastOverlayVisibility();
  }

  if (visible && !isLocationSetupReady(settings)) {
    notifyNeedLocationSetup();
    userHidden = true;
    gameFocusHideTicks = 0;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    return {
      ...broadcastOverlayVisibility(),
      blockedBySetup: true,
    };
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    if (visible) createWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return {
        enabled: false,
        visible: false,
        waitingForGame: false,
        requireGameFocus: settings?.requireGameFocus !== false,
        setupReady: isLocationSetupReady(settings),
      };
    }
  }

  if (visible) {
    userHidden = false;
    gameFocusHideTicks = 0;
    applyPlayInputMode(true);
    stripOverlayCaption();
    if (mayShowOverlayNow()) {
      mainWindow.showInactive();
      keepAboveGame(true);
    } else {
      mainWindow.hide();
    }
  } else {
    userHidden = true;
    gameFocusHideTicks = 0;
    mainWindow.hide();
  }
  return broadcastOverlayVisibility();
}

function trayIconImage() {
  const candidates = [
    path.join(__dirname, "..", "build", "tray.png"),
    APP_ICON,
    path.join(__dirname, "..", "src", "assets", "islemap-icon.png"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      let img = nativeImage.createFromPath(file);
      if (img.isEmpty()) continue;
      const { width, height } = img.getSize();
      if (width > 32 || height > 32) {
        img = img.resize({ width: 32, height: 32, quality: "best" });
      }
      return img;
    } catch {
      // try next
    }
  }
  // 16×16 IsleMap-green square fallback (visible in the Windows tray)
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVQ4T2NkYGD4z0ABYBzVMKoBBgPGsWqA0YBxVKMGqAEjVQMA6z8BBQeYlG0AAAAASUVORK5CYII=",
    "base64"
  );
  return nativeImage.createFromBuffer(png);
}

function refreshTrayMenu() {
  if (!tray) return;
  const state = getOverlayVisibilityState();
  const forced = isForceUpdateRequired();
  const template = [
    {
      label: forced ? "Open Control Center (update required)" : "Open Control Center",
      click: () => openDashboard(),
    },
    {
      label: state.enabled ? "Hide map" : "Show map",
      enabled: !forced,
      click: () => setOverlayVisible(!isOverlayEnabled()),
    },
    {
      label: "Screenshots",
      enabled: !forced,
      submenu: [
        {
          label: "Capture map",
          click: () => {
            void takeScreenshot("map");
          },
        },
        {
          label: "Capture screen",
          click: () => {
            void takeScreenshot("screen");
          },
        },
        { type: "separator" },
        {
          label: "Open folder",
          click: () => {
            const dir = screenshotsDir();
            fs.mkdirSync(dir, { recursive: true });
            shell.openPath(dir).catch(() => {});
          },
        },
      ],
    },
    {
      label:
        getEncodingJobsList().length > 0
          ? `Screen recording (${getEncodingJobsList().length} encoding…)`
          : "Screen recording",
      enabled: !forced,
      submenu: [
        {
          label: "Start / Stop",
          enabled: true,
          click: () => sendRecordingCommand("toggle-record"),
        },
        {
          label: "Pause / Play",
          enabled:
            recordingState?.state === "recording" ||
            recordingState?.state === "paused",
          click: () => sendRecordingCommand("toggle-pause"),
        },
        { type: "separator" },
        {
          label: "Open folder",
          click: () => {
            void openRecordingsFolder();
          },
        },
      ],
    },
    { type: "separator" },
    {
      label: "Quit IsleMap",
      click: () => {
        isQuitting = true;
        userHidden = true;
        app.quit();
      },
    },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip(
    forced
      ? "IsleMap — update required"
      : state.visible
        ? "IsleMap — map over The Isle"
        : state.waitingForGame
          ? "IsleMap — waiting for The Isle"
          : "IsleMap — map hidden"
  );
}

function createTray() {
  if (tray) return tray;
  try {
    const icon = trayIconImage();
    tray = new Tray(icon);
    tray.setToolTip("IsleMap — running in background");
    tray.on("click", () => openDashboard());
    tray.on("double-click", () => openDashboard());
    refreshTrayMenu();
    console.log("[tray] IsleMap tray icon ready");
  } catch (err) {
    console.error("[tray] failed to create tray icon", err);
    tray = null;
  }
  return tray;
}

function hideDashboardToTray() {
  // Keep Control Center open while a mandatory update is pending
  if (isForceUpdateRequired()) {
    openDashboard();
    return;
  }
  createTray();
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.hide();
  }
  if (!toldAboutTray && tray) {
    toldAboutTray = true;
    try {
      tray.displayBalloon({
        title: "IsleMap is still running",
        content:
          "Control Center was closed. Use this tray icon to reopen it, show/hide the map, or quit.",
        icon: trayIconImage(),
      });
    } catch {
      // balloon optional
    }
  }
}

function createWindow() {
  const { width, height } = overlayOuterSize(settings);

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 180,
    minHeight: 180,
    title: "",
    icon: APP_ICON,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    focusable: false,
    show: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    // Avoid Win11 rounded-corner non-client chrome on the overlay
    ...(process.platform === "win32" ? { roundedCorners: false, type: "toolbar" } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.setTitle("");
  try {
    mainWindow.setMenu(null);
    mainWindow.removeMenu();
  } catch {
    /* older Electron */
  }
  placeOverlayWindow(settings);
  mainWindow.setAlwaysOnTop(true, TOP_LEVEL);
  applyWindowOpacity(settings);
  mainWindow.setBackgroundColor("#00000000");
  stripOverlayCaption();

  mainWindow.once("ready-to-show", () => {
    // Prepare styles but keep hidden until Show map
    stripOverlayCaptionSoon();
    applyWindowOpacity(settings);
    applyPlayInputMode(true);
    stripOverlayCaptionSoon();
    broadcastOverlayVisibility();
  });

  mainWindow.on("show", () => {
    stripOverlayCaptionSoon();
  });

  mainWindow.on("blur", () => {
    setTimeout(() => {
      stripOverlayCaptionSoon();
      keepAboveGame(true);
    }, 30);
  });

  mainWindow.on("focus", () => {
    stripOverlayCaptionSoon();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    attachedGameHwnd = null;
  });

  mainWindow.webContents.on("console-message", (_e, level, message, line, sourceId) => {
    const tag = ["VERBOSE", "INFO", "WARN", "ERROR"][level] || String(level);
    console.log(`[renderer:${tag}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.loadFile(path.join(__dirname, "..", "src", "index.html"));

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.setBackgroundThrottling(false);
    mainWindow.webContents.send("settings:updated", settings);
    applyPlayInputMode(true);
    if (!userHidden) keepAboveGame(true);
    // Dev-only: give the overlay an active pin without Copy Location
    // Skip when Primal Pinas live tracking is on — dummy would freeze the pin.
    if (
      IS_DEV &&
      process.env.ISLEMAP_NO_DUMMY !== "1" &&
      !primalPinasPollEnabled()
    ) {
      setTimeout(
        () => injectDevDummyLocation(lastDevDummy || DEV_DUMMY_DEFAULT),
        250
      );
    }
  });
}

function injectDevDummyLocation(raw) {
  if (!IS_DEV) return { ok: false, reason: "not-dev" };
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, reason: "no-overlay" };
  }
  const x = Number(raw?.x);
  const y = Number(raw?.y);
  const z = Number(raw?.z);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, reason: "bad-coords" };
  }
  const coords = {
    x,
    y,
    z: Number.isFinite(z) ? z : 0,
    source: "dev-dummy",
  };
  lastDevDummy = {
    x: coords.x,
    y: coords.y,
    z: coords.z,
    label: raw?.label ? String(raw.label) : undefined,
  };
  publishPlayerLocation(coords);
  mainWindow.webContents.send(
    "overlay:toast",
    `DEV pin · ${lastDevDummy.label || `${Math.round(x)}, ${Math.round(y)}`}`
  );
  console.log(
    `[dev] dummy location ${coords.x}, ${coords.y}, ${coords.z}` +
      (lastDevDummy.label ? ` (${lastDevDummy.label})` : "")
  );
  return { ok: true, coords: lastDevDummy };
}

function publishPlayerLocation(coords) {
  if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
  lastPlayerLocation = {
    x: coords.x,
    y: coords.y,
    z: Number.isFinite(coords.z) ? coords.z : 0,
    source: coords.source || "unknown",
  };
  if (Number.isFinite(coords.yaw)) {
    lastPlayerLocation.yaw = coords.yaw;
  }
  if (coords.name) lastPlayerLocation.name = coords.name;
  if (coords.class) lastPlayerLocation.class = coords.class;
  if (Number.isFinite(Number(coords.growth))) {
    lastPlayerLocation.growth = Number(coords.growth);
  }
  if (coords.predicted) lastPlayerLocation.predicted = true;
  else delete lastPlayerLocation.predicted;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("overlay:location", lastPlayerLocation);
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("dashboard:location", lastPlayerLocation);
  }
  try {
    groupSync.publishLocation(lastPlayerLocation);
  } catch (err) {
    console.warn("[group] publishLocation", err);
  }
}

function enrichPrimalStatus(status) {
  const base = status || primalPinasLocation.getStatus() || {};
  const roster = primalPinasClasses.getRoster();
  const player = base.player || null;
  const asset = player ? primalPinasClasses.enrichPlayer(player) : null;
  return {
    ...base,
    asset,
    roster: {
      players: roster.players,
      connected: roster.connected,
      ts: roster.ts,
      classes: roster.classes || [],
    },
  };
}

function broadcastPrimalPinasStatus(status) {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send(
      "dashboard:primal-pinas-status",
      enrichPrimalStatus(status)
    );
  }
  broadcastLiveLinkStatus();
}

/**
 * Overlay border cue for live-map servers (Primal / Bosch):
 * ok | reconnecting (yellow pulse) | attention (red) | off
 */
function deriveLiveLinkStatus() {
  if (!liveMapEnabled()) {
    return { state: "off", provider: null, message: "" };
  }
  const provider = activeLiveMapServer();
  if (provider === "bosch-island") {
    const s = boschIslandLocation.getStatus() || {};
    const st = String(s.state || "off");
    const msg = String(s.message || "");
    if (st === "ok" || st === "waiting") {
      return { state: "ok", provider, message: msg };
    }
    if (st === "connecting") {
      return { state: "reconnecting", provider, message: msg || "Connecting…" };
    }
    if (st === "error") {
      const m = msg.toLowerCase();
      const transient =
        m.includes("rate") ||
        m.includes("429") ||
        m.includes("retry") ||
        m.includes("cloudflare") ||
        m.includes("blocked") ||
        m.includes("poll failed");
      return {
        state: transient ? "reconnecting" : "attention",
        provider,
        message: msg,
      };
    }
    return {
      state: "attention",
      provider,
      message: msg || "Bosch Island needs attention",
    };
  }

  const s = primalPinasLocation.getStatus() || {};
  const st = String(s.state || "off");
  const msg = String(s.message || "");
  if (st === "ok") {
    return { state: "ok", provider: "primal-pinas", message: msg };
  }
  if (st === "locating" || st === "not_spawned") {
    return {
      state: "reconnecting",
      provider: "primal-pinas",
      message: msg || "Locating…",
    };
  }
  return {
    state: "attention",
    provider: "primal-pinas",
    message: msg || "Primal Pinas needs attention",
  };
}

function broadcastLiveLinkStatus(status) {
  const payload = status || deriveLiveLinkStatus();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("overlay:live-link-status", payload);
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("dashboard:live-link-status", payload);
  }
}

/** Last Asset Location publish — dual mode prefers this XY over lagged Primal */
let lastClipboardPublishAt = 0;
const CLIPBOARD_XY_HOLD_MS = 45000;
/** @type {{ x: number, y: number, z: number, at: number } | null} */
let lastBoschRawWorld = null;

function clipboardXyIsFresh() {
  return (
    clipboardPollEnabled() &&
    lastClipboardPublishAt > 0 &&
    Date.now() - lastClipboardPublishAt < CLIPBOARD_XY_HOLD_MS &&
    lastPlayerLocation &&
    Number.isFinite(lastPlayerLocation.x) &&
    Number.isFinite(lastPlayerLocation.y) &&
    lastPlayerLocation.source !== "primal-pinas" &&
    lastPlayerLocation.source !== "bosch-island"
  );
}

function publishPrimalPinasLocation(raw) {
  if (!raw) return;
  // Dual mode: fresh Asset Location wins for X/Y; Primal still supplies live yaw.
  if (clipboardXyIsFresh()) {
    publishPlayerLocation({
      x: lastPlayerLocation.x,
      y: lastPlayerLocation.y,
      z: Number.isFinite(lastPlayerLocation.z) ? lastPlayerLocation.z : 0,
      source: lastPlayerLocation.source || "clipboard",
      yaw: raw.yaw,
      name: raw.name || lastPlayerLocation.name,
      class: raw.class || lastPlayerLocation.class,
      growth:
        raw.growth != null ? raw.growth : lastPlayerLocation.growth,
    });
    return;
  }
  // API already uses Unreal cm (same as their map). Only scale “simple” units.
  const cm = toUnrealCm(raw.x, raw.y, raw.z);
  if (!cm) return;
  publishPlayerLocation({
    ...cm,
    source: "primal-pinas",
    yaw: raw.yaw,
    name: raw.name,
    class: raw.class,
    growth: raw.growth,
    predicted: Boolean(raw.predicted),
  });
}

function publishBoschIslandLocation(raw) {
  if (!raw || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) return;
  lastBoschRawWorld = {
    x: raw.x,
    y: raw.y,
    z: Number.isFinite(raw.z) ? raw.z : 0,
    at: Date.now(),
    space: raw.space || "pixel",
  };
  // Dual mode: fresh Asset Location wins for X/Y
  if (clipboardXyIsFresh()) return;

  // Prefer Bosch world_x/world_y as-is. Only apply learned offset for
  // legacy pixel-space samples (map image conversion).
  const useCalib = raw.space === "pixel";
  const ox = useCalib ? Number(settings.boschCalibOffsetX) || 0 : 0;
  const oy = useCalib ? Number(settings.boschCalibOffsetY) || 0 : 0;
  publishPlayerLocation({
    x: raw.x + ox,
    y: raw.y + oy,
    z: Number.isFinite(raw.z) ? raw.z : 0,
    source: "bosch-island",
    name: raw.name,
    class: raw.class,
    yaw: Number.isFinite(raw.yaw) ? raw.yaw : undefined,
    predicted: Boolean(raw.predicted),
  });
}

/** Learn Bosch→IsleMap offset from Asset Location — pixel-space fallback only. */
function maybeLearnBoschCalibration(coords) {
  if (!boschIslandPollEnabled()) return false;
  if (!lastBoschRawWorld || Date.now() - lastBoschRawWorld.at > 90_000) {
    return false;
  }
  // world_x/world_y from Bosch are already Unreal cm — never "calibrate" those
  if (lastBoschRawWorld.space === "world" || lastBoschRawWorld.space === "cm") {
    return false;
  }
  if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) {
    return false;
  }
  const dx = coords.x - lastBoschRawWorld.x;
  const dy = coords.y - lastBoschRawWorld.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 40_000 || dist > 12_000_000) return false;

  settings = saveSettings({
    ...settings,
    boschCalibOffsetX: dx,
    boschCalibOffsetY: dy,
    boschCalibAt: Date.now(),
  });
  broadcastSettings();
  console.log(
    `[bosch-island] calibrated offset ${Math.round(dx)}, ${Math.round(dy)}` +
      ` (${(dist / 100000).toFixed(2)} km) from Asset Location`
  );
  broadcastBoschIslandStatus({
    ...(boschIslandLocation.getStatus() || {}),
    state: "ok",
    message: `Bosch pin calibrated (+${(dist / 100000).toFixed(2)} km correction)`,
    calibOffsetX: dx,
    calibOffsetY: dy,
  });
  return true;
}

function broadcastBoschIslandStatus(status) {
  const payload = status || boschIslandLocation.getStatus() || {};
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("dashboard:bosch-island-status", payload);
  }
  broadcastLiveLinkStatus();
}

function clipboardPollEnabled() {
  const m = settings.locationMethod || "clipboard";
  return m === "clipboard" || m === "both";
}

function liveMapEnabled() {
  const m = settings.locationMethod || "clipboard";
  return m === "live-map" || m === "both" || m === "primal-pinas";
}

function activeLiveMapServer() {
  return settings.liveMapServer === "bosch-island"
    ? "bosch-island"
    : "primal-pinas";
}

function primalPinasPollEnabled() {
  return liveMapEnabled() && activeLiveMapServer() === "primal-pinas";
}

function boschIslandPollEnabled() {
  return liveMapEnabled() && activeLiveMapServer() === "bosch-island";
}

function persistBoschConnection(connected) {
  const size = boschIslandLocation.getMapSize?.() || {};
  const next = {
    ...settings,
    boschIslandConnected: Boolean(connected),
    boschIslandStateUrl: connected
      ? boschIslandLocation.getStateUrl() || settings.boschIslandStateUrl || ""
      : "",
    boschIslandMapWidth: size.width || settings.boschIslandMapWidth || 1254,
    boschIslandMapHeight: size.height || settings.boschIslandMapHeight || 1254,
  };
  if (!connected) {
    next.boschCalibOffsetX = 0;
    next.boschCalibOffsetY = 0;
    next.boschCalibAt = 0;
    lastBoschRawWorld = null;
  }
  settings = saveSettings(next);
  broadcastSettings();
  if (!isLocationSetupReady(settings) && !userHidden) {
    userHidden = true;
    gameFocusHideTicks = 0;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    broadcastOverlayVisibility();
  }
}

function syncLocationProviders() {
  if (clipboardPollEnabled()) {
    startClipboardPoll();
  } else if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (primalPinasPollEnabled()) {
    primalPinasClasses.start();
    primalPinasLocation.start({
      code: settings.primalPinasMapCode || "",
      onLocation: publishPrimalPinasLocation,
      onStatus: broadcastPrimalPinasStatus,
    });
  } else {
    primalPinasLocation.stop();
    primalPinasClasses.stop();
    broadcastPrimalPinasStatus({
      provider: "primal-pinas",
      state: "off",
      message: "Primal Pinas location is off — switch Live map server to enable.",
      hasCode: Boolean(settings.primalPinasMapCode),
      updatedAt: Date.now(),
    });
  }

  if (boschIslandPollEnabled()) {
    boschIslandLocation.start({
      connected: Boolean(settings.boschIslandConnected),
      stateUrl: settings.boschIslandStateUrl || "",
      mapWidth: settings.boschIslandMapWidth,
      mapHeight: settings.boschIslandMapHeight,
      onLocation: publishBoschIslandLocation,
      onStatus: broadcastBoschIslandStatus,
      onConnectedChange: (connected) => {
        if (Boolean(connected) === Boolean(settings.boschIslandConnected)) {
          if (connected) {
            const url = boschIslandLocation.getStateUrl();
            if (url && url !== settings.boschIslandStateUrl) {
              persistBoschConnection(true);
            }
          }
          return;
        }
        persistBoschConnection(connected);
      },
    });
  } else {
    boschIslandLocation.stop();
    broadcastBoschIslandStatus({
      provider: "bosch-island",
      state: "off",
      connected: false,
      message: "Bosch Island location is off — switch Live map server to enable.",
      updatedAt: Date.now(),
    });
  }
  broadcastLiveLinkStatus();
}

function openDashboard() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
    flushPendingRadarConfigOffer();
    return dashboardWindow;
  }

  dashboardWindow = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    title: "IsleMap Dashboard",
    icon: APP_ICON,
    backgroundColor: "#0a0a0a",
    frame: false,
    show: false,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-dashboard.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const sendDashMaximized = () => {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
    dashboardWindow.webContents.send(
      "dashboard:maximized",
      dashboardWindow.isMaximized()
    );
  };

  dashboardWindow.on("maximize", sendDashMaximized);
  dashboardWindow.on("unmaximize", sendDashMaximized);

  dashboardWindow.loadFile(
    path.join(__dirname, "..", "src", "dashboard", "index.html")
  );

  dashboardWindow.once("ready-to-show", () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.show();
    }
  });

  // Close (X) hides to tray instead of quitting the app
  dashboardWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideDashboardToTray();
  });

  dashboardWindow.on("closed", () => {
    dashboardWindow = null;
  });

  dashboardWindow.webContents.on("did-finish-load", () => {
    dashboardWindow.webContents.send("settings:updated", settings);
    sendDashMaximized();
    flushPendingRadarConfigOffer();
  });

  return dashboardWindow;
}

function findImxPathFromArgv(argv = []) {
  for (const arg of argv) {
    if (!isImxPath(arg)) continue;
    try {
      if (fs.existsSync(arg) && fs.statSync(arg).isFile()) return path.resolve(arg);
    } catch {
      // ignore
    }
  }
  return null;
}

function offerRadarConfigPayload(payload) {
  if (!payload || typeof payload !== "object") return;
  pendingRadarConfigOffer = payload;
  openDashboard();
  flushPendingRadarConfigOffer();
}

function flushPendingRadarConfigOffer() {
  if (!pendingRadarConfigOffer) return;
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
  if (dashboardWindow.webContents.isLoading()) return;
  try {
    dashboardWindow.webContents.send(
      "dashboard:radar-config-offer",
      pendingRadarConfigOffer
    );
    pendingRadarConfigOffer = null;
  } catch (err) {
    console.warn("[radar-config] offer failed", err);
  }
}

function parseRadarConfigFile(filePath) {
  if (!isImxPath(filePath)) return { ok: false, reason: "not-imx" };
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    console.warn("[radar-config] read failed", err);
    return { ok: false, reason: "read-failed" };
  }
  return parseImxBuffer(buf);
}

function queueRadarConfigFromPath(filePath) {
  const parsed = parseRadarConfigFile(filePath);
  if (!parsed.ok) {
    console.warn("[radar-config] open failed:", parsed.reason, filePath);
    return parsed;
  }
  offerRadarConfigPayload(parsed.payload);
  return parsed;
}

/**
 * Normalize clipboard coords to Unreal cm.
 * Copy Location is usually full cm; some Lat/Long pastes use “simple” units (cm/1000).
 */
function toUnrealCm(x, y, z = 0) {
  let ux = Number(x);
  let uy = Number(y);
  let uz = Number(z);
  if (![ux, uy].every(Number.isFinite)) return null;
  // Heuristic: Gateway extents are ~±6e5 cm. Values under ~2e3 are simple units.
  if (Math.abs(ux) <= 2000 && Math.abs(uy) <= 2000) {
    ux *= 1000;
    uy *= 1000;
    if (Number.isFinite(uz) && Math.abs(uz) <= 2000) uz *= 1000;
  }
  return {
    x: ux,
    y: uy,
    z: Number.isFinite(uz) ? uz : 0,
  };
}

function parseCoords(text) {
  if (!text || typeof text !== "string") return null;
  const cleaned = text
    .trim()
    .replace(/\u2212/g, "-")
    .replace(/\u2013|\u2014/g, "-");

  const raw = cleaned.match(
    /^(-?[\d,]+(?:\.\d+)?)\s*,\s*(-?[\d,]+(?:\.\d+)?)\s*,\s*(-?[\d,]+(?:\.\d+)?)\s*$/
  );
  if (raw) {
    const cm = toUnrealCm(
      raw[1].replace(/,/g, ""),
      raw[2].replace(/,/g, ""),
      raw[3].replace(/,/g, "")
    );
    return cm ? { ...cm, source: "xyz" } : null;
  }

  const labeled = cleaned.match(
    /X\s*[:=]\s*(-?[\d,]+(?:\.\d+)?)\s*[,;\s]+Y\s*[:=]\s*(-?[\d,]+(?:\.\d+)?)\s*[,;\s]+Z\s*[:=]\s*(-?[\d,]+(?:\.\d+)?)/i
  );
  if (labeled) {
    const cm = toUnrealCm(
      labeled[1].replace(/,/g, ""),
      labeled[2].replace(/,/g, ""),
      labeled[3].replace(/,/g, "")
    );
    return cm ? { ...cm, source: "labeled" } : null;
  }

  const latLong = cleaned.match(
    /Lat\s*[:=]\s*(-?[\d.]+)\s*[,;]\s*Long\s*[:=]\s*(-?[\d.]+)/i
  );
  if (latLong) {
    const cm = toUnrealCm(latLong[1], latLong[2], 0);
    return cm ? { ...cm, source: "latlong" } : null;
  }

  return null;
}

function startClipboardPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (!clipboardPollEnabled()) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    let text = "";
    try {
      text = clipboard.readText();
    } catch {
      return;
    }
    if (!text || text === lastClipboard) return;
    lastClipboard = text;

    const coords = parseCoords(text);
    if (!coords) return;

    lastClipboardPublishAt = Date.now();
    // Keep Primal yaw, but don’t let lagged/coasted Primal XY stomp this click.
    try {
      primalPinasLocation.holdExternalFix?.(CLIPBOARD_XY_HOLD_MS);
    } catch {
      /* optional */
    }
    maybeLearnBoschCalibration(coords);
    publishPlayerLocation({
      ...coords,
      yaw: Number.isFinite(lastPlayerLocation?.yaw)
        ? lastPlayerLocation.yaw
        : undefined,
    });
  }, POLL_MS);
}

function startTopmostWatch() {
  if (topmostTimer) clearInterval(topmostTimer);
  topmostTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    // Show only while The Isle is active; re-pin while it is
    syncOverlayToGameFocus();
    if (isOverlayEnabled() && mayShowOverlayNow()) {
      maybeFollowGameDisplay();
      // Keep killing the Win11 white caption bar that DWM re-applies
      stripOverlayCaption();
    }
  }, TOPMOST_MS);
}

function safeRegister(accelerator, callback) {
  try {
    const ok = globalShortcut.register(accelerator, callback);
    if (!ok) console.warn(`[hotkey] failed to register ${accelerator}`);
  } catch (err) {
    console.warn(`[hotkey] ${accelerator}`, err);
  }
}

function toastFilter(label) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("overlay:toast", `Filter: ${label}`);
  }
}

function nudgeZoom(delta) {
  const step = 0.25;
  const current = Number(settings?.zoom);
  const base = Number.isFinite(current) ? current : DEFAULTS.zoom;
  const next = Math.round((base + delta) / step) * step;
  const clamped = Math.min(3, Math.max(-2, next));
  if (clamped === base) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "overlay:toast",
        clamped >= 3 ? "Zoom: max" : "Zoom: min"
      );
    }
    return;
  }
  applySettings({ zoom: clamped });
  if (mainWindow && !mainWindow.isDestroyed()) {
    const label = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(2);
    mainWindow.webContents.send("overlay:toast", `Zoom: ${label}`);
  }
}

function screenshotsDir() {
  // Windows-style Pictures/Screenshots, with an IsleMap subfolder
  return path.join(app.getPath("pictures"), "Screenshots", "IsleMap");
}

function screenshotFileName(kind = "map") {
  const tag = kind === "screen" ? "screen" : "map";
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `IsleMap-${tag}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`
  );
}

function screenshotKindFromName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("-screen-") || n.includes(" screen ")) return "screen";
  return "map";
}

function isSafeScreenshotName(name) {
  if (typeof name !== "string") return false;
  if (!name || name.length > 180) return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  return /^IsleMap.+\.png$/i.test(name);
}

function resolveScreenshotPath(name) {
  if (!isSafeScreenshotName(name)) return null;
  const full = path.join(screenshotsDir(), name);
  if (path.dirname(full) !== screenshotsDir()) return null;
  return full;
}

function broadcastScreenshotsUpdated(info = {}) {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("screenshot:updated", info);
  }
}

function notifyScreenshotSaved(filePath, kind = "map") {
  if (settings?.screenshotNotify === false) return;
  const name = path.basename(filePath);
  const label = kind === "screen" ? "Screen" : "Map";
  const body = "Saved to Pictures\\Screenshots\\IsleMap";
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: `${label} screenshot saved`,
        body: `${name}\n${body}`,
        icon: APP_ICON,
      });
      n.on("click", () => {
        shell.showItemInFolder(filePath);
      });
      n.show();
      return;
    }
  } catch (err) {
    console.warn("[screenshot] notification", err);
  }
  createTray();
  if (tray) {
    try {
      tray.displayBalloon({
        title: `${label} screenshot saved`,
        content: `${name} — ${body}`,
        icon: trayIconImage(),
      });
    } catch {
      // optional
    }
  }
}

function notifyScreenshotFailed(message) {
  try {
    if (settings?.screenshotNotify !== false && Notification.isSupported()) {
      const n = new Notification({
        title: "Screenshot failed",
        body: message || "Could not capture",
        icon: APP_ICON,
      });
      n.show();
      return;
    }
  } catch {
    // fall through
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(
      "overlay:toast",
      message || "Screenshot failed"
    );
  }
}

async function captureMapImage() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    throw new Error("Map window is not available");
  }
  const image = await mainWindow.webContents.capturePage();
  if (!image || image.isEmpty()) {
    throw new Error("Map capture was empty");
  }
  return image;
}

async function captureScreenImage() {
  const display = resolveOverlayDisplay(settings);
  const scale = Number(display.scaleFactor) || 1;
  const width = Math.max(1, Math.floor(display.size.width * scale));
  const height = Math.max(1, Math.floor(display.size.height * scale));
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height },
  });
  if (!sources.length) {
    throw new Error("No screen sources available");
  }
  const match =
    sources.find((s) => String(s.display_id) === String(display.id)) ||
    sources[0];
  if (!match || match.thumbnail.isEmpty()) {
    throw new Error("Screen capture was empty");
  }
  return match.thumbnail;
}

async function takeScreenshot(kind = "map") {
  const mode = kind === "screen" ? "screen" : "map";
  if (screenshotBusy) return { ok: false, reason: "busy" };

  screenshotBusy = true;
  try {
    const image =
      mode === "screen" ? await captureScreenImage() : await captureMapImage();

    const dir = screenshotsDir();
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, screenshotFileName(mode));
    fs.writeFileSync(filePath, image.toPNG());

    if (settings?.screenshotCopyClipboard !== false) {
      try {
        clipboard.writeImage(image);
      } catch (err) {
        console.warn("[screenshot] clipboard", err);
      }
    }

    notifyScreenshotSaved(filePath, mode);
    const toast =
      mode === "screen" ? "Screen screenshot saved" : "Map screenshot saved";
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("overlay:toast", toast);
    }
    broadcastScreenshotsUpdated({ kind: mode, name: path.basename(filePath) });
    return { ok: true, path: filePath, kind: mode, name: path.basename(filePath) };
  } catch (err) {
    console.warn("[screenshot]", err);
    notifyScreenshotFailed(err?.message || "Could not save screenshot");
    return { ok: false, reason: "error", message: err?.message || String(err) };
  } finally {
    screenshotBusy = false;
  }
}

function takeMapScreenshot() {
  return takeScreenshot("map");
}

function listScreenshots(filter = "all") {
  const dir = screenshotsDir();
  let names = [];
  try {
    if (!fs.existsSync(dir)) return [];
    names = fs
      .readdirSync(dir)
      .filter((n) => isSafeScreenshotName(n));
  } catch (err) {
    console.warn("[screenshot] list", err);
    return [];
  }

  const want = String(filter || "all");
  const items = [];
  for (const name of names) {
    const kind = screenshotKindFromName(name);
    if (want === "map" && kind !== "map") continue;
    if (want === "screen" && kind !== "screen") continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;

    let thumbDataUrl = "";
    try {
      let img = nativeImage.createFromPath(full);
      if (!img.isEmpty()) {
        const { width } = img.getSize();
        if (width > 360) {
          img = img.resize({ width: 360, quality: "better" });
        }
        thumbDataUrl = img.toDataURL();
      }
    } catch {
      // skip broken thumbs
    }

    items.push({
      name,
      kind,
      size: st.size,
      mtime: st.mtimeMs,
      thumbDataUrl,
    });
  }

  items.sort((a, b) => b.mtime - a.mtime);
  return items;
}

function readScreenshot(name) {
  const full = resolveScreenshotPath(name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  try {
    const img = nativeImage.createFromPath(full);
    if (img.isEmpty()) return { ok: false, reason: "empty" };
    return {
      ok: true,
      name,
      kind: screenshotKindFromName(name),
      dataUrl: img.toDataURL(),
    };
  } catch (err) {
    return { ok: false, reason: "error", message: err?.message || String(err) };
  }
}

function deleteScreenshot(name) {
  const full = resolveScreenshotPath(name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  try {
    fs.unlinkSync(full);
    broadcastScreenshotsUpdated({ deleted: name });
    return { ok: true, name };
  } catch (err) {
    return { ok: false, reason: "error", message: err?.message || String(err) };
  }
}

function recordingsDir() {
  return path.join(app.getPath("videos"), "IsleMap");
}

function isSafeRecordingName(name) {
  if (typeof name !== "string") return false;
  if (!name || name.length > 180) return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  return /^IsleMap-rec-.+\.(mp4|webm)$/i.test(name);
}

function resolveRecordingPath(name) {
  if (!isSafeRecordingName(name)) return null;
  const full = path.join(recordingsDir(), name);
  if (path.dirname(full) !== recordingsDir()) return null;
  return full;
}

function mimeForRecordingFile(filePath) {
  const lower = String(filePath || "").toLowerCase();
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

/**
 * Serve a clip with Accept-Ranges / 206 Partial Content so <video> seeking works.
 * Plain net.fetch(file://) often drops Range on custom schemes → scrub resets to 0:00.
 */
function serveRecordingMedia(full, request) {
  let st;
  try {
    st = fs.statSync(full);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!st.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const size = st.size;
  const mime = mimeForRecordingFile(full);
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Content-Type": mime,
    "Cache-Control": "no-store",
  };

  if (String(request?.method || "GET").toUpperCase() === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(size),
      },
    });
  }

  const rangeRaw =
    request?.headers?.get?.("range") || request?.headers?.get?.("Range") || "";
  const m = /^bytes=(\d*)-(\d*)$/i.exec(String(rangeRaw).trim());
  if (m) {
    let start = m[1] === "" ? NaN : Number.parseInt(m[1], 10);
    let end = m[2] === "" ? NaN : Number.parseInt(m[2], 10);
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end)) end = size - 1;
    if (
      start < 0 ||
      end < 0 ||
      start > end ||
      start >= size ||
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      return new Response(null, {
        status: 416,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes */${size}`,
        },
      });
    }
    end = Math.min(end, size - 1);
    const chunk = end - start + 1;
    const nodeStream = fs.createReadStream(full, { start, end });
    return new Response(Readable.toWeb(nodeStream), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunk),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  const nodeStream = fs.createReadStream(full);
  return new Response(Readable.toWeb(nodeStream), {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}

function recordingMetaPath(videoPath) {
  return String(videoPath || "").replace(/\.(mp4|webm)$/i, ".json");
}

function formatRecordingCoords(x, y, z) {
  const zx = Number.isFinite(z) ? Number(z).toFixed(1) : "—";
  return `${Number(x).toFixed(1)}, ${Number(y).toFixed(1)}, ${zx}`;
}

function findNearestPlace(x, y) {
  try {
    const places = flattenPlaces(readPlacesDoc());
    let best = null;
    let bestD2 = Infinity;
    for (const p of places) {
      const px = Number(p.x);
      const py = Number(p.y);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      const dx = px - x;
      const dy = py - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = p;
      }
    }
    if (!best) return null;
    const distCm = Math.sqrt(bestD2);
    const distM = distCm / 100;
    return {
      id: best.id || null,
      name: best.name || "Unknown",
      category: best.category || best.categoryKey || null,
      distanceM: Math.round(distM),
      distanceKm: Math.round((distM / 1000) * 10) / 10,
    };
  } catch (err) {
    console.warn("[recording] nearest place", err);
    return null;
  }
}

function basemapLabel(id) {
  const key = String(id || "");
  if (key === "gateway-realistic") return "Gateway Realistic";
  if (key === "gateway-official") return "Gateway Official";
  if (key === "gateway") return "Gateway [Deprecated]";
  return key || "Gateway";
}

function buildRecordingLocationMeta(extra = {}) {
  const loc = lastPlayerLocation;
  const basemap = settings?.basemap || DEFAULTS.basemap || "gateway-official";
  const recordedAt = new Date().toISOString();
  if (!loc || !Number.isFinite(loc.x) || !Number.isFinite(loc.y)) {
    return {
      recordedAt,
      basemap,
      basemapLabel: basemapLabel(basemap),
      location: null,
      coordsText: null,
      nearestPlace: null,
      placeLabel: "Location unknown",
      ...extra,
    };
  }
  const nearest = findNearestPlace(loc.x, loc.y);
  let placeLabel = "Unknown area";
  if (nearest?.name) {
    if (nearest.distanceM < 150) placeLabel = nearest.name;
    else if (nearest.distanceKm >= 1) {
      placeLabel = `Near ${nearest.name} (${nearest.distanceKm} km)`;
    } else {
      placeLabel = `Near ${nearest.name} (${nearest.distanceM} m)`;
    }
  }
  return {
    recordedAt,
    basemap,
    basemapLabel: basemapLabel(basemap),
    location: {
      x: loc.x,
      y: loc.y,
      z: Number.isFinite(loc.z) ? loc.z : 0,
      source: loc.source || "unknown",
    },
    coordsText: formatRecordingCoords(loc.x, loc.y, loc.z),
    nearestPlace: nearest,
    placeLabel,
    ...extra,
  };
}

function writeRecordingMeta(videoPath, meta) {
  try {
    const metaPath = recordingMetaPath(videoPath);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
    return metaPath;
  } catch (err) {
    console.warn("[recording] meta write", err);
    return null;
  }
}

function readRecordingMeta(videoPathOrName) {
  try {
    const full = path.isAbsolute(videoPathOrName)
      ? videoPathOrName
      : resolveRecordingPath(videoPathOrName);
    if (!full) return null;
    const metaPath = recordingMetaPath(full);
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch {
    return null;
  }
}

function deleteRecordingMeta(videoPath) {
  try {
    const metaPath = recordingMetaPath(videoPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch {
    // ignore
  }
}

function broadcastRecordingsUpdated(info = {}) {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("recording:updated", info);
  }
}

function listRecordings() {
  const dir = recordingsDir();
  let names = [];
  try {
    if (!fs.existsSync(dir)) return [];
    names = fs.readdirSync(dir).filter((n) => isSafeRecordingName(n));
  } catch (err) {
    console.warn("[recording] list", err);
    return [];
  }
  const items = [];
  for (const name of names) {
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    items.push({
      name,
      size: st.size,
      mtime: st.mtimeMs,
      // Path-based URL — filenames with underscores are invalid as hostnames
      url: `islemedia://clip/${encodeURIComponent(name)}`,
      meta: readRecordingMeta(full),
    });
  }
  items.sort((a, b) => b.mtime - a.mtime);
  const pending = getEncodingJobsList().map((job) => ({
    name: job.id,
    pending: true,
    status: job.status || "encoding",
    size: 0,
    mtime: job.startedAt || Date.now(),
    url: null,
    meta: null,
    label: job.name || "Encoding clip…",
    elapsedMs: job.elapsedMs,
  }));
  return [...pending, ...items];
}

function deleteRecording(name) {
  const full = resolveRecordingPath(name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  try {
    fs.unlinkSync(full);
    deleteRecordingMeta(full);
    broadcastRecordingsUpdated({ deleted: name });
    return { ok: true, name };
  } catch (err) {
    return { ok: false, reason: "error", message: err?.message || String(err) };
  }
}

function revealRecording(name) {
  const full = resolveRecordingPath(name);
  if (!full || !fs.existsSync(full)) return { ok: false };
  shell.showItemInFolder(full);
  return { ok: true };
}

async function openRecording(name) {
  const full = resolveRecordingPath(name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  const err = await shell.openPath(full);
  return { ok: !err, error: err || null };
}

function recordingFileName(ext = "mp4") {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const safeExt = String(ext || "mp4").replace(/^\./, "").toLowerCase() || "mp4";
  return (
    `IsleMap-rec-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${safeExt}`
  );
}

function sniffMediaContainer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) {
    return { kind: "unknown", reason: "too-small", size: buf?.length || 0 };
  }
  // EBML / WebM
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: "webm", reason: "ebml-header", size: buf.length };
  }
  // ISO BMFF / MP4 — "ftyp" at offset 4
  if (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    const brand = buf.slice(8, 12).toString("ascii");
    return { kind: "mp4", reason: `ftyp-${brand}`, size: buf.length, brand };
  }
  // RIFF / AVI unlikely
  if (buf.slice(0, 4).toString("ascii") === "RIFF") {
    return { kind: "riff", reason: "riff", size: buf.length };
  }
  const headHex = buf.slice(0, 16).toString("hex");
  return {
    kind: "unknown",
    reason: "no-known-signature",
    size: buf.length,
    headHex,
  };
}

function probeMediaWithFfmpeg(filePath) {
  return new Promise((resolve) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      resolve({ ok: false, reason: "ffmpeg-missing" });
      return;
    }
    const child = spawn(
      ffmpegPath,
      ["-hide_banner", "-i", filePath],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] }
    );
    let errBuf = "";
    child.stderr?.on("data", (chunk) => {
      errBuf += String(chunk || "");
      if (errBuf.length > 6000) errBuf = errBuf.slice(-6000);
    });
    child.on("error", (err) => {
      resolve({ ok: false, reason: "spawn", message: err.message });
    });
    child.on("close", () => {
      const durationMatch = errBuf.match(/Duration:\s*([\d:.]+)/i);
      const videoMatch = errBuf.match(
        /Stream\s+#\d+:\d+(?:\([^)]*\))?:\s*Video:\s*([^\n]+)/i
      );
      const audioMatch = errBuf.match(
        /Stream\s+#\d+:\d+(?:\([^)]*\))?:\s*Audio:\s*([^\n]+)/i
      );
      const corrupt =
        /moov atom not found|Invalid data found|Could not find codec|corrupt|Truncated/i.test(
          errBuf
        );
      const ok = Boolean(videoMatch) && !corrupt;
      resolve({
        ok,
        corrupt,
        duration: durationMatch?.[1] || null,
        video: videoMatch?.[1]?.trim() || null,
        audio: audioMatch?.[1]?.trim() || null,
        summary: errBuf
          .split(/\r?\n/)
          .filter((l) => /Duration:|Stream #|Input #|error|Invalid|moov/i.test(l))
          .slice(0, 12)
          .join("\n"),
      });
    });
  });
}

function runFfmpegArgs(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      reject(new Error("ffmpeg not available"));
      return;
    }
    const child = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let errBuf = "";
    child.stderr?.on("data", (chunk) => {
      errBuf += String(chunk || "");
      if (errBuf.length > 5000) errBuf = errBuf.slice(-5000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ args, logTail: errBuf.slice(-2000) });
      else reject(new Error(errBuf.trim() || `ffmpeg exited ${code}`));
    });
  });
}

/** Remux or re-encode any readable input into a proper MP4 with moov (faststart). */
async function runFfmpegToMp4(inputPath, outputPath) {
  const inputProbe = await probeMediaWithFfmpeg(inputPath);
  const hasAudio = Boolean(inputProbe?.audio);

  // 1) Try stream copy remux (fast) — only works if codecs are MP4-compatible
  try {
    const copyArgs = [
      "-y",
      "-fflags",
      "+genpts",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
    ];
    if (hasAudio) {
      copyArgs.push("-map", "0:a:0", "-c", "copy");
    } else {
      copyArgs.push("-c:v", "copy", "-an");
    }
    copyArgs.push("-movflags", "+faststart", outputPath);
    await runFfmpegArgs(copyArgs);
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      const probe = await probeMediaWithFfmpeg(outputPath);
      if (probe.ok) return { mode: "copy", probe, hasAudio };
    }
  } catch {
    // fall through to re-encode
  }

  try {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  } catch {
    // ignore
  }

  // 2) Full re-encode → guaranteed moov + High profile HD (+ AAC audio)
  const encodeArgs = [
    "-y",
    "-fflags",
    "+genpts",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "17",
    "-profile:v",
    "high",
    "-level",
    "5.1",
    "-pix_fmt",
    "yuv420p",
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
  ];
  if (hasAudio) {
    encodeArgs.push(
      "-map",
      "0:a:0",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ac",
      "2",
      "-ar",
      "48000"
    );
  } else {
    encodeArgs.push("-an");
  }
  encodeArgs.push("-movflags", "+faststart", outputPath);

  const result = await runFfmpegArgs(encodeArgs);
  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new Error("ffmpeg produced empty MP4");
  }
  const probe = await probeMediaWithFfmpeg(outputPath);
  if (!probe.ok) {
    throw new Error(
      probe.summary || "ffmpeg MP4 missing moov / unreadable after encode"
    );
  }
  return { mode: "encode", probe, hasAudio, logTail: result.logTail };
}

function formatRecordingDebug(debug) {
  if (!debug || typeof debug !== "object") return "";
  try {
    return JSON.stringify(debug, null, 2);
  } catch {
    return String(debug);
  }
}

let lastRecordingDebug = null;

function setRecordingDebug(debug) {
  lastRecordingDebug = {
    at: new Date().toISOString(),
    ...debug,
  };
  console.log("[recording:debug]", formatRecordingDebug(lastRecordingDebug));
  broadcastRecordingState({ debug: lastRecordingDebug });
  return lastRecordingDebug;
}

function notifyRecordingSaved(filePath, name) {
  if (settings?.screenshotNotify === false) return;
  if (!Notification.isSupported()) return;
  try {
    const n = new Notification({
      title: "Recording saved",
      body: `${name}\nSaved to Videos\\IsleMap`,
      icon: APP_ICON,
    });
    n.on("click", () => shell.showItemInFolder(filePath));
    n.show();
  } catch {
    // optional
  }
}

function finalizeSavedRecording(filePath, name, format, extra = {}) {
  const locationMeta = buildRecordingLocationMeta({
    name,
    format,
    elapsedMs: extra.elapsedMs ?? null,
    convertMode: extra.convertMode ?? null,
  });
  writeRecordingMeta(filePath, locationMeta);
  const debug = extra.debug
    ? { ...extra.debug, location: locationMeta }
    : undefined;
  notifyRecordingSaved(filePath, name);
  if (extra.jobId) finishEncodingJob(extra.jobId, { saved: name, meta: locationMeta });
  else broadcastRecordingsUpdated({ saved: name, meta: locationMeta });
  // Do not force recorder state — user may already be recording again
  broadcastRecordingState({
    saved: name,
    path: filePath,
    meta: locationMeta,
    debug,
    encodingJobs: getEncodingJobsList(),
    encodingCount: encodingJobs.size,
  });
  return { ok: true, name, path: filePath, format, meta: locationMeta, debug };
}

async function saveRecordingBuffer(bufferLike, meta = {}) {
  const captureDebug =
    meta && typeof meta === "object" ? meta.debug || meta.capture || null : null;
  const jobId = beginEncodingJob({
    elapsedMs: captureDebug?.elapsedMs,
    debug: captureDebug,
  });
  try {
    const dir = recordingsDir();
    fs.mkdirSync(dir, { recursive: true });
    const buf = Buffer.isBuffer(bufferLike)
      ? bufferLike
      : Buffer.from(bufferLike);
    if (!buf.length) {
      const debug = setRecordingDebug({
        stage: "save",
        ok: false,
        reason: "empty-buffer",
        mimeClaimed: meta?.mimeType || null,
        capture: captureDebug,
      });
      finishEncodingJob(jobId, { failed: true, message: "Empty recording" });
      return { ok: false, message: "Empty recording", debug, jobId };
    }

    const mimeClaimed = String(meta?.mimeType || "").toLowerCase();
    const sniff = sniffMediaContainer(buf);
    const debugBase = {
      stage: "save",
      mimeClaimed: mimeClaimed || null,
      sniff,
      bytes: buf.length,
      capture: captureDebug,
      ffmpegPath: ffmpegPath || null,
      ffmpegExists: Boolean(ffmpegPath && fs.existsSync(ffmpegPath)),
    };

    if (sniff.kind === "unknown") {
      const debug = setRecordingDebug({
        ...debugBase,
        ok: false,
        reason: "corrupt-or-unknown-container",
        tip: "Buffer has no WebM/MP4 signature — MediaRecorder may have produced truncated data.",
      });
      finishEncodingJob(jobId, { failed: true, message: "corrupt" });
      return {
        ok: false,
        message: "Recording data looks corrupted (unknown container)",
        debug,
        jobId,
      };
    }

    // NEVER write MediaRecorder bytes as the final MP4.
    // Chromium "video/mp4" blobs often have ftyp+mdat but no moov → unplayable.
    // Always stage to temp, then remux/re-encode with ffmpeg (+faststart).
    const ext =
      sniff.kind === "webm" ? "webm" : sniff.kind === "mp4" ? "mp4" : "bin";
    const tmpName = recordingFileName(ext);
    const tmpPath = path.join(dir, `.tmp-${tmpName}`);
    fs.writeFileSync(tmpPath, buf);

    const inputProbe = await probeMediaWithFfmpeg(tmpPath);
    if (!inputProbe.ok) {
      const dumpName = recordingFileName(ext === "bin" ? "webm" : ext);
      const dumpPath = path.join(dir, dumpName);
      try {
        fs.renameSync(tmpPath, dumpPath);
      } catch {
        fs.writeFileSync(dumpPath, buf);
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          // ignore
        }
      }
      const moovMissing = /moov atom not found/i.test(
        inputProbe.summary || ""
      );
      const debug = setRecordingDebug({
        ...debugBase,
        ok: false,
        reason: moovMissing
          ? "mediarecorder-mp4-missing-moov"
          : "input-unreadable",
        name: dumpName,
        path: dumpPath,
        inputProbe,
        tip: moovMissing
          ? "This is a known Chromium MediaRecorder MP4 bug (ftyp present, moov missing). IsleMap now captures WebM only and remuxes to MP4 — record a new clip."
          : "Source capture is already unreadable — corruption happened during capture, before convert.",
      });
      finishEncodingJob(jobId, { failed: true, message: "input-unreadable" });
      return {
        ok: false,
        message: moovMissing
          ? "MediaRecorder MP4 missing moov (unplayable) — record again"
          : "Capture file is corrupt / unreadable",
        name: dumpName,
        path: dumpPath,
        debug,
        jobId,
      };
    }

    const name = recordingFileName("mp4");
    const filePath = path.join(dir, name);
    try {
      const convert = await runFfmpegToMp4(tmpPath, filePath);
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
      const probe = convert.probe || (await probeMediaWithFfmpeg(filePath));
      const debug = setRecordingDebug({
        ...debugBase,
        ok: probe.ok,
        name,
        path: filePath,
        format: "mp4",
        converted: true,
        convertMode: convert.mode || null,
        inputProbe,
        convertLogTail: convert?.logTail || null,
        probe,
        tip: probe.ok
          ? `Converted to MP4 (${convert.mode || "encode"}) with valid moov.`
          : "ffmpeg finished but output MP4 failed validation.",
      });
      if (!probe.ok) {
        finishEncodingJob(jobId, { failed: true, message: "validation" });
        return {
          ok: false,
          message: "Converted MP4 failed validation",
          name,
          path: filePath,
          debug,
          jobId,
        };
      }
      return finalizeSavedRecording(filePath, name, "mp4", {
        convertMode: convert.mode || null,
        elapsedMs: captureDebug?.elapsedMs ?? null,
        debug,
        jobId,
      });
    } catch (convErr) {
      console.warn("[recording] mp4 convert failed, keeping source", convErr);
      const keepName = recordingFileName(ext === "bin" ? "webm" : ext);
      const keepPath = path.join(dir, keepName);
      try {
        fs.renameSync(tmpPath, keepPath);
      } catch {
        fs.writeFileSync(keepPath, buf);
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          // ignore
        }
      }
      const debug = setRecordingDebug({
        ...debugBase,
        ok: false,
        reason: "mp4-convert-failed",
        name: keepName,
        path: keepPath,
        format: ext,
        inputProbe,
        convertError: convErr?.message || String(convErr),
        tip: "Kept source capture. New recordings use WebM→MP4 remux so moov is written correctly.",
      });
      const saved = finalizeSavedRecording(keepPath, keepName, ext, {
        elapsedMs: captureDebug?.elapsedMs ?? null,
        debug,
        jobId,
      });
      return {
        ...saved,
        warning: "mp4-convert-failed",
        debug,
      };
    }
  } catch (err) {
    finishEncodingJob(jobId, {
      failed: true,
      message: err?.message || String(err),
    });
    const debug = setRecordingDebug({
      stage: "save",
      ok: false,
      reason: "exception",
      message: err?.message || String(err),
      capture: captureDebug,
    });
    return { ok: false, message: err?.message || String(err), debug, jobId };
  }
}

function broadcastRecordingState(partial = {}) {
  const prev = recordingState?.state;
  recordingState = {
    state: "idle",
    elapsedMs: 0,
    ...recordingState,
    ...partial,
    encodingJobs: getEncodingJobsList(),
    encodingCount: encodingJobs.size,
  };
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send("recording:state", recordingState);
  }
  if (prev !== recordingState.state) {
    refreshTrayMenu();
  }
}

function sendRecordingCommand(action) {
  // Encoding runs in background — never block new recordings
  if (!mainWindow || mainWindow.isDestroyed()) {
    notifyScreenshotFailed("Map window is not available for recording");
    return { ok: false, reason: "no-window" };
  }
  // Ensure overlay process is alive to run MediaRecorder
  try {
    if (!mainWindow.isVisible() && isOverlayEnabled()) {
      // keep hidden overlays recordable; webContents still runs
    }
  } catch {
    // ignore
  }
  mainWindow.webContents.send("recording:command", action);
  return { ok: true };
}

async function getRecordingSource() {
  try {
    const display = resolveOverlayDisplay(settings);
    const scale = Number(display.scaleFactor) || 1;
    const width = Math.max(1, Math.floor(display.size.width * scale));
    const height = Math.max(1, Math.floor(display.size.height * scale));
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 0, height: 0 },
    });
    if (!sources.length) {
      return { ok: false, message: "No screen sources available" };
    }
    const match =
      sources.find((s) => String(s.display_id) === String(display.id)) ||
      sources[0];
    return {
      ok: true,
      id: match.id,
      name: match.name,
      width,
      height,
      displayId: String(display.id),
    };
  } catch (err) {
    return { ok: false, message: err?.message || String(err) };
  }
}

async function openRecordingsFolder() {
  const dir = recordingsDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
  const err = await shell.openPath(dir);
  return { ok: !err, error: err || null, path: dir };
}

function resolveSharePath(kind, name) {
  if (kind === "recording") return resolveRecordingPath(name);
  if (kind === "screenshot") return resolveScreenshotPath(name);
  return null;
}

async function copyPathToClipboard(filePath) {
  if (process.platform === "win32") {
    const ps = `
$path = ${JSON.stringify(filePath)}
Set-Clipboard -Path $path
`;
    await new Promise((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", ps],
        { windowsHide: true, stdio: "ignore" }
      );
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`clipboard exit ${code}`));
      });
    });
    return;
  }
  clipboard.writeText(filePath);
}

async function shareMediaFile({ kind, name, target }) {
  const full = resolveSharePath(kind, name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  const t = String(target || "").toLowerCase();

  // Screenshots: also put image bytes on clipboard for Discord paste
  if (kind === "screenshot") {
    try {
      const img = nativeImage.createFromPath(full);
      if (!img.isEmpty()) clipboard.writeImage(img);
    } catch {
      // fall through to file clipboard
    }
  }

  try {
    await copyPathToClipboard(full);
  } catch (err) {
    console.warn("[share] clipboard", err);
    try {
      clipboard.writeText(full);
    } catch {
      // ignore
    }
  }

  const urls = {
    discord: "https://discord.com/app",
    facebook: "https://www.facebook.com/",
    tiktok: "https://www.tiktok.com/upload?lang=en",
  };
  const url = urls[t];
  if (url) {
    try {
      await shell.openExternal(url);
    } catch (err) {
      return {
        ok: true,
        copied: true,
        opened: false,
        message: err?.message || String(err),
      };
    }
  }

  const tips = {
    discord: "File copied — paste in Discord (Ctrl+V)",
    facebook: "File copied — upload it in Facebook",
    tiktok: "File copied — upload it in TikTok",
  };
  return {
    ok: true,
    copied: true,
    opened: Boolean(url),
    target: t,
    tip: tips[t] || "File copied to clipboard",
  };
}

function registerHotkeys() {
  try {
    globalShortcut.unregisterAll();
  } catch {
    // ignore
  }

  const hk = settings || DEFAULTS;

  safeRegister(hk.hotkeyPlayMode || DEFAULTS.hotkeyPlayMode, () => {
    applyPlayInputMode(!clickThrough);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "overlay:toast",
        clickThrough
          ? "Play mode — clicks & keys go to game"
          : "Map mode — use the overlay"
      );
    }
  });

  safeRegister(hk.hotkeyRecenter || DEFAULTS.hotkeyRecenter, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("overlay:recenter");
    }
  });

  safeRegister(hk.hotkeyToggleOverlay || DEFAULTS.hotkeyToggleOverlay, () => {
    setOverlayVisible(!isOverlayEnabled());
  });

  safeRegister(hk.hotkeyRepin || DEFAULTS.hotkeyRepin, () => {
    setOverlayVisible(true);
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.webContents.send(
        "overlay:toast",
        "Re-attached above The Isle"
      );
    }
  });

  safeRegister(hk.hotkeyDashboard || DEFAULTS.hotkeyDashboard, () => {
    openDashboard();
  });

  safeRegister(hk.hotkeyPlaceFilter || DEFAULTS.hotkeyPlaceFilter, cyclePlaceFilter);

  safeRegister(hk.hotkeyFilterAll || DEFAULTS.hotkeyFilterAll, () => {
    applySettings({ placeFilter: "all" });
    toastFilter("All places");
  });
  safeRegister(hk.hotkeyFilterWaters || DEFAULTS.hotkeyFilterWaters, () => {
    applySettings({ placeFilter: "waters" });
    toastFilter("Water only");
  });
  safeRegister(hk.hotkeyFilterAreas || DEFAULTS.hotkeyFilterAreas, () => {
    applySettings({ placeFilter: "areas" });
    toastFilter("Areas only");
  });
  safeRegister(hk.hotkeyFilterLandmarks || DEFAULTS.hotkeyFilterLandmarks, () => {
    applySettings({ placeFilter: "landmarks" });
    toastFilter("Landmarks only");
  });
  safeRegister(hk.hotkeyFilterWallows || DEFAULTS.hotkeyFilterWallows, () => {
    applySettings({ placeFilter: "wallows" });
    toastFilter("Wallows only");
  });
  safeRegister(
    hk.hotkeyFilterSanctuaries || DEFAULTS.hotkeyFilterSanctuaries,
    () => {
      applySettings({ placeFilter: "sanctuaries" });
      toastFilter("Sanctuaries only");
    }
  );

  safeRegister(hk.hotkeyZoomIn || DEFAULTS.hotkeyZoomIn, () => {
    nudgeZoom(0.25);
  });
  safeRegister(hk.hotkeyZoomOut || DEFAULTS.hotkeyZoomOut, () => {
    nudgeZoom(-0.25);
  });

  safeRegister(hk.hotkeyClearWaypoint || DEFAULTS.hotkeyClearWaypoint, () => {
    const had =
      Boolean(settings?.waypointEnabled) &&
      Number.isFinite(Number(settings?.waypointX)) &&
      Number.isFinite(Number(settings?.waypointY));
    applySettings({
      waypointEnabled: false,
      waypointX: null,
      waypointY: null,
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "overlay:toast",
        had ? "Waypoint cleared" : "No waypoint to clear"
      );
    }
  });

  safeRegister(hk.hotkeyScreenshot || DEFAULTS.hotkeyScreenshot, () => {
    void takeScreenshot("map");
  });

  safeRegister(
    hk.hotkeyScreenshotScreen || DEFAULTS.hotkeyScreenshotScreen,
    () => {
      void takeScreenshot("screen");
    }
  );

  safeRegister(hk.hotkeyRecordToggle || DEFAULTS.hotkeyRecordToggle, () => {
    sendRecordingCommand("toggle-record");
  });
  safeRegister(
    hk.hotkeyRecordPauseToggle || DEFAULTS.hotkeyRecordPauseToggle,
    () => {
      sendRecordingCommand("toggle-pause");
    }
  );
}

if (gotLock) {
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    if (!isImxPath(filePath)) return;
    const parsed = parseRadarConfigFile(filePath);
    if (!parsed.ok) {
      console.warn("[radar-config] open-file failed:", parsed.reason, filePath);
      return;
    }
    pendingRadarConfigOffer = parsed.payload;
    if (app.isReady()) {
      openDashboard();
      flushPendingRadarConfigOffer();
    }
  });

  app.whenReady().then(() => {
    try {
      protocol.handle("islemedia", (request) => {
        try {
          const raw = String(request.url || "");
          let name = "";
          try {
            const u = new URL(raw);
            // Preferred: islemedia://clip/IsleMap-rec-….mp4
            name = decodeURIComponent(
              String(u.pathname || "").replace(/^\/+/, "")
            );
            // Legacy: islemedia://IsleMap-rec-….mp4 (host = filename)
            if (!name) {
              name = decodeURIComponent(String(u.hostname || ""));
            }
          } catch {
            name = decodeURIComponent(
              raw
                .replace(/^islemedia:\/\//i, "")
                .replace(/^\/+/, "")
                .replace(/^clip\//i, "")
                .split("?")[0] || ""
            );
          }
          name = String(name || "").split("?")[0].replace(/^clip\//i, "");
          const full = resolveRecordingPath(name);
          if (!full || !fs.existsSync(full)) {
            console.warn("[islemedia] missing", name, raw);
            return new Response("Not found", { status: 404 });
          }
          return serveRecordingMedia(full, request);
        } catch (err) {
          console.warn("[islemedia]", err);
          return new Response("Error", { status: 500 });
        }
      });
    } catch (err) {
      console.warn("[recording] protocol", err);
    }
    try {
      session.defaultSession.setPermissionRequestHandler(
        (_wc, permission, callback) => {
          if (
            permission === "media" ||
            permission === "display-capture" ||
            permission === "mediaKeySystem"
          ) {
            callback(true);
            return;
          }
          callback(false);
        }
      );
    } catch (err) {
      console.warn("[recording] permission handler", err);
    }
    settings = loadSettings();
    // Hydrate group identity from settings / durable identity file
    if (!settings.groupUsername && getStoredUsername()) {
      settings = saveSettings({
        ...settings,
        groupUsername: getStoredUsername(),
      });
    }
    groupSync.configure({
      settings,
      saveSettings: (partial) => applySettings(partial),
      lastLocation: () => lastPlayerLocation,
    });
    if (settings.groupUsername || getStoredUsername()) {
      groupSync.setUsername(settings.groupUsername || getStoredUsername());
    }
    // Global presence — powers active-user count on Updates
    try {
      groupSync.ensureOnlinePresence();
    } catch (err) {
      console.warn("[online] start failed", err);
    }
    createWindow();
    openDashboard();
    createTray();
    syncLocationProviders();
    startTopmostWatch();
    registerHotkeys();
    broadcastOverlayVisibility();

    const startupImx = findImxPathFromArgv(process.argv);
    if (startupImx) queueRadarConfigFromPath(startupImx);

    setForceUpdateHandler((status) => {
      if (!status?.forceUpdate) {
        refreshTrayMenu();
        return;
      }
      // Lock gameplay until they install
      userHidden = true;
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide();
      }
      openDashboard();
      refreshTrayMenu();
    });

    const onDisplayChange = () => {
      placeOverlayWindow(settings);
      broadcastDisplays();
    };
    screen.on("display-added", onDisplayChange);
    screen.on("display-removed", onDisplayChange);
    screen.on("display-metrics-changed", onDisplayChange);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    initUpdater();
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (pollTimer) clearInterval(pollTimer);
  if (topmostTimer) clearInterval(topmostTimer);
  try {
    groupSync.disconnectPusher();
  } catch {
    /* ignore */
  }
  try {
    boschIslandLocation.stop();
    primalPinasLocation.stop();
  } catch {
    /* ignore */
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on("window-all-closed", () => {
  // Keep running in the tray; only tray "Quit IsleMap" (or OS logout) exits.
  if (tray && !isQuitting) return;
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("overlay:set-click-through", (_event, enabled) => {
  applyPlayInputMode(Boolean(enabled));
  return clickThrough;
});

ipcMain.handle("overlay:get-click-through", () => clickThrough);

ipcMain.handle("overlay:clear-clipboard", () => {
  clipboard.clear();
  lastClipboard = "";
});

ipcMain.handle("overlay:repin", () => {
  setOverlayVisible(true);
  return true;
});

ipcMain.handle("overlay:open-dashboard", () => {
  openDashboard();
  return true;
});

ipcMain.handle("settings:get", () => settings);

ipcMain.handle("settings:set", (_event, partial) => applySettings(partial || {}));

ipcMain.handle("radar-config:export", async (_event, opts = {}) => {
  const win =
    dashboardWindow && !dashboardWindow.isDestroyed()
      ? dashboardWindow
      : null;
  const result = await dialog.showSaveDialog(win, {
    title: "Export Radar Config",
    defaultPath: "MyRadar.imx",
    filters: [
      { name: "IsleMap Radar Config", extensions: ["imx"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, reason: "canceled" };
  }
  let filePath = result.filePath;
  if (!filePath.toLowerCase().endsWith(".imx")) filePath += ".imx";
  try {
    const buf = buildImxBuffer(settings, {
      name: opts.name || "Radar Config",
    });
    fs.writeFileSync(filePath, buf);
    return { ok: true, path: filePath };
  } catch (err) {
    console.warn("[radar-config] export failed", err);
    return { ok: false, reason: "write-failed" };
  }
});

ipcMain.handle("radar-config:import-dialog", async () => {
  const win =
    dashboardWindow && !dashboardWindow.isDestroyed()
      ? dashboardWindow
      : null;
  const result = await dialog.showOpenDialog(win, {
    title: "Import Radar Config",
    filters: [
      { name: "IsleMap Radar Config", extensions: ["imx"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile"],
  });
  if (result.canceled || !result.filePaths?.[0]) {
    return { ok: false, reason: "canceled" };
  }
  const parsed = parseRadarConfigFile(result.filePaths[0]);
  if (!parsed.ok) return parsed;
  return { ok: true, payload: parsed.payload };
});

ipcMain.handle("radar-config:parse-path", (_event, filePath) => {
  const parsed = parseRadarConfigFile(filePath);
  if (!parsed.ok) return parsed;
  offerRadarConfigPayload(parsed.payload);
  return { ok: true, payload: parsed.payload };
});

ipcMain.handle("radar-config:apply", (_event, packSettings) => {
  const partial = applyRadarSettings(settings, packSettings);
  applySettings(partial);
  return { ok: true, settings };
});

ipcMain.handle("radar-config:list-templates", () => listRadarTemplates());

ipcMain.handle("radar-config:get-template", (_event, id) => {
  const payload = getRadarTemplate(String(id || ""));
  if (!payload) return { ok: false, reason: "not-found" };
  return { ok: true, payload };
});

ipcMain.handle("settings:reset", () => {
  settings = saveSettings({ ...DEFAULTS }, { replace: true });
  try {
    groupSync.updateConfigFromSettings(settings);
  } catch {
    /* ignore */
  }
  placeOverlayWindow(settings);
  applyWindowOpacity(settings);
  broadcastSettings();
  registerHotkeys();
  syncOverlayToGameFocus();
  return settings;
});

ipcMain.handle("dashboard:repin", () => {
  setOverlayVisible(true);
  return true;
});

ipcMain.handle("dashboard:toggle-overlay", () => {
  return setOverlayVisible(!isOverlayEnabled());
});

ipcMain.handle("dashboard:overlay-visible", () => getOverlayVisibilityState());

ipcMain.handle("dashboard:list-displays", () => listOverlayDisplays());

ipcMain.handle("dashboard:last-location", () => lastPlayerLocation);

ipcMain.handle("dashboard:primal-pinas-status", () =>
  enrichPrimalStatus(primalPinasLocation.getStatus())
);

ipcMain.handle("dashboard:primal-pinas-roster", async () => {
  await primalPinasClasses.refresh();
  return primalPinasClasses.getRoster();
});

ipcMain.handle("dashboard:bosch-island-status", () =>
  boschIslandLocation.getStatus()
);

ipcMain.handle("overlay:live-link-status", () => deriveLiveLinkStatus());
ipcMain.handle("dashboard:live-link-status", () => deriveLiveLinkStatus());

ipcMain.handle("dashboard:bosch-island-connect", async () => {
  try {
    // Ensure live-map + bosch server when user connects
    if (!boschIslandPollEnabled()) {
      settings = saveSettings({
        ...settings,
        locationMethod:
          settings.locationMethod === "clipboard" || !settings.locationMethod
            ? "live-map"
            : settings.locationMethod === "both"
              ? "both"
              : "live-map",
        liveMapServer: "bosch-island",
      });
      broadcastSettings();
      syncLocationProviders();
    }
    const result = await boschIslandLocation.connectInteractive();
    persistBoschConnection(true);
    broadcastBoschIslandStatus(boschIslandLocation.getStatus());
    return { ok: true, ...result };
  } catch (err) {
    persistBoschConnection(false);
    broadcastBoschIslandStatus(boschIslandLocation.getStatus());
    return { ok: false, reason: err?.message || "connect-failed" };
  }
});

ipcMain.handle("dashboard:bosch-island-disconnect", async () => {
  await boschIslandLocation.disconnect();
  persistBoschConnection(false);
  broadcastBoschIslandStatus(boschIslandLocation.getStatus());
  return { ok: true };
});

ipcMain.handle("dashboard:pick-player-icon", async () => {
  const win =
    dashboardWindow && !dashboardWindow.isDestroyed()
      ? dashboardWindow
      : null;
  const result = await dialog.showOpenDialog(win, {
    title: "Choose player icon",
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
      },
    ],
    properties: ["openFile"],
  });
  if (result.canceled || !result.filePaths?.[0]) {
    return { ok: false, reason: "canceled" };
  }
  const filePath = result.filePaths[0];
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    console.warn("[dev] read player icon failed", err);
    return { ok: false, reason: "read-failed" };
  }
  if (buf.length > 400 * 1024) {
    return { ok: false, reason: "too-large" };
  }
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime =
    ext === "svg"
      ? "image/svg+xml"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/png";
  return {
    ok: true,
    dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
    name: path.basename(filePath),
  };
});

ipcMain.handle("dashboard:is-dev", () => IS_DEV);

ipcMain.handle("dashboard:app-version", () => app.getVersion());

ipcMain.handle("group:status", () => groupSync.getSnapshot());
ipcMain.handle("group:set-username", (_event, name) => {
  return groupSync.setUsername(name);
});
ipcMain.handle("group:create", async () => groupSync.createGroup());
ipcMain.handle("group:join", async (_event, code) => groupSync.joinGroup(code));
ipcMain.handle("group:leave", () => groupSync.leaveGroup());
ipcMain.handle("group:kick", (_event, pcId) => groupSync.kickMember(pcId));
ipcMain.handle("group:identity", () => ({
  pcId: getPcId(),
  username: settings.groupUsername || getStoredUsername() || "",
}));

ipcMain.handle("online:status", () => groupSync.getOnlineSnapshot());

ipcMain.handle("global:players", () => groupSync.getGlobalPlayersSnapshot());

ipcMain.handle("global:refresh-players", () => {
  try {
    groupSync.requestOnlineLocations?.();
    const loc =
      lastPlayerLocation &&
      Number.isFinite(lastPlayerLocation.x) &&
      Number.isFinite(lastPlayerLocation.y)
        ? lastPlayerLocation
        : null;
    if (loc) groupSync.publishLocation(loc, true);
  } catch (err) {
    console.warn("[online] refresh-players", err);
  }
  return groupSync.getGlobalPlayersSnapshot();
});

ipcMain.handle("places:can-edit", () => ({
  ok: IS_DEV,
  packaged: app.isPackaged,
  file: placesFilePath(),
  userFile: userPlacesPath(),
  shipsWithRelease: IS_DEV,
}));

ipcMain.handle("places:get", () => {
  try {
    const doc = readPlacesDoc();
    return {
      ok: true,
      canEdit: IS_DEV,
      packaged: app.isPackaged,
      shipsWithRelease: IS_DEV,
      file: placesFilePath(),
      userFile: userPlacesPath(),
      doc,
      places: flattenPlaces(doc),
    };
  } catch (err) {
    console.warn("[places] get failed", err);
    return { ok: false, reason: String(err?.message || err) };
  }
});

ipcMain.handle("places:save", (_event, payload) => {
  // Map editor is unpackaged-only; saves ship bundled JSON and a userData
  // overlay so player installs keep customs across updates.
  if (!IS_DEV) return { ok: false, reason: "not-dev" };
  try {
    const places = Array.isArray(payload?.places) ? payload.places : null;
    if (!places) return { ok: false, reason: "places-required" };
    const used = new Set();
    const cleaned = [];
    for (const raw of places) {
      const check = validatePlaceInput(raw);
      if (!check.ok) continue;
      let id = String(raw.id || "").trim();
      if (!id || used.has(id)) id = uniqueId(check.name, used);
      used.add(id);
      cleaned.push({
        id,
        name: check.name,
        x: check.x,
        y: check.y,
        category: check.category,
        grid:
          raw.grid != null && String(raw.grid).trim()
            ? String(raw.grid).trim()
            : null,
      });
    }
    return writePlacesDoc(cleaned, {
      source: payload?.source || "gateway-bundled",
      shipBundled: true,
    });
  } catch (err) {
    console.warn("[places] save failed", err);
    return { ok: false, reason: String(err?.message || err) };
  }
});

ipcMain.handle("updater:status", () => getUpdateStatus());
ipcMain.handle("updater:check", () => checkForUpdates());
ipcMain.handle("updater:download", () => downloadUpdate());
ipcMain.handle("updater:install", () => installUpdate());
ipcMain.handle("updater:open-installer", () => openInstallerDownload());
ipcMain.handle("updater:open-release", async () => {
  const status = getUpdateStatus();
  const url = status.releaseUrl || releasePageUrl();
  await shell.openExternal(url);
  return { ok: true, url };
});

ipcMain.handle("dashboard:open-external", async (_event, url) => {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, reason: "protocol" };
    }
    await shell.openExternal(parsed.toString());
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
});

ipcMain.handle("dashboard:dev-presets", () => {
  if (!IS_DEV) return [];
  return DEV_DUMMY_PRESETS;
});

ipcMain.handle("dashboard:dev-dummy-location", (_event, partial) => {
  return injectDevDummyLocation(partial || lastDevDummy || DEV_DUMMY_DEFAULT);
});

ipcMain.handle("dashboard:dev-nudge-location", (_event, meters) => {
  if (!IS_DEV) return { ok: false, reason: "not-dev" };
  const base = lastDevDummy || DEV_DUMMY_DEFAULT;
  const m = Number(meters);
  const step = Number.isFinite(m) ? m : 50;
  // Unreal cm: +X roughly north on Gateway affine used here — nudge +Y for a second sample
  return injectDevDummyLocation({
    x: base.x + step * 100,
    y: base.y + step * 40,
    z: base.z,
    label: `${base.label || "DEV"} nudge`,
  });
});

ipcMain.handle("dashboard:window-minimize", () => {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.minimize();
});

ipcMain.handle("dashboard:window-maximize", () => {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return false;
  if (dashboardWindow.isMaximized()) dashboardWindow.unmaximize();
  else dashboardWindow.maximize();
  return dashboardWindow.isMaximized();
});

ipcMain.handle("dashboard:window-close", () => {
  hideDashboardToTray();
  return true;
});

ipcMain.handle("dashboard:quit", () => {
  isQuitting = true;
  userHidden = true;
  app.quit();
  return true;
});

ipcMain.handle("dashboard:window-is-maximized", () => {
  return Boolean(dashboardWindow && !dashboardWindow.isDestroyed() && dashboardWindow.isMaximized());
});
ipcMain.handle("dashboard:player-fullscreen", (_event, enabled) => {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) {
    return { ok: false, reason: "no-window" };
  }
  try {
    const on = Boolean(enabled);
    // Ensure window can enter OS fullscreen
    try {
      dashboardWindow.setFullScreenable(true);
    } catch {
      // ignore
    }
    if (on) {
      if (!dashboardWindow.isVisible()) dashboardWindow.show();
      dashboardWindow.focus();
      if (dashboardWindow.isMaximized()) {
        // leave maximized state cleanly before exclusive fullscreen
        try {
          dashboardWindow.unmaximize();
        } catch {
          // ignore
        }
      }
      dashboardWindow.setFullScreen(true);
    } else if (dashboardWindow.isFullScreen()) {
      dashboardWindow.setFullScreen(false);
    }
    return { ok: true, fullscreen: dashboardWindow.isFullScreen() };
  } catch (err) {
    console.warn("[dashboard] player-fullscreen", err);
    return { ok: false, message: err?.message || String(err) };
  }
});
ipcMain.handle("dashboard:player-fullscreen-state", () => {
  return Boolean(
    dashboardWindow &&
      !dashboardWindow.isDestroyed() &&
      dashboardWindow.isFullScreen()
  );
});

ipcMain.handle("screenshot:take", (_event, kind) =>
  takeScreenshot(kind === "screen" ? "screen" : "map")
);
ipcMain.handle("screenshot:list", (_event, filter) =>
  listScreenshots(filter || "all")
);
ipcMain.handle("screenshot:read", (_event, name) => readScreenshot(name));
ipcMain.handle("screenshot:delete", (_event, name) => deleteScreenshot(name));
ipcMain.handle("screenshot:reveal", (_event, name) => {
  const full = resolveScreenshotPath(name);
  if (!full || !fs.existsSync(full)) return { ok: false };
  shell.showItemInFolder(full);
  return { ok: true };
});
ipcMain.handle("screenshot:open-folder", async () => {
  const dir = screenshotsDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // ignore
  }
  const err = await shell.openPath(dir);
  return { ok: !err, error: err || null, path: dir };
});
ipcMain.handle("screenshot:dir", () => screenshotsDir());

ipcMain.handle("recording:get-source", () => getRecordingSource());
ipcMain.handle("recording:save", (_event, buffer, meta) =>
  saveRecordingBuffer(buffer, meta || {})
);
ipcMain.handle("share:media", (_event, payload) =>
  shareMediaFile(payload || {})
);
ipcMain.handle("recording:report-state", (_event, state) => {
  broadcastRecordingState(state || {});
  return recordingState;
});
ipcMain.handle("recording:state", () => recordingState);
ipcMain.handle("recording:debug", () => lastRecordingDebug);
ipcMain.handle("recording:command", (_event, action) =>
  sendRecordingCommand(action)
);
ipcMain.handle("recording:open-folder", () => openRecordingsFolder());
ipcMain.handle("recording:dir", () => recordingsDir());
ipcMain.handle("recording:list", () => listRecordings());
ipcMain.handle("recording:delete", (_event, name) => deleteRecording(name));
ipcMain.handle("recording:reveal", (_event, name) => revealRecording(name));
ipcMain.handle("recording:open", (_event, name) => openRecording(name));
ipcMain.handle("recording:probe", async (_event, name) => {
  const full = resolveRecordingPath(name);
  if (!full || !fs.existsSync(full)) {
    return { ok: false, reason: "missing" };
  }
  const buf = Buffer.alloc(Math.min(32, fs.statSync(full).size));
  const fd = fs.openSync(full, "r");
  try {
    fs.readSync(fd, buf, 0, buf.length, 0);
  } finally {
    fs.closeSync(fd);
  }
  const sniff = sniffMediaContainer(buf);
  const probe = await probeMediaWithFfmpeg(full);
  const debug = {
    at: new Date().toISOString(),
    stage: "probe-file",
    name,
    path: full,
    bytes: fs.statSync(full).size,
    sniff,
    probe,
    tip: probe.ok
      ? "File probes clean with ffmpeg."
      : /moov atom not found/i.test(probe.summary || "")
        ? "moov atom missing — typical of raw Chromium MediaRecorder MP4. This file cannot be repaired; record a new clip (WebM→MP4 path)."
        : "ffmpeg could not read a valid video stream — file is likely corrupt or incomplete.",
  };
  setRecordingDebug(debug);
  return { ok: probe.ok, ...debug };
});
