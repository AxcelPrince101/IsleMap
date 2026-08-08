const {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  shell,
  Tray,
} = require("electron");
const fs = require("fs");
const path = require("path");
require("./load-env").loadProjectEnv();
const {
  loadSettings,
  saveSettings,
  DEFAULTS,
  HOTKEY_KEYS,
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
  app.on("second-instance", () => {
    openDashboard();
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

const POLL_MS = 300;
const TOPMOST_MS = 400;
/** Hide after this many inactive polls (~800ms) to avoid Alt-Tab flicker */
const GAME_FOCUS_HIDE_TICKS = 2;
const TOP_LEVEL = "screen-saver";
const GAME_TITLE_RE = /the\s*isle|theisle/i;
const APP_ICON = path.join(__dirname, "..", "build", "icon.png");

function overlayOuterSize(s = settings) {
  const pad = Math.ceil(s.borderGlow + s.borderWidth + 10);
  const core = s.mapSize;
  let width = core + pad * 2;
  let height = s.showChrome ? core + pad * 2 + 72 : core + pad * 2;
  // Stone frame uses content-box padding around a square radar
  if (String(s.borderStyle) === "isle-evrima") {
    const padRatio = Number(s.framePad);
    const side = Math.ceil(core * (Number.isFinite(padRatio) ? padRatio : 0.26));
    const scale = Number(s.frameScale) || 1.49;
    const top = Math.ceil(core * Math.max(0.16, (scale - 1) * 0.45));
    const bottom = Math.ceil(core * Math.max(0.28, (scale - 1) * 0.7));
    width = core + side * 2 + 8;
    height = core + top + bottom + 8 + (s.showChrome ? 72 : 0);
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
    syncOverlayToGameFocus();
  } else {
    keepAboveGame(true);
  }
  if (hotkeysChanged(prevHotkeys, settings)) {
    registerHotkeys();
  }
  return settings;
}

const PLACE_FILTER_CYCLE = ["all", "waters", "areas", "landmarks", "wallows"];
const PLACE_FILTER_LABELS = {
  all: "All places",
  waters: "Water only",
  areas: "Areas only",
  landmarks: "Landmarks only",
  wallows: "Wallows only",
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
      // HWND_TOPMOST=-1, HWND_NOTOPMOST=-2 — pass as numbers
      HWND_TOPMOST: -1,
      HWND_NOTOPMOST: -2,
      GWL_STYLE: -16,
      GWLP_HWNDPARENT: -8,
      GWL_EXSTYLE: -20,
      // Native caption / border bits that DWM sometimes restores on transparent overlays
      WS_BORDER: 0x00800000,
      WS_DLGFRAME: 0x00400000,
      WS_CAPTION: 0x00c00000,
      WS_SYSMENU: 0x00080000,
      WS_THICKFRAME: 0x00040000,
      WS_EX_NOACTIVATE: 0x08000000,
      WS_EX_TRANSPARENT: 0x00000020,
      WS_EX_TOOLWINDOW: 0x00000080,
      WS_EX_WINDOWEDGE: 0x00000100,
      WS_EX_CLIENTEDGE: 0x00000200,
      WS_EX_DLGMODALFRAME: 0x00000001,
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
    // Parenting can restore a native caption strip — strip it immediately
    stripOverlayCaption(overlayHwnd);
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
  if (gameHwnd) attachToGameWindow(gameHwnd);

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

    // When the game is focused (moving/typing), force a topmost refresh
    if (forceToggle || gameIsForeground) {
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
 * DWM sometimes paints WS_CAPTION after focus, parenting, or style toggles.
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
      api.WS_SYSMENU;
    const nextStyle = style & ~styleMask;
    if (nextStyle !== style) {
      api.SetWindowLongPtrW(target, api.GWL_STYLE, nextStyle);
    }

    let ex = Number(api.GetWindowLongPtrW(target, api.GWL_EXSTYLE));
    if (!Number.isFinite(ex)) ex = 0;
    const exMask =
      api.WS_EX_WINDOWEDGE | api.WS_EX_CLIENTEDGE | api.WS_EX_DLGMODALFRAME;
    let nextEx = (ex | api.WS_EX_TOOLWINDOW) & ~exMask;
    if (nextEx !== ex) {
      api.SetWindowLongPtrW(target, api.GWL_EXSTYLE, nextEx);
    }

    api.SetWindowPos(target, api.HWND_TOPMOST, 0, 0, 0, 0, api.SWP_REAPPLY);
  } catch (err) {
    console.warn("[win32] stripOverlayCaption", err);
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
  return {
    enabled,
    visible,
    waitingForGame: enabled && !visible && requireGameFocus,
    requireGameFocus,
  };
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

  if (!mainWindow || mainWindow.isDestroyed()) {
    if (visible) createWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return {
        enabled: false,
        visible: false,
        waitingForGame: false,
        requireGameFocus: settings?.requireGameFocus !== false,
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
    stripOverlayCaption();
    applyWindowOpacity(settings);
    applyPlayInputMode(true);
    stripOverlayCaption();
    broadcastOverlayVisibility();
  });

  mainWindow.on("show", () => {
    stripOverlayCaption();
  });

  mainWindow.on("blur", () => {
    setTimeout(() => {
      stripOverlayCaption();
      keepAboveGame(true);
    }, 30);
  });

  mainWindow.on("focus", () => {
    stripOverlayCaption();
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
    if (IS_DEV && process.env.ISLEMAP_NO_DUMMY !== "1") {
      setTimeout(() => injectDevDummyLocation(lastDevDummy || DEV_DUMMY_DEFAULT), 250);
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

function openDashboard() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
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
  });

  return dashboardWindow;
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

    publishPlayerLocation(coords);
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

  safeRegister(hk.hotkeyZoomIn || DEFAULTS.hotkeyZoomIn, () => {
    nudgeZoom(0.25);
  });
  safeRegister(hk.hotkeyZoomOut || DEFAULTS.hotkeyZoomOut, () => {
    nudgeZoom(-0.25);
  });
}

if (gotLock) {
  app.whenReady().then(() => {
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
    createWindow();
    openDashboard();
    createTray();
    startClipboardPoll();
    startTopmostWatch();
    registerHotkeys();
    broadcastOverlayVisibility();

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
