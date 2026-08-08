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

/** Survives app updates (lives in %AppData%/IsleMap). */
function userPlacesPath() {
  return path.join(app.getPath("userData"), "gateway-areas-user.json");
}

/** @deprecated alias — prefer userPlacesPath for customs */
function placesFilePath() {
  return app.isPackaged ? userPlacesPath() : bundledPlacesPath();
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

function emptyUserOverlay() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    deletedIds: [],
    places: [],
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
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn("[places] bad json", file, err?.message || err);
    return null;
  }
}

function normalizeUserOverlay(raw) {
  const base = emptyUserOverlay();
  if (!raw || typeof raw !== "object") return base;
  // Legacy: full gateway-areas doc saved in userData
  if (raw.categories && typeof raw.categories === "object") {
    return {
      version: 1,
      updatedAt: String(raw.scrapedAt || base.updatedAt),
      deletedIds: [],
      places: flattenPlaces(normalizeDoc(raw)).map((p) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        category: p.category,
        grid: p.grid,
      })),
    };
  }
  return {
    version: 1,
    updatedAt: String(raw.updatedAt || base.updatedAt),
    deletedIds: Array.isArray(raw.deletedIds)
      ? raw.deletedIds.map((id) => String(id))
      : [],
    places: Array.isArray(raw.places)
      ? raw.places
          .map((p) => ({
            id: String(p?.id || "").trim(),
            name: String(p?.name || "").trim(),
            x: Number(p?.x),
            y: Number(p?.y),
            category: String(p?.category || "landmark"),
            grid: p?.grid == null ? null : String(p.grid),
          }))
          .filter(
            (p) =>
              p.id &&
              p.name &&
              Number.isFinite(p.x) &&
              Number.isFinite(p.y) &&
              CATEGORY_KEYS[p.category]
          )
      : [],
  };
}

function readUserOverlay() {
  return normalizeUserOverlay(readJsonFile(userPlacesPath()));
}

function writeUserOverlay(overlay) {
  const normalized = normalizeUserOverlay(overlay);
  normalized.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(userPlacesPath()), { recursive: true });
  fs.writeFileSync(
    userPlacesPath(),
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8"
  );
  return normalized;
}

function mergeBundledWithUser(bundled, overlay) {
  const deleted = new Set(overlay.deletedIds || []);
  const byId = new Map();

  for (const place of flattenPlaces(bundled)) {
    if (deleted.has(place.id)) continue;
    byId.set(place.id, {
      id: place.id,
      name: place.name,
      x: place.x,
      y: place.y,
      category: place.category,
      grid: place.grid,
    });
  }

  for (const place of overlay.places || []) {
    if (deleted.has(place.id)) continue;
    byId.set(place.id, {
      id: place.id,
      name: place.name,
      x: place.x,
      y: place.y,
      category: place.category,
      grid: place.grid,
    });
  }

  return rebuildDocFromPlaces([...byId.values()], {
    source:
      (overlay.places || []).length || deleted.size
        ? "gateway-merged"
        : bundled.source || "gateway-bundled",
  });
}

function readPlacesDoc() {
  const bundledRaw = readJsonFile(bundledPlacesPath());
  const bundled = bundledRaw ? normalizeDoc(bundledRaw) : emptyDoc();
  const overlay = readUserOverlay();
  const merged = mergeBundledWithUser(bundled, overlay);
  return merged;
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

/**
 * Compute user overlay vs current bundled baseline so updates keep customs.
 */
function overlayFromFullPlaces(places) {
  const bundled = normalizeDoc(readJsonFile(bundledPlacesPath()) || emptyDoc());
  const bundledById = new Map(
    flattenPlaces(bundled).map((p) => [p.id, p])
  );
  const nextById = new Map();
  for (const p of places) {
    const check = validatePlaceInput(p);
    if (!check.ok) continue;
    let id = String(p.id || "").trim();
    if (!id) id = uniqueId(check.name, new Set(nextById.keys()));
    nextById.set(id, {
      id,
      name: check.name,
      x: check.x,
      y: check.y,
      category: check.category,
      grid:
        p.grid != null && String(p.grid).trim()
          ? String(p.grid).trim()
          : gridCode(check.x, check.y),
    });
  }

  const deletedIds = [];
  for (const id of bundledById.keys()) {
    if (!nextById.has(id)) deletedIds.push(id);
  }

  const customPlaces = [];
  for (const [id, place] of nextById) {
    const base = bundledById.get(id);
    if (!base) {
      customPlaces.push(place);
      continue;
    }
    const changed =
      base.name !== place.name ||
      Number(base.x) !== Number(place.x) ||
      Number(base.y) !== Number(place.y) ||
      base.category !== place.category ||
      String(base.grid || "") !== String(place.grid || "");
    if (changed) customPlaces.push(place);
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    deletedIds,
    places: customPlaces,
  };
}

/**
 * Unpackaged (dev): write full doc into repo JSON for the next release.
 * Packaged: write only a user overlay under userData (survives updates).
 */
function writePlacesDoc(docOrPlaces, options = {}) {
  const asPlaces = Array.isArray(docOrPlaces)
    ? docOrPlaces
    : flattenPlaces(normalizeDoc(docOrPlaces));

  // Always keep a user overlay so reinstall/update never loses customs
  const overlay = overlayFromFullPlaces(asPlaces);
  writeUserOverlay(overlay);

  let bundledFile = null;
  if (!app.isPackaged && options.shipBundled !== false) {
    const normalized = rebuildDocFromPlaces(asPlaces, {
      source: options.source || "gateway-bundled",
    });
    normalized.scrapedAt = new Date().toISOString();
    bundledFile = bundledPlacesPath();
    fs.mkdirSync(path.dirname(bundledFile), { recursive: true });
    fs.writeFileSync(
      bundledFile,
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf8"
    );
  }

  const merged = readPlacesDoc();
  broadcastPlacesUpdated(merged);
  return {
    ok: true,
    doc: merged,
    file: app.isPackaged ? userPlacesPath() : bundledFile || userPlacesPath(),
    userFile: userPlacesPath(),
    packaged: app.isPackaged,
    shipsWithRelease: !app.isPackaged,
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
  readUserOverlay,
  writeUserOverlay,
  flattenPlaces,
  rebuildDocFromPlaces,
  validatePlaceInput,
  uniqueId,
  slugify,
};
