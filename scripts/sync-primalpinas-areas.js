/**
 * Scrapes area / water / landmark data from https://primalpinas.online map bundle
 * and writes src/data/primalpinas-areas.json for bundling with IsleMap.
 *
 * Usage: node scripts/sync-primalpinas-areas.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src", "data", "primalpinas-areas.json");
const MAP_PAGE = "https://primalpinas.online/map";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "IsleMapAreaSync/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(new URL(res.headers.location, url).href).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function parseObjectArray(src, firstName) {
  const marker = `name:"${firstName}"`;
  const nameIdx = src.indexOf(marker);
  if (nameIdx < 0) throw new Error(`Marker not found: ${marker}`);
  // Walk back to the opening '[' of this array literal
  let bracket = nameIdx;
  while (bracket > 0 && src[bracket] !== "[") bracket--;
  if (src[bracket] !== "[") throw new Error(`No array start for ${firstName}`);

  let i = bracket;
  let depth = 0;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const literal = src.slice(bracket, i);
  // Numbers like 433e3 are valid JS — evaluate the array literal only.
  // eslint-disable-next-line no-new-func
  const arr = Function(`"use strict"; return (${literal});`)();
  return arr.map((item, index) => ({
    id: `${slug(item.name)}-${index}`,
    name: item.name,
    x: item.x,
    y: item.y,
    kind: item.kind || "landmark",
    grid: gridCode(item.x, item.y),
  }));
}

function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Same grid helper used by Primal Pinas map bundle (letter from X, number from Y). */
function gridCode(x, y) {
  const originX = -580000;
  const originY = -580000;
  const cell = 58000;
  const rows = 20;
  const cols = 20;
  const row = Math.floor((x - originX) / cell); // A–T from world X
  const col = Math.floor((y - originY) / cell); // 01–20 from world Y
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
  return `${String.fromCharCode(65 + row)}${String(col + 1).padStart(2, "0")}`;
}

async function findMapDataChunk(html) {
  const scripts = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map(
    (m) => m[0]
  );
  const unique = [...new Set(scripts)];
  // Prefer known shared map chunk pattern; also scan all
  for (const rel of unique) {
    const url = `https://primalpinas.online${rel}`;
    const js = await get(url);
    if (js.includes('name:"NE Cape"') && js.includes('name:"Lakeport')) {
      return { url, js };
    }
  }
  // Fallback: download webpack mapper and pull candidate chunks
  const webpackRel = unique.find((u) => u.includes("webpack-"));
  if (!webpackRel) throw new Error("Could not find map data chunk");
  const webpack = await get(`https://primalpinas.online${webpackRel}`);
  const specials = [
    ...webpack.matchAll(/static\/chunks\/([0-9a-z-]+\.js)/g),
  ].map((m) => m[1]);
  for (const file of [...new Set(specials)]) {
    const url = `https://primalpinas.online/_next/static/chunks/${file}`;
    try {
      const js = await get(url);
      if (js.includes('name:"NE Cape"')) return { url, js };
    } catch {
      // continue
    }
  }
  throw new Error("Map POI data not found in site bundles");
}

async function main() {
  console.log("Fetching", MAP_PAGE);
  const html = await get(MAP_PAGE);
  const { url, js } = await findMapDataChunk(html);
  console.log("Data chunk:", url);

  const areas = parseObjectArray(js, "NE Cape");
  const waters = parseObjectArray(js, "North Lake");
  const landmarks = parseObjectArray(js, "Derelict Base (C14)");

  // Deduplicate if overlapping parse windows (shouldn't, but be safe)
  const byKey = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      const k = `${p.name}|${p.x}|${p.y}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const payload = {
    version: 1,
    source: "https://primalpinas.online/map",
    attribution:
      "Area labels adapted from PRIMAL PINAS public map data (https://primalpinas.online/map). Not affiliated.",
    scrapedAt: new Date().toISOString(),
    sourceChunk: url,
    coordinateSpace: "unreal-cm",
    categories: {
      areas: byKey(areas).map((p) => ({ ...p, category: "area" })),
      waters: byKey(waters).map((p) => ({
        ...p,
        category: "water",
        kind: "water",
      })),
      landmarks: byKey(landmarks).map((p) => ({
        ...p,
        category: "landmark",
      })),
    },
  };

  const all = [
    ...payload.categories.areas,
    ...payload.categories.waters,
    ...payload.categories.landmarks,
  ];
  payload.count = all.length;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${OUT} (${payload.count} places: ${payload.categories.areas.length} areas, ${payload.categories.waters.length} waters, ${payload.categories.landmarks.length} landmarks)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
