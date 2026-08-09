const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DEFAULTS = Object.freeze({
  mapSize: 300,
  borderColor: "#5ec8ff",
  borderWidth: 3,
  borderGlow: 14,
  /** classic CSS ring | isle-evrima | primal-pinas photo frames */
  borderStyle: "classic",
  /** Custom frame alignment (photo borders) */
  frameScale: 1.49,
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameHoleX: 50,
  frameHoleY: 47.36,
  frameMapScale: 1.04,
  framePad: 0.26,
  /** Draw map + pins above the custom frame art */
  frameMapOnTop: false,
  mapOpacity: 1,
  mapDesign: "tactical", // see MAP_DESIGNS
  /** Island basemap image (Gateway art packs share the same world coords) */
  basemap: "gateway-official",
  pinColor: "#5ef0ff",
  fovColor: "#b6ff4a",
  /** Player marker: dot (classic) | dino | custom */
  playerIconStyle: "dino",
  /** data: URL for custom player icon (png/jpg/webp/svg) */
  playerIconCustomData: "",
  playerIconCustomName: "",
  showFov: true,
  showCompass: true,
  showChrome: false,
  /** Counterclockwise radar sweep overlay */
  showRadarSweep: false,
  /** Full rotation period in seconds (2–12) */
  radarSweepSeconds: 4,
  showAreas: true,
  showWaters: true,
  showLandmarks: true,
  showWallows: true,
  showSanctuaries: true,
  // How places render on the radar: none | icon | label | icon-label
  placeStyle: "icon-label",
  /** Whole Electron window opacity (true see-through over the game) */
  windowOpacity: 1,
  /** Radar chrome + markers fade (CSS) */
  overlayOpacity: 1,
  position: "top-right", // top-right | top-left | bottom-right | bottom-left
  /** Which monitor hosts the overlay: primary | game | <display id> */
  overlayDisplay: "primary",
  zoom: 1,
  followPlayer: true, // recenter radar on each Copy Location
  /** When true, Show map only paints while The Isle is focused / running */
  requireGameFocus: true,
  /** Stick off-screen place icons to the radar rim */
  edgePins: true,
  /** Which categories may stick to the rim (keeps radar uncluttered) */
  edgeAreas: false,
  edgeWaters: true,
  edgeLandmarks: false,
  edgeWallows: true,
  edgeSanctuaries: true,
  /** Hotkey filter: all | waters | areas | landmarks | wallows | sanctuaries */
  placeFilter: "all",
  /** Hide place icons farther than placeNearbyRadiusKm from the player pin */
  placeNearbyOnly: false,
  /** Radius in km when placeNearbyOnly is on (0.5–10) */
  placeNearbyRadiusKm: 2,
  /** Customizable global shortcuts (Electron accelerators) */
  hotkeyPlayMode: "F9",
  hotkeyRecenter: "CommandOrControl+Shift+R",
  hotkeyToggleOverlay: "CommandOrControl+Shift+M",
  hotkeyRepin: "CommandOrControl+Shift+T",
  hotkeyDashboard: "CommandOrControl+Shift+D",
  hotkeyPlaceFilter: "F8",
  hotkeyFilterAll: "CommandOrControl+Shift+1",
  hotkeyFilterWaters: "CommandOrControl+Shift+2",
  hotkeyFilterAreas: "CommandOrControl+Shift+3",
  hotkeyFilterLandmarks: "CommandOrControl+Shift+4",
  hotkeyFilterWallows: "CommandOrControl+Shift+5",
  hotkeyFilterSanctuaries: "CommandOrControl+Shift+6",
  hotkeyZoomIn: "F7",
  hotkeyZoomOut: "F6",
  /** User destination pin from dashboard map */
  waypointEnabled: false,
  waypointX: null,
  waypointY: null,
  waypointLabel: "Go here",
  waypointColor: "#ff7a45",
  /** Line from current Copy Location pin to destination */
  navPath: true,
  navPathColor: "#ffb347",
  /** Overlay waypoint marker flag */
  showWaypointPin: true,
  /** Overlay waypoint name + remaining distance text */
  showWaypointLabel: true,
  /** First-run welcome / tutorial gate */
  tutorialCompleted: false,
  /** Group sync — display name only (PC ID is separate, no accounts) */
  groupUsername: "",
  groupLastCode: "",
  /** Optional overrides; empty = use env / defaults */
  groupPusherKey: "",
  groupPusherCluster: "",
  groupAuthUrl: "",
});

function settingsPath() {
  return path.join(app.getPath("userData"), "islemap-settings.json");
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const MAP_DESIGNS = Object.freeze([
  "tactical",
  "satellite",
  "night",
  "phosphor",
  "thermal",
  "arctic",
  "amber",
  "verdant",
  "topo",
  "noir",
]);

const BASEMAPS = Object.freeze(["gateway", "gateway-official"]);

const BORDER_STYLES = Object.freeze([
  "classic",
  "isle-evrima",
  "primal-pinas",
]);

const HOTKEY_KEYS = Object.freeze([
  "hotkeyPlayMode",
  "hotkeyRecenter",
  "hotkeyToggleOverlay",
  "hotkeyRepin",
  "hotkeyDashboard",
  "hotkeyPlaceFilter",
  "hotkeyFilterAll",
  "hotkeyFilterWaters",
  "hotkeyFilterAreas",
  "hotkeyFilterLandmarks",
  "hotkeyFilterWallows",
  "hotkeyFilterSanctuaries",
  "hotkeyZoomIn",
  "hotkeyZoomOut",
]);

function isValidAccelerator(value) {
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (!t || t.length > 80) return false;
  if (!/^[A-Za-z0-9+\-=]+$/.test(t)) return false;
  const parts = t.split("+").filter(Boolean);
  if (!parts.length) return false;
  const key = parts[parts.length - 1];
  if (
    /^(CommandOrControl|Control|Ctrl|Cmd|Command|Alt|Option|Shift|Super|Meta)$/i.test(
      key
    )
  ) {
    return false;
  }
  return true;
}

function normalizeAccelerator(value, fallback) {
  const t = String(value || "").trim();
  if (isValidAccelerator(t)) return t;
  return fallback;
}

function normalize(raw = {}) {
  const isExistingProfile = Boolean(raw && Object.keys(raw).length);
  const s = { ...DEFAULTS, ...raw };
  s.mapSize = clamp(Number(s.mapSize) || DEFAULTS.mapSize, 160, 640);
  s.borderWidth = clamp(Number(s.borderWidth) || DEFAULTS.borderWidth, 1, 10);
  s.borderGlow = clamp(Number(s.borderGlow) || DEFAULTS.borderGlow, 0, 40);
  s.mapOpacity = clamp(Number(s.mapOpacity) ?? DEFAULTS.mapOpacity, 0.1, 1);
  s.windowOpacity = clamp(
    Number(s.windowOpacity) ?? DEFAULTS.windowOpacity,
    0.15,
    1
  );
  s.overlayOpacity = clamp(
    Number(s.overlayOpacity) ?? DEFAULTS.overlayOpacity,
    0.15,
    1
  );
  s.zoom = clamp(Number(s.zoom) || 0, -2, 3);
  if (!MAP_DESIGNS.includes(s.mapDesign)) {
    s.mapDesign = DEFAULTS.mapDesign;
  }
  if (!BASEMAPS.includes(s.basemap)) {
    s.basemap = DEFAULTS.basemap;
  }
  if (!BORDER_STYLES.includes(s.borderStyle)) {
    s.borderStyle = DEFAULTS.borderStyle;
  }
  s.frameScale = clamp(Number(s.frameScale) || DEFAULTS.frameScale, 1, 2.4);
  s.frameOffsetX = clamp(Number(s.frameOffsetX) || 0, -80, 80);
  s.frameOffsetY = clamp(Number(s.frameOffsetY) || 0, -80, 80);
  s.frameHoleX = clamp(Number(s.frameHoleX) || DEFAULTS.frameHoleX, 35, 65);
  s.frameHoleY = clamp(Number(s.frameHoleY) || DEFAULTS.frameHoleY, 35, 65);
  s.frameMapScale = clamp(
    Number(s.frameMapScale) || DEFAULTS.frameMapScale,
    0.8,
    1.35
  );
  s.framePad = clamp(Number(s.framePad) || DEFAULTS.framePad, 0.12, 0.5);
  s.frameMapOnTop = Boolean(s.frameMapOnTop);
  if (
    !["top-right", "top-left", "bottom-right", "bottom-left"].includes(
      s.position
    )
  ) {
    s.position = DEFAULTS.position;
  }
  {
    const od = String(s.overlayDisplay ?? DEFAULTS.overlayDisplay).trim();
    if (od === "primary" || od === "game" || /^\d+$/.test(od)) {
      s.overlayDisplay = od;
    } else {
      s.overlayDisplay = DEFAULTS.overlayDisplay;
    }
  }
  s.showFov = Boolean(s.showFov);
  s.showCompass = s.showCompass !== false;
  s.showChrome = Boolean(s.showChrome);
  s.showRadarSweep = Boolean(s.showRadarSweep);
  {
    let sec = Number(s.radarSweepSeconds);
    if (!Number.isFinite(sec)) sec = DEFAULTS.radarSweepSeconds;
    s.radarSweepSeconds = Math.min(12, Math.max(2, Math.round(sec * 2) / 2));
  }
  s.showAreas = s.showAreas !== false;
  s.showWaters = s.showWaters !== false;
  s.showLandmarks = s.showLandmarks !== false;
  s.showWallows = s.showWallows !== false;
  s.showSanctuaries = s.showSanctuaries !== false;
  // Migrate older boolean setting
  if (s.placeStyle == null && typeof s.showAreaLabels === "boolean") {
    s.placeStyle = s.showAreaLabels ? "icon-label" : "icon";
  }
  if (!["none", "icon", "label", "icon-label"].includes(s.placeStyle)) {
    s.placeStyle = DEFAULTS.placeStyle;
  }
  delete s.showAreaLabels;
  s.followPlayer = s.followPlayer !== false;
  s.requireGameFocus = s.requireGameFocus !== false;
  s.edgePins = s.edgePins !== false;
  s.edgeAreas = Boolean(s.edgeAreas);
  s.edgeWaters = s.edgeWaters !== false;
  s.edgeLandmarks = Boolean(s.edgeLandmarks);
  s.edgeWallows = s.edgeWallows !== false;
  s.edgeSanctuaries = s.edgeSanctuaries !== false;
  if (
    ![
      "all",
      "waters",
      "areas",
      "landmarks",
      "wallows",
      "sanctuaries",
    ].includes(s.placeFilter)
  ) {
    s.placeFilter = DEFAULTS.placeFilter;
  }
  s.placeNearbyOnly = Boolean(s.placeNearbyOnly);
  {
    let r = Number(s.placeNearbyRadiusKm);
    if (!Number.isFinite(r)) r = DEFAULTS.placeNearbyRadiusKm;
    s.placeNearbyRadiusKm = Math.min(10, Math.max(0.5, Math.round(r * 2) / 2));
  }
  for (const key of HOTKEY_KEYS) {
    s[key] = normalizeAccelerator(s[key], DEFAULTS[key]);
  }
  s.borderColor = String(s.borderColor || DEFAULTS.borderColor);
  s.pinColor = String(s.pinColor || DEFAULTS.pinColor);
  s.fovColor = String(s.fovColor || DEFAULTS.fovColor);
  if (!["dot", "dino", "custom"].includes(s.playerIconStyle)) {
    s.playerIconStyle = DEFAULTS.playerIconStyle;
  }
  {
    const data = String(s.playerIconCustomData || "");
    const ok =
      data.startsWith("data:image/") && data.length <= 600000;
    s.playerIconCustomData = ok ? data : "";
    s.playerIconCustomName = s.playerIconCustomData
      ? String(s.playerIconCustomName || "custom").slice(0, 80)
      : "";
  }
  const wx = Number(s.waypointX);
  const wy = Number(s.waypointY);
  s.waypointEnabled = Boolean(s.waypointEnabled) && Number.isFinite(wx) && Number.isFinite(wy);
  s.waypointX = s.waypointEnabled ? wx : null;
  s.waypointY = s.waypointEnabled ? wy : null;
  s.waypointLabel = String(s.waypointLabel || DEFAULTS.waypointLabel).slice(0, 40);
  s.waypointColor = String(s.waypointColor || DEFAULTS.waypointColor);
  s.navPath = s.navPath !== false;
  s.navPathColor = String(s.navPathColor || DEFAULTS.navPathColor);
  s.showWaypointPin = s.showWaypointPin !== false;
  s.showWaypointLabel = s.showWaypointLabel !== false;
  if (raw.tutorialCompleted == null && isExistingProfile) {
    s.tutorialCompleted = true;
  } else {
    s.tutorialCompleted = Boolean(s.tutorialCompleted);
  }
  s.groupUsername = String(s.groupUsername || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  s.groupLastCode = String(s.groupLastCode || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  s.groupPusherKey = String(s.groupPusherKey || "").trim().slice(0, 64);
  s.groupPusherCluster = String(s.groupPusherCluster || "")
    .trim()
    .slice(0, 16);
  s.groupAuthUrl = String(s.groupAuthUrl || "").trim().slice(0, 240);
  return s;
}

function readSettingsFile() {
  try {
    const file = settingsPath();
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn("[settings] read failed", err);
    return null;
  }
}

function loadSettings() {
  try {
    const raw = readSettingsFile();
    if (!raw) return normalize();
    return normalize(raw);
  } catch (err) {
    console.warn("[settings] load failed", err);
    return normalize();
  }
}

/**
 * Merge onto the on-disk profile so partial updates never wipe
 * group username, waypoints, or other fields (survives app updates).
 * Pass { replace: true } for an explicit factory reset.
 */
function saveSettings(next, options = {}) {
  const prev = options.replace ? {} : readSettingsFile() || {};
  const normalized = normalize({ ...prev, ...(next || {}) });
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(
      settingsPath(),
      JSON.stringify(normalized, null, 2),
      "utf8"
    );
  } catch (err) {
    console.warn("[settings] save failed", err);
  }
  return normalized;
}

module.exports = {
  DEFAULTS,
  HOTKEY_KEYS,
  MAP_DESIGNS,
  BASEMAPS,
  BORDER_STYLES,
  loadSettings,
  saveSettings,
  settingsPath,
  normalize,
  isValidAccelerator,
  normalizeAccelerator,
};
