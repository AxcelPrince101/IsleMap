(() => {
  const api = window.isleDashboard;
  if (!api) {
    document.body.innerHTML =
      "<p style='padding:24px'>Dashboard bridge missing. Restart with npm start.</p>";
    return;
  }

  const fields = {
    mapDesign: document.getElementById("mapDesign"),
    borderStyle: document.getElementById("borderStyle"),
    borderColor: document.getElementById("borderColor"),
    pinColor: document.getElementById("pinColor"),
    playerIconStyle: document.getElementById("playerIconStyle"),
    fovColor: document.getElementById("fovColor"),
    borderWidth: document.getElementById("borderWidth"),
    borderGlow: document.getElementById("borderGlow"),
    frameScale: document.getElementById("frameScale"),
    frameMapScale: document.getElementById("frameMapScale"),
    frameOffsetX: document.getElementById("frameOffsetX"),
    frameOffsetY: document.getElementById("frameOffsetY"),
    frameHoleX: document.getElementById("frameHoleX"),
    frameHoleY: document.getElementById("frameHoleY"),
    framePad: document.getElementById("framePad"),
    frameMapOnTop: document.getElementById("frameMapOnTop"),
    windowOpacity: document.getElementById("windowOpacity"),
    mapOpacity: document.getElementById("mapOpacity"),
    overlayOpacity: document.getElementById("overlayOpacity"),
    showFov: document.getElementById("showFov"),
    showCompass: document.getElementById("showCompass"),
    showRadarSweep: document.getElementById("showRadarSweep"),
    radarSweepSeconds: document.getElementById("radarSweepSeconds"),
    showAreas: document.getElementById("showAreas"),
    showWaypointPin: document.getElementById("showWaypointPin"),
    showWaypointLabel: document.getElementById("showWaypointLabel"),
    showWaters: document.getElementById("showWaters"),
    showLandmarks: document.getElementById("showLandmarks"),
    placeStyle: document.getElementById("placeStyle"),
    placeFilter: document.getElementById("placeFilter"),
    placeNearbyOnly: document.getElementById("placeNearbyOnly"),
    placeNearbyRadiusKm: document.getElementById("placeNearbyRadiusKm"),
    edgePins: document.getElementById("edgePins"),
    edgeWaters: document.getElementById("edgeWaters"),
    edgeAreas: document.getElementById("edgeAreas"),
    edgeLandmarks: document.getElementById("edgeLandmarks"),
    showChrome: document.getElementById("showChrome"),
    mapSize: document.getElementById("mapSize"),
    zoom: document.getElementById("zoom"),
    overlayDisplay: document.getElementById("overlayDisplay"),
    position: document.getElementById("position"),
    followPlayer: document.getElementById("followPlayer"),
    waypointLabel: document.getElementById("waypointLabel"),
    waypointColor: document.getElementById("waypointColor"),
    navPath: document.getElementById("navPath"),
    navPathColor: document.getElementById("navPathColor"),
  };

  const labels = {
    borderWidthVal: document.getElementById("borderWidthVal"),
    borderGlowVal: document.getElementById("borderGlowVal"),
    windowOpacityVal: document.getElementById("windowOpacityVal"),
    mapOpacityVal: document.getElementById("mapOpacityVal"),
    overlayOpacityVal: document.getElementById("overlayOpacityVal"),
    mapSizeVal: document.getElementById("mapSizeVal"),
    zoomVal: document.getElementById("zoomVal"),
    frameScaleVal: document.getElementById("frameScaleVal"),
    frameMapScaleVal: document.getElementById("frameMapScaleVal"),
    frameOffsetXVal: document.getElementById("frameOffsetXVal"),
    frameOffsetYVal: document.getElementById("frameOffsetYVal"),
    frameHoleXVal: document.getElementById("frameHoleXVal"),
    frameHoleYVal: document.getElementById("frameHoleYVal"),
    framePadVal: document.getElementById("framePadVal"),
    placeNearbyRadiusVal: document.getElementById("placeNearbyRadiusVal"),
    radarSweepSecondsVal: document.getElementById("radarSweepSecondsVal"),
  };

  const FRAME_ALIGN_DEFAULTS = {
    frameScale: 1.49,
    frameOffsetX: 0,
    frameOffsetY: 0,
    frameHoleX: 50,
    frameHoleY: 47.36,
    frameMapScale: 1.04,
    framePad: 0.26,
    frameMapOnTop: false,
  };

  const preview = document.getElementById("preview-radar");
  const saveState = document.getElementById("save-state");
  const panelTitle = document.getElementById("panel-title");
  const panelSub = document.getElementById("panel-sub");
  const contentEl = document.querySelector(".content");
  const destCoords = document.getElementById("dest-coords");
  const destClear = document.getElementById("dest-clear");
  const destMapEl = document.getElementById("dest-map");
  const destLayerToggles = {
    grid: document.getElementById("destShowGrid"),
    areas: document.getElementById("destShowAreas"),
    waters: document.getElementById("destShowWaters"),
    landmarks: document.getElementById("destShowLandmarks"),
  };

  const panelMeta = {
    overlay: {
      title: "Overlay",
      sub: "Style, frame align, HUD, places, opacity, and placement.",
    },
    destination: {
      title: "Destination",
      sub: "Set a Gateway waypoint and navigation path.",
    },
    game: {
      title: "Game & hotkeys",
      sub: "EAC-safe usage, bindings, and system notes.",
    },
    tutorial: {
      title: "Tutorial",
      sub: "Learn Asset Location, overlay modes, monitors, and waypoints.",
    },
    developer: {
      title: "Developer",
      sub: "Balake Gaming · updates via GitHub releases",
    },
  };

  const PANEL_ALIASES = {
    appearance: { panel: "overlay", tab: "visual" },
    transparency: { panel: "overlay", tab: "opacity" },
    layout: { panel: "overlay", tab: "layout" },
  };

  const HOTKEY_DEFS = [
    { key: "hotkeyPlayMode", label: "Play / Map mode", hint: "Toggle click-through" },
    { key: "hotkeyRecenter", label: "Recenter", hint: "Center radar on last pin" },
    { key: "hotkeyToggleOverlay", label: "Hide / show overlay", hint: "Toggle radar visibility" },
    { key: "hotkeyRepin", label: "Re-pin overlay", hint: "Attach above The Isle again" },
    { key: "hotkeyDashboard", label: "Open dashboard", hint: "Focus this window" },
    { key: "hotkeyPlaceFilter", label: "Cycle place filter", hint: "All → Water → Areas → Landmarks" },
    { key: "hotkeyFilterAll", label: "Filter: All", hint: "Show every place type" },
    { key: "hotkeyFilterWaters", label: "Filter: Water", hint: "Water POIs only" },
    { key: "hotkeyFilterAreas", label: "Filter: Areas", hint: "Areas only" },
    { key: "hotkeyFilterLandmarks", label: "Filter: Landmarks", hint: "Landmarks only" },
    { key: "hotkeyZoomIn", label: "Zoom in", hint: "Radar follow zoom +" },
    { key: "hotkeyZoomOut", label: "Zoom out", hint: "Radar follow zoom −" },
  ];

  const HOTKEY_DEFAULTS = {
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
    hotkeyZoomIn: "F7",
    hotkeyZoomOut: "F6",
  };

  let applying = false;
  let saveTimer = null;
  let waypointTimer = null;
  let hotkeyValues = { ...HOTKEY_DEFAULTS };
  let recordingKey = null;
  let playerIconCustomData = "";
  let playerIconCustomName = "";
  /** @type {{ x: number, y: number, z?: number } | null} */
  let playerLocation = null;
  /** @type {{ enabled: boolean, x: number|null, y: number|null, label: string, color: string }} */
  let waypoint = {
    enabled: false,
    x: null,
    y: null,
    label: "Go here",
    color: "#ff7a45",
  };

  const edgePinChecks = document.getElementById("edgePinChecks");

  /** @type {any} */
  let destMap = null;
  /** @type {any} */
  let destMarker = null;
  /** @type {any} */
  let destGridLayer = null;
  /** @type {any} */
  let destPlacesLayer = null;
  /** @type {Array<{ place: any, category: string, marker: any }>} */
  let destPlaceRecords = [];
  let destPlacesLoaded = false;

  function syncEdgeChecklistState() {
    const on = fields.edgePins.checked;
    if (edgePinChecks) edgePinChecks.classList.toggle("is-disabled", !on);
    fields.edgeWaters.disabled = !on;
    fields.edgeAreas.disabled = !on;
    fields.edgeLandmarks.disabled = !on;
  }

  function syncNearbyRadiusState() {
    const on = Boolean(fields.placeNearbyOnly?.checked);
    const field = document.getElementById("field-place-nearby-radius");
    field?.classList.toggle("is-dimmed", !on);
    if (fields.placeNearbyRadiusKm) fields.placeNearbyRadiusKm.disabled = !on;
  }

  function syncRadarSweepState() {
    const on = Boolean(fields.showRadarSweep?.checked);
    const field = document.getElementById("field-radar-sweep-speed");
    field?.classList.toggle("is-dimmed", !on);
    if (fields.radarSweepSeconds) fields.radarSweepSeconds.disabled = !on;
  }

  function syncPlayerIconCustomRow() {
    const style = fields.playerIconStyle?.value || "dino";
    const row = document.getElementById("player-icon-custom-row");
    if (row) {
      if (style === "custom") row.removeAttribute("hidden");
      else row.setAttribute("hidden", "");
    }
    const nameEl = document.getElementById("player-icon-custom-name");
    if (nameEl) {
      nameEl.textContent = playerIconCustomName
        ? playerIconCustomName
        : "No image selected — choose a PNG/JPG/WebP/SVG";
    }
  }

  function toHexColor(value) {
    if (!value) return "#5ec8ff";
    if (value.startsWith("#") && value.length === 7) return value;
    return value;
  }

  function updateLabels(s) {
    labels.borderWidthVal.textContent = String(s.borderWidth);
    labels.borderGlowVal.textContent = String(s.borderGlow);
    labels.windowOpacityVal.textContent = `${Math.round(s.windowOpacity * 100)}%`;
    labels.mapOpacityVal.textContent = `${Math.round(s.mapOpacity * 100)}%`;
    labels.overlayOpacityVal.textContent = `${Math.round(s.overlayOpacity * 100)}%`;
    labels.mapSizeVal.textContent = `${s.mapSize}px`;
    labels.zoomVal.textContent = String(s.zoom);
    if (labels.frameScaleVal) {
      labels.frameScaleVal.textContent = Number(s.frameScale ?? 1.49).toFixed(2);
    }
    if (labels.frameMapScaleVal) {
      labels.frameMapScaleVal.textContent = Number(s.frameMapScale ?? 1.04).toFixed(2);
    }
    if (labels.frameOffsetXVal) {
      labels.frameOffsetXVal.textContent = String(Math.round(s.frameOffsetX || 0));
    }
    if (labels.frameOffsetYVal) {
      labels.frameOffsetYVal.textContent = String(Math.round(s.frameOffsetY || 0));
    }
    if (labels.frameHoleXVal) {
      labels.frameHoleXVal.textContent = Number(s.frameHoleX ?? 50).toFixed(1);
    }
    if (labels.frameHoleYVal) {
      labels.frameHoleYVal.textContent = Number(s.frameHoleY ?? 47.36).toFixed(1);
    }
    if (labels.framePadVal) {
      labels.framePadVal.textContent = Number(s.framePad ?? 0.26).toFixed(2);
    }
    if (labels.placeNearbyRadiusVal) {
      labels.placeNearbyRadiusVal.textContent = Number(
        s.placeNearbyRadiusKm ?? 2
      ).toFixed(1);
    }
    if (labels.radarSweepSecondsVal) {
      labels.radarSweepSecondsVal.textContent = Number(
        s.radarSweepSeconds ?? 4
      ).toFixed(1);
    }
  }

  function applyFrameCssVars(s) {
    const root = document.documentElement;
    root.style.setProperty("--frame-scale", String(Number(s.frameScale) || 1.49));
    root.style.setProperty("--frame-hole-x", `${Number(s.frameHoleX) || 50}%`);
    root.style.setProperty("--frame-hole-y", `${Number(s.frameHoleY) || 47.36}%`);
    root.style.setProperty("--frame-offset-x", `${Number(s.frameOffsetX) || 0}px`);
    root.style.setProperty("--frame-offset-y", `${Number(s.frameOffsetY) || 0}px`);
    root.style.setProperty("--frame-map-scale", String(Number(s.frameMapScale) || 1));
    root.style.setProperty("--frame-pad", String(Number(s.framePad) || 0.26));
  }

  function updatePreview(s) {
    const root = document.documentElement;
    root.style.setProperty("--border-color", s.borderColor);
    root.style.setProperty("--border-width", `${s.borderWidth}px`);
    root.style.setProperty("--border-glow", `${s.borderGlow}px`);
    root.style.setProperty("--pin", s.pinColor);
    root.style.setProperty("--fov", s.fovColor);
    applyFrameCssVars(s);
    preview.dataset.design = s.mapDesign;
    preview.dataset.border = s.borderStyle || "classic";
    preview.dataset.frameStack = s.frameMapOnTop ? "map-top" : "frame-top";
    preview.classList.toggle("hide-fov", !s.showFov);
    preview.classList.toggle(
      "hide-compass",
      s.showCompass === false || s.borderStyle === "isle-evrima"
    );
    preview.style.opacity = String(
      Math.min(s.windowOpacity ?? 1, s.overlayOpacity ?? 1)
    );
    const sweepOn = Boolean(s.showRadarSweep);
    let sweepSec = Number(s.radarSweepSeconds);
    if (!Number.isFinite(sweepSec)) sweepSec = 4;
    root.style.setProperty("--radar-sweep-seconds", `${sweepSec}s`);
    const previewSweep = document.getElementById("preview-sweep");
    const previewRings = document.getElementById("preview-rings");
    if (previewSweep) {
      if (sweepOn) previewSweep.removeAttribute("hidden");
      else previewSweep.setAttribute("hidden", "");
    }
    if (previewRings) {
      if (sweepOn) previewRings.removeAttribute("hidden");
      else previewRings.setAttribute("hidden", "");
    }
    preview.classList.toggle("radar-sweep-on", sweepOn);
    syncPreviewPlayerIcon(s);
    syncBorderStyleFields(s.borderStyle || "classic");
  }

  function syncPreviewPlayerIcon(s) {
    const host = document.getElementById("preview-player");
    if (!host) return;
    let style = s.playerIconStyle || "dino";
    if (style === "custom" && !s.playerIconCustomData) style = "dino";
    host.dataset.icon = style;
    let mark = host.querySelector(".p-mark");
    if (!mark) {
      mark = document.createElement("div");
      mark.className = "p-mark";
      host.appendChild(mark);
    }
    if (style === "dot") {
      mark.className = "p-mark p-dot";
      mark.innerHTML = "";
    } else if (style === "custom" && s.playerIconCustomData) {
      mark.className = "p-mark p-dino p-custom";
      mark.innerHTML = `<img class="p-dino-svg" src="${String(
        s.playerIconCustomData
      ).replace(/"/g, "")}" alt="" draggable="false" />`;
    } else {
      mark.className = "p-mark p-dino";
      mark.innerHTML =
        '<svg class="p-dino-svg" viewBox="0 0 64 64"><path d="M8 36c0-2.2 1.4-4 3.4-4.6l4.2-1.2 2.1-7.4C19.2 17.2 24.6 13 31 13c3.2 0 6.2 1 8.7 2.9l3.1 2.3 5.2-2.4c2.1-1 4.5-.2 5.6 1.8.9 1.7.5 3.8-1 4.9L48 25.2l3.6.8c2.8.6 4.8 3.1 4.8 6 0 2.4-1.5 4.5-3.7 5.3l-1.7.6.9 5.2c.5 2.7-1.6 5.1-4.3 5.1h-3.2l.6 6.3c.2 2.1-1.4 3.9-3.5 3.9h-4.1c-1.7 0-3.1-1.2-3.4-2.9L32.4 43h-4.2l-1.2 7.2c-.3 1.7-1.8 2.9-3.5 2.9h-4.4c-2.1 0-3.7-1.9-3.4-4l.9-6.4h-2.8c-3.1 0-5.6-2.5-5.6-5.6V36z"/></svg>';
    }
  }

  function syncBorderStyleFields(style) {
    const framed = style === "isle-evrima";
    document.getElementById("field-border-color")?.classList.toggle("is-dimmed", framed);
    document.getElementById("field-border-width")?.classList.toggle("is-dimmed", framed);
    document.getElementById("field-border-glow")?.classList.toggle("is-dimmed", framed);
    const hint = document.getElementById("border-style-hint");
    if (hint) {
      if (framed) hint.removeAttribute("hidden");
      else hint.setAttribute("hidden", "");
    }
    const card = document.getElementById("frame-align-card");
    const locked = document.getElementById("frame-align-locked");
    if (card) {
      if (framed) card.removeAttribute("hidden");
      else card.setAttribute("hidden", "");
    }
    if (locked) {
      if (framed) locked.setAttribute("hidden", "");
      else locked.removeAttribute("hidden");
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function waypointIcon(color) {
    return L.divIcon({
      className: "dest-pin-marker",
      html: `<div class="dest-pin" style="--waypoint:${color}"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 20],
    });
  }

  function placeMatchesWaypoint(place) {
    if (!waypoint.enabled) return false;
    const dx = place.x - waypoint.x;
    const dy = place.y - waypoint.y;
    return dx * dx + dy * dy < 12000 * 12000; // ~120m
  }

  function ppPlaceIcon(place, category, highlighted) {
    const showDot = category === "landmarks" || category === "waters";
    const hl = highlighted ? " is-highlight" : "";
    const dot = showDot ? '<span class="pp-dot" aria-hidden="true"></span>' : "";
    const label = `<span class="pp-label">${escapeHtml(place.name)}</span>`;
    const catClass =
      category === "waters" ? "pp-water" : category === "landmarks" ? "pp-landmark" : "pp-area";
    return L.divIcon({
      className: `pp-marker ${catClass}`,
      html: `<div class="pp-place ${catClass}${hl}">${dot}${label}</div>`,
      iconSize: [160, 20],
      iconAnchor: showDot ? [5, 10] : [0, 10],
    });
  }

  function formatRemainingDistance(meters) {
    if (meters == null || !Number.isFinite(meters)) return "—";
    if (meters >= 1000) {
      const km = meters / 1000;
      return `${km >= 10 ? km.toFixed(1) : km.toFixed(2)} km`;
    }
    return `${Math.max(0, Math.round(meters))} m`;
  }

  function waypointRemainingMeters() {
    if (
      !playerLocation ||
      !waypoint.enabled ||
      !Number.isFinite(waypoint.x) ||
      !Number.isFinite(waypoint.y)
    ) {
      return null;
    }
    const dx = waypoint.x - playerLocation.x;
    const dy = waypoint.y - playerLocation.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    return Math.hypot(dx, dy) / 100;
  }

  function updateWaypointRemaining() {
    const text = formatRemainingDistance(waypointRemainingMeters());
    const mapEl = document.getElementById("dest-remaining");
    const pageEl = document.getElementById("waypoint-remaining-val");
    if (mapEl) mapEl.textContent = text;
    if (pageEl) pageEl.textContent = text;
  }

  function updateDestCoordsLabel() {
    const wrap = document.getElementById("dest-coords-wrap");
    if (!waypoint.enabled || !Number.isFinite(waypoint.x) || !Number.isFinite(waypoint.y)) {
      destCoords.textContent = "None";
      wrap?.classList.add("is-empty");
      updateWaypointRemaining();
      return;
    }
    const name = waypoint.label && waypoint.label !== "Go here" ? ` · ${waypoint.label}` : "";
    destCoords.textContent = `${waypoint.x.toFixed(0)}, ${waypoint.y.toFixed(0)}${name}`;
    wrap?.classList.remove("is-empty");
    updateWaypointRemaining();
  }

  function refreshPlaceHighlights() {
    for (const rec of destPlaceRecords) {
      const hl = placeMatchesWaypoint(rec.place);
      rec.marker.setIcon(ppPlaceIcon(rec.place, rec.category, hl));
    }
  }

  function syncDestMarker() {
    if (!destMap || typeof L === "undefined" || !window.IsleCoords) return;
    const { worldToLatLng } = window.IsleCoords;
    if (!waypoint.enabled || !Number.isFinite(waypoint.x) || !Number.isFinite(waypoint.y)) {
      if (destMarker) {
        destMap.removeLayer(destMarker);
        destMarker = null;
      }
      updateDestCoordsLabel();
      refreshPlaceHighlights();
      return;
    }
    const ll = worldToLatLng(L, waypoint.x, waypoint.y);
    const icon = waypointIcon(waypoint.color || "#ff7a45");
    if (!destMarker) {
      destMarker = L.marker(ll, {
        icon,
        draggable: true,
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(destMap);
      destMarker.on("dragend", () => {
        const pos = destMarker.getLatLng();
        const world = window.IsleCoords.latLngToWorld(pos);
        setWaypoint(world.x, world.y, true);
      });
    } else {
      destMarker.setLatLng(ll);
      destMarker.setIcon(icon);
    }
    updateDestCoordsLabel();
    refreshPlaceHighlights();
  }

  function buildDestGrid() {
    if (!destMap || !window.IsleCoords) return;
    const { CAL, worldToPixel } = window.IsleCoords;
    if (destGridLayer) destGridLayer.clearLayers();
    else destGridLayer = L.layerGroup().addTo(destMap);

    const W = CAL.imageWidth;
    const H = CAL.imageHeight;
    const originX = CAL.gridOriginX;
    const originY = CAL.gridOriginY;
    const cell = CAL.gridCell;
    const rows = CAL.gridRows;
    const cols = CAL.gridCols;
    const x0 = originX;
    const y0 = originY;
    const x1 = originX + rows * cell;
    const y1 = originY + cols * cell;

    const lineStyle = (major) => ({
      color: major ? "rgba(252,209,22,0.30)" : "rgba(252,209,22,0.16)",
      weight: major ? 1.5 : 1,
      interactive: false,
      className: "pp-grid-line",
    });

    // Clip axis-aligned grid segments to the PNG so they lock to the art
    const addVertical = (wy, major) => {
      // constant world Y → constant pixel X
      const px = worldToPixel(x0, wy).x;
      if (px < 0 || px > W) return;
      let py0 = worldToPixel(x0, wy).y;
      let py1 = worldToPixel(x1, wy).y;
      const top = Math.min(py0, py1);
      const bot = Math.max(py0, py1);
      const a = Math.max(0, top);
      const b = Math.min(H, bot);
      if (a >= b) return;
      L.polyline(
        [L.latLng(H - a, px), L.latLng(H - b, px)],
        lineStyle(major)
      ).addTo(destGridLayer);
    };

    const addHorizontal = (wx, major) => {
      // constant world X → constant pixel Y
      const py = worldToPixel(wx, y0).y;
      if (py < 0 || py > H) return;
      let px0 = worldToPixel(wx, y0).x;
      let px1 = worldToPixel(wx, y1).x;
      const left = Math.min(px0, px1);
      const right = Math.max(px0, px1);
      const a = Math.max(0, left);
      const b = Math.min(W, right);
      if (a >= b) return;
      L.polyline(
        [L.latLng(H - py, a), L.latLng(H - py, b)],
        lineStyle(major)
      ).addTo(destGridLayer);
    };

    for (let i = 0; i <= cols; i++) {
      addVertical(originY + i * cell, i % 5 === 0);
    }
    for (let i = 0; i <= rows; i++) {
      addHorizontal(originX + i * cell, i % 5 === 0);
    }

    // Edge keys in image space for Gateway grid labels
    for (let c = 0; c < cols; c++) {
      const wy = originY + (c + 0.5) * cell;
      const px = worldToPixel(originX, wy).x;
      if (px < 8 || px > W - 8) continue;
      L.marker(L.latLng(H - 14, px), {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "pp-grid-label",
          html: String(c + 1).padStart(2, "0"),
          iconSize: [24, 14],
          iconAnchor: [12, 7],
        }),
      }).addTo(destGridLayer);
    }
    for (let r = 0; r < rows; r++) {
      const wx = originX + (r + 0.5) * cell;
      const py = worldToPixel(wx, originY).y;
      if (py < 8 || py > H - 8) continue;
      L.marker(L.latLng(H - py, 14), {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "pp-grid-label",
          html: String.fromCharCode(65 + r),
          iconSize: [16, 14],
          iconAnchor: [8, 7],
        }),
      }).addTo(destGridLayer);
    }
  }

  async function loadDestPlaces() {
    if (!destMap || destPlacesLoaded) return;
    destPlacesLayer = L.layerGroup().addTo(destMap);
    try {
      const res = await fetch("../data/gateway-areas.json");
      const data = await res.json();
      const cats = data.categories || {};
      for (const [category, list] of Object.entries(cats)) {
        if (!Array.isArray(list)) continue;
        for (const place of list) {
          const ll = window.IsleCoords.worldToLatLng(L, place.x, place.y);
          const highlighted = placeMatchesWaypoint(place);
          const marker = L.marker(ll, {
            icon: ppPlaceIcon(place, category, highlighted),
            interactive: true,
            keyboard: false,
            zIndexOffset: category === "landmarks" ? 200 : 100,
          }).addTo(destPlacesLayer);
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            fields.waypointLabel.value = place.name;
            setWaypoint(place.x, place.y, true, place.name);
          });
          destPlaceRecords.push({ place, category, marker });
        }
      }
      destPlacesLoaded = true;
      applyDestLayerVisibility();
    } catch (err) {
      console.error("[dashboard] failed to load places", err);
    }
  }

  function applyDestLayerVisibility() {
    if (!destGridLayer || !destPlacesLayer) return;
    const showGrid = destLayerToggles.grid?.checked !== false;
    if (showGrid) {
      if (!destMap.hasLayer(destGridLayer)) destGridLayer.addTo(destMap);
    } else if (destMap.hasLayer(destGridLayer)) {
      destMap.removeLayer(destGridLayer);
    }

    const show = {
      areas: destLayerToggles.areas?.checked !== false,
      waters: destLayerToggles.waters?.checked !== false,
      landmarks: destLayerToggles.landmarks?.checked !== false,
    };
    for (const rec of destPlaceRecords) {
      const on = show[rec.category] !== false;
      if (on) {
        if (!destPlacesLayer.hasLayer(rec.marker)) rec.marker.addTo(destPlacesLayer);
      } else if (destPlacesLayer.hasLayer(rec.marker)) {
        destPlacesLayer.removeLayer(rec.marker);
      }
    }
  }

  function ensureDestMap() {
    if (destMap || !destMapEl || typeof L === "undefined" || !window.IsleCoords) return;
    const { mapBounds } = window.IsleCoords;
    const bounds = mapBounds();
    destMap = L.map(destMapEl, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomSnap: 0.25,
      attributionControl: false,
      zoomControl: true,
      maxBounds: bounds,
      maxBoundsViscosity: 0.85,
    });
    L.imageOverlay("../gateway.png", bounds).addTo(destMap);
    destMap.getContainer().style.background = "#05070d";
    destMap.fitBounds(bounds, { padding: [8, 8] });
    buildDestGrid();
    loadDestPlaces();
    destMap.on("click", (e) => {
      const world = window.IsleCoords.latLngToWorld(e.latlng);
      setWaypoint(world.x, world.y, true);
    });
    syncDestMarker();
  }

  function refreshDestMapSize() {
    if (!destMap || !window.IsleCoords) return;
    requestAnimationFrame(() => {
      destMap.invalidateSize({ animate: false });
      destMap.fitBounds(window.IsleCoords.mapBounds(), {
        padding: [10, 10],
        animate: false,
      });
    });
  }

  async function setWaypoint(x, y, enabled, labelOverride) {
    if (labelOverride) fields.waypointLabel.value = labelOverride;
    waypoint = {
      ...waypoint,
      enabled: Boolean(enabled),
      x: enabled ? Number(x) : null,
      y: enabled ? Number(y) : null,
      label: fields.waypointLabel.value.trim() || "Go here",
      color: toHexColor(fields.waypointColor.value),
    };
    syncDestMarker();
    markSaving();
    await api.setSettings({
      waypointEnabled: waypoint.enabled,
      waypointX: waypoint.x,
      waypointY: waypoint.y,
      waypointLabel: waypoint.label,
      waypointColor: waypoint.color,
    });
    markSaved();
  }

  function applyWaypointFromSettings(s) {
    waypoint = {
      enabled: Boolean(s.waypointEnabled),
      x: Number.isFinite(Number(s.waypointX)) ? Number(s.waypointX) : null,
      y: Number.isFinite(Number(s.waypointY)) ? Number(s.waypointY) : null,
      label: s.waypointLabel || "Go here",
      color: toHexColor(s.waypointColor || "#ff7a45"),
    };
    if (document.activeElement !== fields.waypointLabel) {
      fields.waypointLabel.value = waypoint.label;
    }
    if (document.activeElement !== fields.waypointColor) {
      fields.waypointColor.value = waypoint.color;
    }
    if (fields.navPath) fields.navPath.checked = s.navPath !== false;
    if (fields.showWaypointPin) {
      fields.showWaypointPin.checked = s.showWaypointPin !== false;
    }
    if (fields.showWaypointLabel) {
      fields.showWaypointLabel.checked = s.showWaypointLabel !== false;
    }
    if (fields.navPathColor && document.activeElement !== fields.navPathColor) {
      fields.navPathColor.value = toHexColor(s.navPathColor || "#ffb347");
    }
    syncDestMarker();
  }

  function scheduleWaypointMetaPersist() {
    if (applying) return;
    clearTimeout(waypointTimer);
    waypointTimer = setTimeout(async () => {
      waypoint.label = fields.waypointLabel.value.trim() || "Go here";
      waypoint.color = toHexColor(fields.waypointColor.value);
      syncDestMarker();
      markSaving();
      await api.setSettings({
        waypointLabel: waypoint.label,
        waypointColor: waypoint.color,
        navPath: fields.navPath?.checked !== false,
        navPathColor: toHexColor(fields.navPathColor?.value || "#ffb347"),
        showWaypointPin: fields.showWaypointPin?.checked !== false,
        showWaypointLabel: fields.showWaypointLabel?.checked !== false,
      });
      markSaved();
    }, 160);
  }

  function fillForm(s) {
    applying = true;
    fields.mapDesign.value = s.mapDesign;
    if (fields.borderStyle) fields.borderStyle.value = s.borderStyle || "classic";
    fields.borderColor.value = toHexColor(s.borderColor);
    fields.pinColor.value = toHexColor(s.pinColor);
    if (fields.playerIconStyle) {
      fields.playerIconStyle.value = s.playerIconStyle || "dino";
    }
    playerIconCustomData = s.playerIconCustomData || "";
    playerIconCustomName = s.playerIconCustomName || "";
    syncPlayerIconCustomRow();
    fields.fovColor.value = toHexColor(s.fovColor);
    fields.borderWidth.value = s.borderWidth;
    fields.borderGlow.value = s.borderGlow;
    if (fields.frameScale) fields.frameScale.value = s.frameScale ?? 1.49;
    if (fields.frameMapScale) fields.frameMapScale.value = s.frameMapScale ?? 1.04;
    if (fields.frameOffsetX) fields.frameOffsetX.value = s.frameOffsetX ?? 0;
    if (fields.frameOffsetY) fields.frameOffsetY.value = s.frameOffsetY ?? 0;
    if (fields.frameHoleX) fields.frameHoleX.value = s.frameHoleX ?? 50;
    if (fields.frameHoleY) fields.frameHoleY.value = s.frameHoleY ?? 47.36;
    if (fields.framePad) fields.framePad.value = s.framePad ?? 0.26;
    if (fields.frameMapOnTop) {
      fields.frameMapOnTop.checked = Boolean(s.frameMapOnTop);
    }
    fields.windowOpacity.value = s.windowOpacity ?? 1;
    fields.mapOpacity.value = s.mapOpacity;
    fields.overlayOpacity.value = s.overlayOpacity;
    fields.showFov.checked = s.showFov;
    fields.showCompass.checked = s.showCompass !== false;
    if (fields.showRadarSweep) {
      fields.showRadarSweep.checked = Boolean(s.showRadarSweep);
    }
    if (fields.radarSweepSeconds) {
      fields.radarSweepSeconds.value = s.radarSweepSeconds ?? 4;
    }
    syncRadarSweepState();
    fields.showAreas.checked = s.showAreas !== false;
    fields.showWaters.checked = s.showWaters !== false;
    fields.showLandmarks.checked = s.showLandmarks !== false;
    fields.placeStyle.value = s.placeStyle || "icon-label";
    fields.placeFilter.value = s.placeFilter || "all";
    if (fields.placeNearbyOnly) {
      fields.placeNearbyOnly.checked = Boolean(s.placeNearbyOnly);
    }
    if (fields.placeNearbyRadiusKm) {
      fields.placeNearbyRadiusKm.value = s.placeNearbyRadiusKm ?? 2;
    }
    syncNearbyRadiusState();
    fields.edgePins.checked = s.edgePins !== false;
    applyHotkeysFromSettings(s);
    fields.edgeWaters.checked = s.edgeWaters !== false;
    fields.edgeAreas.checked = Boolean(s.edgeAreas);
    fields.edgeLandmarks.checked = Boolean(s.edgeLandmarks);
    fields.showChrome.checked = s.showChrome;
    syncEdgeChecklistState();
    fields.mapSize.value = s.mapSize;
    fields.zoom.value = s.zoom;
    fields.position.value = s.position;
    fields.followPlayer.checked = s.followPlayer !== false;
    applyWaypointFromSettings(s);
    updateLabels(s);
    updatePreview(s);
    populateOverlayDisplays(null, s.overlayDisplay || "primary");
    Object.values(fields).forEach((el) => {
      if (el && el.tagName === "SELECT") refreshNvSelect(el);
    });
    applying = false;
  }

  function readForm() {
    return {
      mapDesign: fields.mapDesign.value,
      borderStyle: fields.borderStyle?.value || "classic",
      borderColor: fields.borderColor.value,
      pinColor: fields.pinColor.value,
      playerIconStyle: fields.playerIconStyle?.value || "dino",
      playerIconCustomData,
      playerIconCustomName,
      fovColor: fields.fovColor.value,
      borderWidth: Number(fields.borderWidth.value),
      borderGlow: Number(fields.borderGlow.value),
      frameScale: Number(fields.frameScale?.value ?? 1.49),
      frameMapScale: Number(fields.frameMapScale?.value ?? 1.04),
      frameOffsetX: Number(fields.frameOffsetX?.value ?? 0),
      frameOffsetY: Number(fields.frameOffsetY?.value ?? 0),
      frameHoleX: Number(fields.frameHoleX?.value ?? 50),
      frameHoleY: Number(fields.frameHoleY?.value ?? 47.36),
      framePad: Number(fields.framePad?.value ?? 0.26),
      frameMapOnTop: Boolean(fields.frameMapOnTop?.checked),
      windowOpacity: Number(fields.windowOpacity.value),
      mapOpacity: Number(fields.mapOpacity.value),
      overlayOpacity: Number(fields.overlayOpacity.value),
      showFov: fields.showFov.checked,
      showCompass: fields.showCompass.checked,
      showRadarSweep: Boolean(fields.showRadarSweep?.checked),
      radarSweepSeconds: Number(fields.radarSweepSeconds?.value ?? 4),
      showAreas: fields.showAreas.checked,
      showWaters: fields.showWaters.checked,
      showLandmarks: fields.showLandmarks.checked,
      placeStyle: fields.placeStyle.value,
      placeFilter: fields.placeFilter.value,
      placeNearbyOnly: Boolean(fields.placeNearbyOnly?.checked),
      placeNearbyRadiusKm: Number(fields.placeNearbyRadiusKm?.value ?? 2),
      edgePins: fields.edgePins.checked,
      edgeWaters: fields.edgeWaters.checked,
      edgeAreas: fields.edgeAreas.checked,
      edgeLandmarks: fields.edgeLandmarks.checked,
      showChrome: fields.showChrome.checked,
      showWaypointPin: fields.showWaypointPin?.checked !== false,
      showWaypointLabel: fields.showWaypointLabel?.checked !== false,
      mapSize: Number(fields.mapSize.value),
      zoom: Number(fields.zoom.value),
      overlayDisplay: fields.overlayDisplay?.value || "primary",
      position: fields.position.value,
      followPlayer: fields.followPlayer.checked,
    };
  }

  let cachedDisplays = null;

  function formatDisplayOption(d) {
    const name = d.label || `Monitor`;
    const res = `${d.width}×${d.height}`;
    return d.primary ? `${name} — ${res} (primary)` : `${name} — ${res}`;
  }

  function populateOverlayDisplays(displays, preferred) {
    const sel = fields.overlayDisplay;
    if (!sel) return;
    if (displays) cachedDisplays = displays;
    const list = displays || cachedDisplays;
    const want = String(preferred || sel.value || "primary");

    const keep = new Set(["primary", "game"]);
    sel.querySelectorAll("option").forEach((opt) => {
      if (!keep.has(opt.value)) opt.remove();
    });

    if (Array.isArray(list)) {
      for (const d of list) {
        const opt = document.createElement("option");
        opt.value = String(d.id);
        opt.textContent = formatDisplayOption(d);
        sel.appendChild(opt);
      }
    }

    const values = new Set([...sel.options].map((o) => o.value));
    sel.value = values.has(want) ? want : "primary";
    refreshNvSelect(sel);
  }

  async function refreshOverlayDisplays(preferred) {
    if (!api.listDisplays) return;
    try {
      const list = await api.listDisplays();
      populateOverlayDisplays(list, preferred ?? fields.overlayDisplay?.value);
    } catch {
      // keep existing options
    }
  }

  function markSaving() {
    saveState.textContent = "Saving…";
    saveState.style.color = "";
    saveState.style.borderColor = "rgba(255,255,255,0.14)";
    saveState.style.background = "rgba(255,255,255,0.04)";
  }

  function markSaved() {
    saveState.textContent = "Saved";
    saveState.style.color = "";
    saveState.style.borderColor = "";
    saveState.style.background = "";
  }

  async function persist() {
    if (applying) return;
    markSaving();
    const next = readForm();
    updateLabels(next);
    updatePreview(next);
    await api.setSettings(next);
    markSaved();
  }

  function schedulePersist() {
    if (applying) return;
    const next = readForm();
    updateLabels(next);
    updatePreview(next);
    markSaving();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 120);
  }

  Object.entries(fields).forEach(([key, el]) => {
    if (!el) return;
    if (
      key === "waypointLabel" ||
      key === "waypointColor" ||
      key === "navPath" ||
      key === "navPathColor" ||
      key === "showWaypointPin" ||
      key === "showWaypointLabel"
    ) {
      el.addEventListener("input", scheduleWaypointMetaPersist);
      el.addEventListener("change", scheduleWaypointMetaPersist);
      return;
    }
    el.addEventListener("input", schedulePersist);
    el.addEventListener("change", schedulePersist);
  });

  function refreshNvSelect(select) {
    if (typeof select?._nvRefresh === "function") select._nvRefresh();
  }

  function enhanceSelects() {
    document.querySelectorAll("select").forEach((select) => {
      if (select.dataset.nvEnhanced === "1") return;
      select.dataset.nvEnhanced = "1";
      select.classList.add("nv-select-native");

      const wrap = document.createElement("div");
      wrap.className = "nv-select";
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "nv-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.innerHTML =
        '<span class="nv-select-value"></span><span class="nv-select-chevron" aria-hidden="true"></span>';

      const menu = document.createElement("div");
      menu.className = "nv-select-menu";
      menu.setAttribute("role", "listbox");
      menu.hidden = true;

      const valueEl = () => trigger.querySelector(".nv-select-value");

      function sync() {
        const opt = select.selectedOptions[0];
        valueEl().textContent = opt ? opt.textContent : "";
        menu.querySelectorAll(".nv-select-option").forEach((btn) => {
          btn.classList.toggle("is-selected", btn.dataset.value === select.value);
        });
      }

      function rebuildMenu() {
        menu.replaceChildren();
        [...select.options].forEach((opt) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nv-select-option";
          btn.dataset.value = opt.value;
          btn.setAttribute("role", "option");
          btn.textContent = opt.textContent;
          btn.addEventListener("click", () => {
            select.value = opt.value;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
            sync();
            closeMenu();
          });
          menu.appendChild(btn);
        });
        sync();
      }

      function closeMenu() {
        wrap.classList.remove("is-open");
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }

      function openMenu() {
        document.querySelectorAll(".nv-select.is-open").forEach((el) => {
          el.classList.remove("is-open");
          const m = el.querySelector(".nv-select-menu");
          if (m) m.hidden = true;
        });
        wrap.classList.add("is-open");
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        sync();
      }

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (wrap.classList.contains("is-open")) closeMenu();
        else openMenu();
      });

      wrap.appendChild(trigger);
      wrap.appendChild(menu);
      rebuildMenu();
      select._nvRefresh = () => {
        rebuildMenu();
        sync();
      };
      select.addEventListener("change", sync);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".nv-select")) return;
    document.querySelectorAll(".nv-select.is-open").forEach((el) => {
      el.classList.remove("is-open");
      const m = el.querySelector(".nv-select-menu");
      if (m) m.hidden = true;
    });
  });

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--rx", `${e.clientX - rect.left}px`);
      btn.style.setProperty("--ry", `${e.clientY - rect.top}px`);
    });
  });

  enhanceSelects();

  function formatAccel(accel) {
    return String(accel || "")
      .replace(/CommandOrControl/g, "Ctrl")
      .replace(/Command/g, "Cmd")
      .replace(/\+/g, " + ");
  }

  function eventToAccelerator(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");

    const key = e.key;
    if (!key || key === "Control" || key === "Shift" || key === "Alt" || key === "Meta") {
      return null;
    }

    const special = {
      " ": "Space",
      Escape: "Escape",
      Esc: "Escape",
      Enter: "Enter",
      Tab: "Tab",
      Backspace: "Backspace",
      Delete: "Delete",
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      Home: "Home",
      End: "End",
      PageUp: "PageUp",
      PageDown: "PageDown",
      Insert: "Insert",
      "+": "Plus",
      "=": "=",
      "-": "-",
      _: "-",
    };

    let token = special[key];
    if (!token) {
      if (/^F\d{1,2}$/i.test(key)) token = key.toUpperCase();
      else if (key.length === 1) token = key.toUpperCase();
      else token = key.length <= 16 ? key : null;
    }
    if (!token) return null;
    parts.push(token);
    return parts.join("+");
  }

  function renderHotkeyList() {
    const list = document.getElementById("hotkey-bind-list");
    if (!list) return;
    list.replaceChildren();
    for (const def of HOTKEY_DEFS) {
      const row = document.createElement("div");
      row.className = "hotkey-bind";
      row.dataset.key = def.key;
      row.title = def.hint;
      row.innerHTML =
        `<div class="hotkey-bind-copy">` +
        `<strong>${def.label}</strong>` +
        `<span>${def.hint}</span>` +
        `</div>` +
        `<button type="button" class="hotkey-capture btn btn-secondary" data-key="${def.key}" title="${def.hint}">` +
        formatAccel(hotkeyValues[def.key] || HOTKEY_DEFAULTS[def.key]) +
        `</button>`;
      list.appendChild(row);
    }

    list.querySelectorAll(".hotkey-capture").forEach((btn) => {
      btn.addEventListener("click", () => startHotkeyCapture(btn.dataset.key, btn));
    });

    document.querySelectorAll("#filter-hotkey-list li[data-hk]").forEach((li) => {
      const k = li.dataset.hk;
      const kbd = li.querySelector("kbd");
      if (kbd) kbd.textContent = formatAccel(hotkeyValues[k] || HOTKEY_DEFAULTS[k]);
    });
  }

  function setHotkeyHint(text, isError) {
    const el = document.getElementById("hotkey-hint");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-error", Boolean(isError));
  }

  function stopHotkeyCapture() {
    recordingKey = null;
    document.querySelectorAll(".hotkey-capture.is-recording").forEach((b) => {
      b.classList.remove("is-recording");
      const key = b.dataset.key;
      b.textContent = formatAccel(hotkeyValues[key] || HOTKEY_DEFAULTS[key]);
    });
  }

  function startHotkeyCapture(key, btn) {
    stopHotkeyCapture();
    recordingKey = key;
    btn.classList.add("is-recording");
    btn.textContent = "Press keys…";
    setHotkeyHint("Listening — press a shortcut, or Esc to cancel.");
  }

  async function commitHotkey(key, accel) {
    const clash = HOTKEY_DEFS.find(
      (d) => d.key !== key && (hotkeyValues[d.key] || HOTKEY_DEFAULTS[d.key]) === accel
    );
    if (clash) {
      setHotkeyHint(`Already used by “${clash.label}”. Pick another.`, true);
      stopHotkeyCapture();
      return;
    }
    hotkeyValues[key] = accel;
    stopHotkeyCapture();
    renderHotkeyList();
    markSaving();
    await api.setSettings({ [key]: accel });
    markSaved();
    setHotkeyHint(`Saved: ${formatAccel(accel)}`);
  }

  function applyHotkeysFromSettings(s) {
    for (const def of HOTKEY_DEFS) {
      hotkeyValues[def.key] = s[def.key] || HOTKEY_DEFAULTS[def.key];
    }
    if (recordingKey) return;
    renderHotkeyList();
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (!recordingKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        stopHotkeyCapture();
        setHotkeyHint("Cancelled.");
        return;
      }
      const accel = eventToAccelerator(e);
      if (!accel) return;
      commitHotkey(recordingKey, accel);
    },
    true
  );

  document.getElementById("btn-reset-hotkeys")?.addEventListener("click", async () => {
    stopHotkeyCapture();
    hotkeyValues = { ...HOTKEY_DEFAULTS };
    renderHotkeyList();
    markSaving();
    await api.setSettings({ ...HOTKEY_DEFAULTS });
    markSaved();
    setHotkeyHint("Hotkeys reset to defaults.");
  });

  renderHotkeyList();

  fields.edgePins.addEventListener("change", syncEdgeChecklistState);
  fields.placeNearbyOnly?.addEventListener("change", syncNearbyRadiusState);
  fields.showRadarSweep?.addEventListener("change", syncRadarSweepState);
  fields.playerIconStyle?.addEventListener("change", () => {
    syncPlayerIconCustomRow();
  });

  document.getElementById("btn-pick-player-icon")?.addEventListener("click", async () => {
    if (typeof api.pickPlayerIcon !== "function") return;
    const res = await api.pickPlayerIcon();
    if (!res?.ok) {
      if (res?.reason === "too-large") {
        const nameEl = document.getElementById("player-icon-custom-name");
        if (nameEl) nameEl.textContent = "Image too large (max ~400 KB)";
      }
      return;
    }
    playerIconCustomData = res.dataUrl;
    playerIconCustomName = res.name || "custom";
    if (fields.playerIconStyle) {
      fields.playerIconStyle.value = "custom";
      refreshNvSelect(fields.playerIconStyle);
    }
    syncPlayerIconCustomRow();
    schedulePersist();
  });

  destClear?.addEventListener("click", () => setWaypoint(null, null, false));

  Object.values(destLayerToggles).forEach((el) => {
    el?.addEventListener("change", applyDestLayerVisibility);
  });

  function activateTab(scope, tabId) {
    if (!scope) return;
    const tabs = scope.querySelectorAll(":scope > .tabs .tab");
    const panels = scope.querySelectorAll(":scope > .tab-panels > .tab-panel");
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === tabId;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((panel) => {
      const on = panel.dataset.tab === tabId;
      panel.classList.toggle("is-active", on);
      if (on) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
    if (scope.dataset.panel === "destination" && tabId === "map") {
      ensureDestMap();
      refreshDestMapSize();
    }
    if (scope.dataset.panel === "overlay" && tabId === "layout") {
      refreshOverlayDisplays(fields.overlayDisplay?.value);
    }
  }

  function initSectionTabs() {
    document.querySelectorAll("[data-tabs]").forEach((scope) => {
      scope.querySelectorAll(":scope > .tabs .tab").forEach((tab) => {
        tab.addEventListener("click", () => activateTab(scope, tab.dataset.tab));
      });
    });
  }

  function openOverlayTab(tabId) {
    const scope = document.querySelector('.panel[data-panel="overlay"]');
    showPanel("overlay");
    if (tabId) activateTab(scope, tabId);
    if (tabId === "layout") {
      refreshOverlayDisplays(fields.overlayDisplay?.value);
    }
  }

  function showPanel(id) {
    const alias = PANEL_ALIASES[id];
    if (alias) {
      openOverlayTab(alias.tab);
      return;
    }

    document.querySelectorAll(".nav").forEach((b) => {
      b.classList.toggle("active", b.dataset.panel === id);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("is-active", p.dataset.panel === id);
    });
    contentEl?.classList.toggle("is-destination", id === "destination");
    contentEl?.classList.toggle("is-game", id === "game");
    contentEl?.classList.toggle("is-tutorial", id === "tutorial");
    contentEl?.classList.toggle("is-developer", id === "developer");
    const meta = panelMeta[id];
    if (meta) {
      panelTitle.textContent = meta.title;
      panelSub.textContent = meta.sub;
    }
    if (id === "destination") {
      ensureDestMap();
      refreshDestMapSize();
    }
    if (id === "overlay") {
      const activeTab = document.querySelector(
        '.panel[data-panel="overlay"] .tab.is-active'
      )?.dataset.tab;
      if (activeTab === "layout") {
        refreshOverlayDisplays(fields.overlayDisplay?.value);
      }
    }
  }

  const TOUR_STEPS = [
    {
      target: "brand",
      panel: "overlay",
      tab: "visual",
      title: "IsleMap Control Center",
      body: "This dashboard controls the in-game radar overlay. We’ll walk every module and settings group.",
    },
    {
      target: "nav",
      panel: "overlay",
      tab: "visual",
      title: "Modules",
      body: "Sidebar modules: Overlay, Destination, Game & hotkeys, Tutorial, and Developer (app info).",
    },
    {
      target: "nav-overlay",
      panel: "overlay",
      tab: "visual",
      title: "Overlay module",
      body: "Everything about the radar window lives here — style, frame align, HUD, places, opacity, and layout.",
    },
    {
      target: "overlay-tabs",
      panel: "overlay",
      tab: "visual",
      title: "Overlay tabs",
      body: "Style · Frame · HUD · Places · Opacity · Layout. Each tab is a settings group for the radar.",
    },
    {
      target: "style-card",
      panel: "overlay",
      tab: "visual",
      title: "Style",
      body: "Map design (tactical, phosphor, thermal…), border (classic ring or Isle Evrima), player pin color, player icon (dot / dino / custom image), and FOV color.",
    },
    {
      target: "frame-card",
      panel: "overlay",
      tab: "frame",
      title: "Frame",
      body: "When Border design is Isle Evrima, unlock scale, map fill, offsets, hole anchors, and padding so the stone frame sits flush on the map.",
    },
    {
      target: "hud-card",
      panel: "overlay",
      tab: "hud",
      title: "HUD",
      body: "Toggle the direction cone, N/S/E/W compass, status bar under the radar, and the counterclockwise radar sweep (with speed).",
    },
    {
      target: "places-card",
      panel: "overlay",
      tab: "places",
      title: "Places",
      body: "Show or hide areas, water, and landmarks. Choose icon / label / both / hidden. Limit by distance radius, and control which types stick to the radar rim.",
    },
    {
      target: "opacity-card",
      panel: "overlay",
      tab: "opacity",
      title: "Opacity",
      body: "Window opacity = whole radar see-through. Map image fades terrain only. UI / markers fades pins and labels. Balance clarity vs seeing the game.",
    },
    {
      target: "layout-card",
      panel: "overlay",
      tab: "layout",
      title: "Layout",
      body: "Overlay monitor (primary, follow game, or a display), screen corner, radar size, follow zoom, and recenter-on-player.",
    },
    {
      target: "preview",
      panel: "overlay",
      tab: "visual",
      title: "Live preview",
      body: "This preview mirrors the overlay look as you edit. Changes sync to the in-game radar instantly.",
    },
    {
      target: "overlay-controls",
      panel: "overlay",
      tab: "visual",
      title: "Show / hide map",
      body: "The radar starts hidden. Use Show map to put it over the game, Hide map to turn it off. Tray icon and the hide/show hotkey work even if you close Control Center. Re-pin if it slips under the game.",
    },
    {
      target: "top-actions",
      panel: "overlay",
      tab: "visual",
      title: "Save & reset",
      body: "Edits auto-save (status pill). Reset defaults restores stock settings for the form — use carefully.",
    },
    {
      target: "nav-destination",
      panel: "destination",
      tab: "map",
      title: "Destination module",
      body: "Set a go-to pin on Gateway and configure how the path and waypoint appear on the radar.",
    },
    {
      target: "destination-tabs",
      panel: "destination",
      tab: "map",
      title: "Destination tabs",
      body: "Map — click to place the pin. Waypoint — label, colors, path line, and pin/text visibility.",
    },
    {
      target: "dest-map",
      panel: "destination",
      tab: "map",
      title: "Gateway map",
      body: "Click the map or a place label to drop your destination. Remaining distance updates with each Copy Location.",
    },
    {
      target: "waypoint-identity",
      panel: "destination",
      tab: "waypoint",
      title: "Waypoint identity",
      body: "Name the pin and set pin / path colors shown on the overlay radar.",
    },
    {
      target: "waypoint-nav",
      panel: "destination",
      tab: "waypoint",
      title: "Waypoint navigation",
      body: "See remaining distance (km at 1 km+, meters below). Toggle path line, waypoint pin, and name/distance text so the radar stays clean.",
    },
    {
      target: "nav-game",
      panel: "game",
      tab: "setup",
      title: "Game & hotkeys",
      body: "EAC-safe usage notes, editable shortcuts, place-filter keys, and area data source.",
    },
    {
      target: "game-tabs",
      panel: "game",
      tab: "setup",
      title: "Game tabs",
      body: "Hotkeys · Setup · Filters · Data. Unpackaged builds also show Dev for a dummy location.",
    },
    {
      target: "setup-card",
      panel: "game",
      tab: "setup",
      title: "Quick setup",
      body: "Use Borderless Windowed (not exclusive fullscreen). Then copy your position from the character Status Report — see the next step. IsleMap is EAC-safe (clipboard only).",
    },
    {
      target: "setup-asset-location",
      panel: "game",
      tab: "setup",
      title: "Click Asset Location",
      body: "In-game, open Status Report and find Asset Location (Lat / Long / Alt) near the mini-map. You must click Asset Location to copy your coords — that’s how IsleMap knows where you are and drops your pin. Click again after moving to update.",
    },
    {
      target: "setup-facing",
      panel: "game",
      tab: "setup",
      title: "Facing arrow",
      body: "Clipboard has no yaw. The cone points the way you moved between Asset Location copies (~15 m+). Standing still keeps the last facing (dimmed).",
    },
    {
      target: "setup-destination",
      panel: "game",
      tab: "setup",
      title: "Destination tip",
      body: "Drop a go-to pin under Destination → Map, and enable the path line under Waypoint to draw a route from your Copy Location pin.",
    },
    {
      target: "hotkeys-card",
      panel: "game",
      tab: "hotkeys",
      title: "Custom hotkeys",
      body: "Click a binding, then press your shortcut. Defaults include F8 place filter, F6/F7 zoom, Ctrl+Shift+M hide overlay, Ctrl+Shift+D dashboard.",
    },
    {
      target: "filters-card",
      panel: "game",
      tab: "filters",
      title: "Place filters",
      body: "Quick reference for filter hotkeys (All / Water / Areas / Landmarks). Edit the actual keys under the Hotkeys tab.",
    },
    {
      target: "data-card",
      panel: "game",
      tab: "data",
      title: "Area data",
      body: "Built-in places ship with the app as local JSON under src/data/. Maintainers can refresh that file with npm run sync:areas.",
    },
    {
      target: "dev-card",
      panel: "game",
      tab: "dev",
      title: "Dev dummy location",
      body: "Unpackaged only: apply a test pin (Dam, Lakeport…) without the game. Nudge ~50 m to test facing. Set ISLEMAP_NO_DUMMY=1 to skip auto-pin.",
      devOnly: true,
    },
    {
      target: "nav-tutorial",
      panel: "tutorial",
      title: "Tutorial module",
      body: "Replay this full tour anytime from here.",
    },
    {
      target: "developer-page",
      panel: "developer",
      title: "Developer",
      body: "IsleMap by Balake Gaming (balake101) — TikTok @balakestream. Updates pull from the GitHub releases for this app. You’re ready — click Asset Location, set a waypoint, and tune Overlay.",
    },
  ];

  /** @type {typeof TOUR_STEPS} */
  let activeTourSteps = TOUR_STEPS;
  let tourStep = 0;
  let tourActive = false;
  let tourResizeObs = null;

  const tourRoot = document.getElementById("tour-root");
  const tourSpotlight = document.getElementById("tour-spotlight");
  const tourCard = document.getElementById("tour-card");
  const tourTitle = document.getElementById("tour-title");
  const tourBody = document.getElementById("tour-body");
  const tourStepLabel = document.getElementById("tour-step-label");
  const tourBack = document.getElementById("tour-back");
  const tourNext = document.getElementById("tour-next");

  function showWelcomeModal(show) {
    const modal = document.getElementById("welcome-modal");
    if (!modal) return;
    modal.classList.toggle("is-open", Boolean(show));
    if (show) {
      modal.removeAttribute("hidden");
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => document.getElementById("welcome-start")?.focus());
    } else {
      modal.setAttribute("hidden", "");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  async function markTutorialDone() {
    try {
      await api.setSettings({ tutorialCompleted: true });
    } catch {
      // ignore
    }
  }

  function isDevTourAvailable() {
    const tab = document.getElementById("tab-dev");
    return Boolean(tab && !tab.hasAttribute("hidden"));
  }

  function buildActiveTourSteps() {
    return TOUR_STEPS.filter((s) => !s.devOnly || isDevTourAvailable());
  }

  function tourTargetEl(step) {
    if (!step?.target) return null;
    if (step.target === "frame-card") {
      const unlocked = document.getElementById("frame-align-card");
      if (unlocked && !unlocked.hasAttribute("hidden")) return unlocked;
      return (
        document.getElementById("frame-align-locked") ||
        document.querySelector('[data-tour="frame-card"]')
      );
    }
    return document.querySelector(`[data-tour="${step.target}"]`);
  }

  function prepareTourStep(step) {
    if (!step) return;
    if (step.panel === "overlay") {
      openOverlayTab(step.tab || "visual");
      return;
    }
    if (step.panel) {
      showPanel(step.panel);
      if (step.tab) {
        const scope = document.querySelector(`.panel[data-panel="${step.panel}"]`);
        activateTab(scope, step.tab);
      }
    }
  }

  function positionTourUi() {
    if (!tourActive || !tourCard) return;
    const step = activeTourSteps[tourStep];
    const el = tourTargetEl(step);
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    document.querySelectorAll(".tour-target-live").forEach((n) => {
      n.classList.remove("tour-target-live");
    });

    if (el && tourSpotlight) {
      el.classList.add("tour-target-live");
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      const r = el.getBoundingClientRect();
      const top = Math.max(8, r.top - pad);
      const left = Math.max(8, r.left - pad);
      const width = Math.min(vw - left - 8, r.width + pad * 2);
      const height = Math.min(vh - top - 8, r.height + pad * 2);
      tourSpotlight.hidden = false;
      tourSpotlight.style.top = `${top}px`;
      tourSpotlight.style.left = `${left}px`;
      tourSpotlight.style.width = `${width}px`;
      tourSpotlight.style.height = `${height}px`;

      const cardW = Math.min(360, vw - 24);
      tourCard.style.width = `${cardW}px`;
      const cardH = tourCard.offsetHeight || 200;
      let cardTop = r.bottom + pad + 12;
      let cardLeft = Math.min(Math.max(12, r.left), vw - cardW - 12);
      if (cardTop + cardH > vh - 12) {
        cardTop = Math.max(12, r.top - cardH - 12);
      }
      if (cardTop < 12) cardTop = 12;
      tourCard.style.top = `${cardTop}px`;
      tourCard.style.left = `${cardLeft}px`;
      tourCard.classList.toggle("tour-card-below", cardTop >= r.bottom);
      tourCard.classList.toggle("tour-card-above", cardTop < r.top);
    } else if (tourSpotlight) {
      tourSpotlight.hidden = true;
      const cardW = Math.min(400, vw - 24);
      tourCard.style.width = `${cardW}px`;
      tourCard.style.top = `${Math.max(24, (vh - 220) / 2)}px`;
      tourCard.style.left = `${Math.max(12, (vw - cardW) / 2)}px`;
    }
  }

  function renderTourStep() {
    const step = activeTourSteps[tourStep];
    if (!step) return;
    prepareTourStep(step);
    if (tourTitle) tourTitle.textContent = step.title;
    if (tourBody) tourBody.textContent = step.body;
    if (tourStepLabel) {
      tourStepLabel.textContent = `${tourStep + 1} / ${activeTourSteps.length}`;
    }
    if (tourBack) tourBack.disabled = tourStep <= 0;
    if (tourNext) {
      tourNext.textContent =
        tourStep >= activeTourSteps.length - 1 ? "Finish" : "Next";
    }
    // Wait for panel/tab layout, then measure
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionTourUi();
        setTimeout(positionTourUi, 180);
      });
    });
  }

  function endTour(markDone) {
    tourActive = false;
    document.body.classList.remove("tour-active");
    document.querySelectorAll(".tour-target-live").forEach((n) => {
      n.classList.remove("tour-target-live");
    });
    if (tourRoot) {
      tourRoot.setAttribute("hidden", "");
      tourRoot.setAttribute("aria-hidden", "true");
    }
    if (tourSpotlight) tourSpotlight.hidden = true;
    window.removeEventListener("resize", positionTourUi);
    contentEl?.removeEventListener("scroll", positionTourUi);
    if (tourResizeObs) {
      tourResizeObs.disconnect();
      tourResizeObs = null;
    }
    if (markDone) markTutorialDone();
  }

  function beginTutorial() {
    showWelcomeModal(false);
    activeTourSteps = buildActiveTourSteps();
    tourStep = 0;
    tourActive = true;
    document.body.classList.add("tour-active");
    if (tourRoot) {
      tourRoot.removeAttribute("hidden");
      tourRoot.setAttribute("aria-hidden", "false");
    }
    window.addEventListener("resize", positionTourUi);
    contentEl?.addEventListener("scroll", positionTourUi, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      tourResizeObs = new ResizeObserver(() => positionTourUi());
      if (contentEl) tourResizeObs.observe(contentEl);
    }
    renderTourStep();
    markTutorialDone();
    requestAnimationFrame(() => tourNext?.focus());
  }

  initSectionTabs();

  document.querySelectorAll(".nav").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.panel));
  });

  document.getElementById("btn-reset").addEventListener("click", async () => {
    markSaving();
    const next = await api.resetSettings();
    fillForm(next);
    markSaved();
  });

  document.getElementById("btn-repin").addEventListener("click", () => api.repin());

  const toggleBtn = document.getElementById("btn-toggle");
  const overlayCopy = document.getElementById("overlay-visibility-copy");
  const overlayPill = document.getElementById("overlay-vis-pill");

  function setOverlayVisibilityUi(visible) {
    const on = Boolean(visible);
    if (toggleBtn) {
      toggleBtn.textContent = on ? "Hide map" : "Show map";
      toggleBtn.classList.toggle("btn-primary", !on);
      toggleBtn.classList.toggle("btn-secondary", on);
    }
    if (overlayCopy) {
      overlayCopy.textContent = on
        ? "Map is on over the game. Hide map anytime here, from the tray, or with the hotkey."
        : "Map is hidden. Click Show map when you’re ready to play.";
    }
    if (overlayPill) {
      overlayPill.textContent = on ? "Visible" : "Hidden";
      overlayPill.dataset.state = on ? "visible" : "hidden";
    }
  }

  toggleBtn?.addEventListener("click", async () => {
    const visible = await api.toggleOverlay();
    setOverlayVisibilityUi(visible);
  });

  if (typeof api.onOverlayVisibility === "function") {
    api.onOverlayVisibility(setOverlayVisibilityUi);
  }
  api.isOverlayVisible?.().then(setOverlayVisibilityUi).catch(() => {
    setOverlayVisibilityUi(false);
  });

  api.onSettings((s) => {
    const activeId = document.activeElement?.id;
    if (activeId && fields[activeId] && activeId !== "waypointLabel" && activeId !== "waypointColor") {
      return;
    }
    fillForm(s);
  });

  function setMaximizedUi(maximized) {
    document.body.classList.toggle("is-maximized", Boolean(maximized));
    const maxBtn = document.getElementById("win-max");
    if (!maxBtn) return;
    maxBtn.classList.toggle("is-maximized", Boolean(maximized));
    maxBtn.setAttribute("aria-label", maximized ? "Restore" : "Maximize");
    maxBtn.title = maximized ? "Restore" : "Maximize";
  }

  document.getElementById("win-min")?.addEventListener("click", () => api.minimize?.());
  document.getElementById("win-max")?.addEventListener("click", async () => {
    const maximized = await api.maximize?.();
    if (typeof maximized === "boolean") setMaximizedUi(maximized);
  });
  document.getElementById("win-close")?.addEventListener("click", () => api.close?.());
  api.onMaximized?.(setMaximizedUi);
  api.isMaximized?.().then(setMaximizedUi);
  api.onDisplays?.((list) => {
    populateOverlayDisplays(list, fields.overlayDisplay?.value);
  });

  document.querySelectorAll(".tutorial-jump").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.jump;
      if (!target) return;
      if (target === "tutorial") {
        beginTutorial();
        return;
      }
      const tab = btn.dataset.tab;
      if (target === "overlay" || PANEL_ALIASES[target]) {
        openOverlayTab(tab || PANEL_ALIASES[target]?.tab || "visual");
        return;
      }
      showPanel(target);
      if (target === "game") {
        const scope = document.querySelector('.panel[data-panel="game"]');
        activateTab(scope, tab || "hotkeys");
      }
      if (target === "destination") {
        const scope = document.querySelector('.panel[data-panel="destination"]');
        activateTab(scope, tab || "map");
      }
    });
  });

  document.getElementById("btn-restart-tutorial")?.addEventListener("click", () => {
    beginTutorial();
  });

  tourBack?.addEventListener("click", () => {
    if (!tourActive || tourStep <= 0) return;
    tourStep -= 1;
    renderTourStep();
  });

  tourNext?.addEventListener("click", () => {
    if (!tourActive) return;
    if (tourStep >= activeTourSteps.length - 1) {
      endTour(true);
      openOverlayTab("visual");
      return;
    }
    tourStep += 1;
    renderTourStep();
  });

  document.getElementById("tour-skip")?.addEventListener("click", () => {
    endTour(true);
  });

  document.getElementById("btn-reset-frame-align")?.addEventListener("click", async () => {
    applying = true;
    for (const [key, value] of Object.entries(FRAME_ALIGN_DEFAULTS)) {
      if (fields[key]) fields[key].value = value;
    }
    applying = false;
    updateLabels({ ...readForm(), ...FRAME_ALIGN_DEFAULTS });
    updatePreview({ ...readForm(), ...FRAME_ALIGN_DEFAULTS });
    markSaving();
    await api.setSettings({ ...FRAME_ALIGN_DEFAULTS });
    markSaved();
  });

  document.getElementById("welcome-start")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    beginTutorial();
  });

  document.getElementById("welcome-skip")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showWelcomeModal(false);
    markTutorialDone();
  });

  document.querySelector(".welcome-backdrop")?.addEventListener("click", (e) => {
    e.preventDefault();
    showWelcomeModal(false);
    markTutorialDone();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("welcome-modal");
    if (modal && modal.classList.contains("is-open")) {
      showWelcomeModal(false);
      markTutorialDone();
      return;
    }
    if (tourActive) endTour(true);
  });

  async function initDevTools() {
    const tab = document.getElementById("tab-dev");
    const panel = document.getElementById("panel-dev");
    if (!tab || !panel || typeof api.isDev !== "function") return;

    const isDev = await api.isDev();
    if (!isDev) {
      tab.setAttribute("hidden", "");
      panel.setAttribute("hidden", "");
      return;
    }

    tab.removeAttribute("hidden");

    const presetSel = document.getElementById("devDummyPreset");
    const xEl = document.getElementById("devDummyX");
    const yEl = document.getElementById("devDummyY");
    const zEl = document.getElementById("devDummyZ");
    const status = document.getElementById("dev-dummy-status");
    const presets = (await api.getDevPresets()) || [];

    function fillCoords(p) {
      if (!p || !xEl || !yEl || !zEl) return;
      xEl.value = String(Math.round(p.x));
      yEl.value = String(Math.round(p.y));
      zEl.value = String(Math.round(p.z ?? 0));
    }

    if (presetSel) {
      presetSel.innerHTML = presets
        .map(
          (p) =>
            `<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)}</option>`
        )
        .join("");
      if (presets[0]) fillCoords(presets[0]);
      refreshNvSelect(presetSel);
      presetSel.addEventListener("change", () => {
        const p = presets.find((row) => row.id === presetSel.value);
        fillCoords(p);
      });
    }

    document.getElementById("btn-dev-dummy-apply")?.addEventListener("click", async () => {
      const preset = presets.find((row) => row.id === presetSel?.value);
      const res = await api.applyDevDummyLocation({
        x: Number(xEl?.value),
        y: Number(yEl?.value),
        z: Number(zEl?.value),
        label: preset?.label || "Custom",
      });
      if (status) {
        status.textContent = res?.ok
          ? `Applied · ${Math.round(res.coords.x)}, ${Math.round(res.coords.y)}, ${Math.round(res.coords.z)}`
          : `Failed · ${res?.reason || "unknown"}`;
      }
    });

    document.getElementById("btn-dev-dummy-nudge")?.addEventListener("click", async () => {
      const res = await api.nudgeDevDummyLocation(50);
      if (res?.ok && xEl && yEl && zEl) {
        xEl.value = String(Math.round(res.coords.x));
        yEl.value = String(Math.round(res.coords.y));
        zEl.value = String(Math.round(res.coords.z));
      }
      if (status) {
        status.textContent = res?.ok
          ? `Nudged · ${Math.round(res.coords.x)}, ${Math.round(res.coords.y)} — copy again style for facing`
          : `Failed · ${res?.reason || "unknown"}`;
      }
    });
  }

  if (typeof api.onLocation === "function") {
    api.onLocation((coords) => {
      if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
      playerLocation = { x: coords.x, y: coords.y, z: coords.z };
      updateWaypointRemaining();
    });
  }

  async function fillAppVersion() {
    const el = document.getElementById("app-version");
    if (!el || typeof api.getAppVersion !== "function") return;
    try {
      const v = await api.getAppVersion();
      if (v) el.textContent = `v${String(v).replace(/^v/i, "")}`;
    } catch {
      /* keep HTML fallback */
    }
  }

  document.querySelector(".developer-page")?.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-external]");
    if (!link) return;
    e.preventDefault();
    const url = link.getAttribute("data-external");
    if (!url) return;
    if (typeof api.openExternal === "function") {
      api.openExternal(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });

  function applyUpdateStatus(status) {
    if (!status) return;
    const statusEl = document.getElementById("update-status");
    const progressEl = document.getElementById("update-progress");
    const barEl = document.getElementById("update-progress-bar");
    const btnCheck = document.getElementById("btn-check-update");
    const btnDownload = document.getElementById("btn-download-update");
    const btnInstall = document.getElementById("btn-install-update");
    const btnOpen = document.getElementById("btn-open-release");

    const state = status.state || "idle";
    const packaged = status.packaged !== false;
    let text = status.message || "";
    if (!text) {
      if (state === "checking") text = "Checking for updates…";
      else if (state === "current") text = "You’re on the latest version.";
      else if (state === "available") {
        text = `Version ${status.latestVersion || "?"} is available.`;
      } else if (state === "downloading") {
        text = `Downloading… ${Math.floor(status.percent || 0)}%`;
      } else if (state === "ready") {
        text = `Version ${status.latestVersion || "?"} ready — restart to install.`;
      } else if (state === "error") text = status.message || "Update check failed.";
      else text = "Updates come from the GitHub releases for this repo.";
    }
    if (statusEl) statusEl.textContent = text;

    const downloading = state === "downloading";
    if (progressEl) progressEl.hidden = !downloading;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, status.percent || 0))}%`;

    if (btnDownload) {
      btnDownload.hidden = !(state === "available" && packaged);
      btnDownload.disabled = downloading;
    }
    if (btnInstall) btnInstall.hidden = state !== "ready";
    if (btnOpen) {
      btnOpen.hidden = !(
        state === "available" ||
        state === "error" ||
        state === "current" ||
        Boolean(status.releaseUrl)
      );
    }
    if (btnCheck) btnCheck.disabled = state === "checking" || downloading;
  }

  function initUpdaterUi() {
    if (typeof api.onUpdateStatus === "function") {
      api.onUpdateStatus(applyUpdateStatus);
    }
    document.getElementById("btn-check-update")?.addEventListener("click", async () => {
      applyUpdateStatus({ state: "checking", message: "Checking for updates…" });
      const status = await api.checkForUpdates?.();
      applyUpdateStatus(status);
    });
    document.getElementById("btn-download-update")?.addEventListener("click", async () => {
      const status = await api.downloadUpdate?.();
      applyUpdateStatus(status);
    });
    document.getElementById("btn-install-update")?.addEventListener("click", () => {
      api.installUpdate?.();
    });
    document.getElementById("btn-open-release")?.addEventListener("click", () => {
      api.openReleasePage?.();
    });
    api.getUpdateStatus?.().then(applyUpdateStatus).catch(() => {});
  }

  api.getSettings().then(async (s) => {
    await refreshOverlayDisplays(s.overlayDisplay || "primary");
    fillForm(s);
    if (typeof api.getLastLocation === "function") {
      const loc = await api.getLastLocation();
      if (loc && Number.isFinite(loc.x) && Number.isFinite(loc.y)) {
        playerLocation = { x: loc.x, y: loc.y, z: loc.z };
        updateWaypointRemaining();
      }
    }
    await initDevTools();
    await fillAppVersion();
    initUpdaterUi();
    if (!s.tutorialCompleted) showWelcomeModal(true);
  });
})();
