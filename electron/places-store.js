const fs = require("fs");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const CATEGORY_KEYS = Object.freeze({
  area: "areas",
  water: "waters",
  landmark: "landmarks",
  wallow: "wallows",
});

function bundledPlacesPath() {
  return path.join(__dirname, "..", "src", "data", "gateway-areas.json");
}

function userPlacesPath() {
  return path.join(app.getPath("userData"), "gateway-areas.json");
}

/** Project JSON (editor writes here from unpackaged builds only). */
function placesFilePath() {
  return bundledPlacesPath();
}

function emptyDoc() {
  return {
    version: 1,
    source: "gateway-bundled",
    scrapedAt: new Date().toISOString(),
    coordinateSpace: "unreal-cm",
    count: 0,
    categories: {
      areas: [],
      waters: [],
      landmarks: [],
      wallows: [],
    },
  };
}

function normalizeDoc(raw) {
  const doc = raw && typeof raw === "object" ? raw : emptyDoc();
  const categories = {
    areas: Array.isArray(doc.categories?.areas) ? doc.categories.areas : [],
    waters: Array.isArray(doc.categories?.waters) ? doc.categories.waters : [],
    landmarks: Array.isArray(doc.categories?.landmarks)
      ? doc.categories.landmarks
      : [],
    wallows: Array.isArray(doc.categories?.wallows)
      ? doc.categories.wallows
      : [],
  };
  const count =
    categories.areas.length +
    categories.waters.length +
    categories.landmarks.length +
    categories.wallows.length;
  return {
    version: Number(doc.version) || 1,
    source: String(doc.source || "gateway-bundled"),
    scrapedAt: String(doc.scrapedAt || new Date().toISOString()),
    coordinateSpace: "unreal-cm",
    count,
    categories,
  };
}

function readJsonFile(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readPlacesDoc() {
  const bundled = readJsonFile(bundledPlacesPath());
  if (bundled) return normalizeDoc(bundled);
  return emptyDoc();
}

function flattenPlaces(doc) {
  const out = [];
  for (const [key, list] of Object.entries(doc.categories || {})) {
    if (!Array.isArray(list)) continue;
    for (const place of list) {
      out.push({
        ...place,
        categoryKey: key,
        category:
          place.category ||
          (key === "waters"
            ? "water"
            : key === "landmarks"
              ? "landmark"
              : key === "wallows"
                ? "wallow"
                : "area"),
      });
    }
  }
  return out;
}

function slugify(name) {
  const s = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "place";
}

function uniqueId(name, used) {
  const base = `${slugify(name)}-custom`;
  let id = base;
  let n = 0;
  while (used.has(id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}

function kindForCategory(category) {
  if (category === "water") return "water";
  if (category === "wallow") return "wallow";
  return "landmark";
}

/** Match IsleCoords.gridCode (Gateway A–T / 01–20). */
function gridCode(wx, wy) {
  const gridOriginX = -580000;
  const gridOriginY = -580000;
  const gridCell = 58000;
  const gridRows = 20;
  const gridCols = 20;
  const row = Math.floor((wx - gridOriginX) / gridCell);
  const col = Math.floor((wy - gridOriginY) / gridCell);
  if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) return null;
  return `${String.fromCharCode(65 + row)}${String(col + 1).padStart(2, "0")}`;
}

function validatePlaceInput(input) {
  const name = String(input?.name || "").trim();
  const category = String(input?.category || "").trim();
  const x = Number(input?.x);
  const y = Number(input?.y);
  if (!name) return { ok: false, reason: "name-required" };
  if (!CATEGORY_KEYS[category]) return { ok: false, reason: "category-invalid" };
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, reason: "coords-invalid" };
  }
  return { ok: true, name, category, x, y };
}

function rebuildDocFromPlaces(places, meta = {}) {
  const categories = { areas: [], waters: [], landmarks: [], wallows: [] };
  const used = new Set();
  for (const p of places) {
    const category = String(p.category || "landmark");
    const key = CATEGORY_KEYS[category];
    if (!key) continue;
    let id = String(p.id || "").trim();
    if (!id || used.has(id)) id = uniqueId(p.name, used);
    used.add(id);
    const x = Math.round(Number(p.x));
    const y = Math.round(Number(p.y));
    const grid =
      p.grid == null || p.grid === "" ? gridCode(x, y) : String(p.grid);
    categories[key].push({
      id,
      name: String(p.name || "").trim(),
      x,
      y,
      kind: kindForCategory(category),
      grid,
      category,
    });
  }
  const count =
    categories.areas.length +
    categories.waters.length +
    categories.landmarks.length +
    categories.wallows.length;
  return {
    version: 1,
    source: meta.source || "gateway-bundled",
    scrapedAt: new Date().toISOString(),
    coordinateSpace: "unreal-cm",
    count,
    categories,
  };
}

function writePlacesDoc(doc) {
  if (app.isPackaged) {
    return { ok: false, reason: "packaged" };
  }
  const normalized = normalizeDoc(doc);
  normalized.scrapedAt = new Date().toISOString();
  normalized.count =
    normalized.categories.areas.length +
    normalized.categories.waters.length +
    normalized.categories.landmarks.length +
    normalized.categories.wallows.length;
  const file = placesFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  broadcastPlacesUpdated(normalized);
  return {
    ok: true,
    doc: normalized,
    file,
    packaged: false,
    shipsWithRelease: true,
  };
}

function broadcastPlacesUpdated(doc) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("places:updated", {
        count: doc.count,
        scrapedAt: doc.scrapedAt,
      });
    }
  }
}

module.exports = {
  CATEGORY_KEYS,
  placesFilePath,
  bundledPlacesPath,
  userPlacesPath,
  readPlacesDoc,
  writePlacesDoc,
  flattenPlaces,
  rebuildDocFromPlaces,
  validatePlaceInput,
  uniqueId,
  slugify,
};
