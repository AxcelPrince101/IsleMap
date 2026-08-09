(() => {
  const api = window.isleDashboard;
  if (!api) {
    document.body.innerHTML =
      "<p style='padding:24px'>Dashboard bridge missing. Restart with npm start.</p>";
    return;
  }

  const fields = {
    basemap: document.getElementById("basemap"),
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
    showWallows: document.getElementById("showWallows"),
    showSanctuaries: document.getElementById("showSanctuaries"),
    placeStyle: document.getElementById("placeStyle"),
    placeFilter: document.getElementById("placeFilter"),
    placeNearbyOnly: document.getElementById("placeNearbyOnly"),
    placeNearbyRadiusKm: document.getElementById("placeNearbyRadiusKm"),
    edgePins: document.getElementById("edgePins"),
    edgeWaters: document.getElementById("edgeWaters"),
    edgeAreas: document.getElementById("edgeAreas"),
    edgeLandmarks: document.getElementById("edgeLandmarks"),
    edgeWallows: document.getElementById("edgeWallows"),
    edgeSanctuaries: document.getElementById("edgeSanctuaries"),
    showChrome: document.getElementById("showChrome"),
    mapSize: document.getElementById("mapSize"),
    zoom: document.getElementById("zoom"),
    overlayDisplay: document.getElementById("overlayDisplay"),
    position: document.getElementById("position"),
    followPlayer: document.getElementById("followPlayer"),
    requireGameFocus: document.getElementById("requireGameFocus"),
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
    wallows: document.getElementById("destShowWallows"),
    sanctuaries: document.getElementById("destShowSanctuaries"),
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
    group: {
      title: "Group",
      sub: "Squad pins via username + PC ID — no accounts.",
    },
    "map-editor": {
      title: "Map editor",
      sub: "Add areas, water, landmarks, wallows, and sanctuaries to the Gateway legend.",
    },
    game: {
      title: "Game & hotkeys",
      sub: "EAC-safe usage, bindings, and system notes.",
    },
    tutorial: {
      title: "Tutorial",
      sub: "Learn Asset Location, overlay modes, monitors, and waypoints.",
    },
    contributors: {
      title: "Contributors",
      sub: "People who help build IsleMap.",
    },
    developer: {
      title: "Updates",
      sub: "Check GitHub releases and install newer versions.",
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
    { key: "hotkeyPlaceFilter", label: "Cycle place filter", hint: "All → Water → Areas → Landmarks → Wallows → Sanctuaries" },
    { key: "hotkeyFilterAll", label: "Filter: All", hint: "Show every place type" },
    { key: "hotkeyFilterWaters", label: "Filter: Water", hint: "Water POIs only" },
    { key: "hotkeyFilterAreas", label: "Filter: Areas", hint: "Areas only" },
    { key: "hotkeyFilterLandmarks", label: "Filter: Landmarks", hint: "Landmarks only" },
    { key: "hotkeyFilterWallows", label: "Filter: Wallows", hint: "Wallows only" },
    { key: "hotkeyFilterSanctuaries", label: "Filter: Sanctuaries", hint: "Sanctuaries only" },
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
    hotkeyFilterWallows: "CommandOrControl+Shift+5",
    hotkeyFilterSanctuaries: "CommandOrControl+Shift+6",
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
  let destBasemapOverlay = null;
  /** @type {string} */
  let destBasemapId = "";
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
    if (fields.edgeWallows) fields.edgeWallows.disabled = !on;
    if (fields.edgeSanctuaries) fields.edgeSanctuaries.disabled = !on;
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

  function applyDashboardBasemap(id) {
    if (!window.IsleCoords) return;
    const { setBasemap, basemapUrl, mapBounds } = window.IsleCoords;
    const next = setBasemap(id || window.IsleCoords.DEFAULT_BASEMAP || "gateway-official");
    const url = basemapUrl(next.id, "dashboard");
    const bounds = mapBounds();

    if (destMap) {
      if (destBasemapOverlay) destMap.removeLayer(destBasemapOverlay);
      destBasemapOverlay = L.imageOverlay(url, bounds).addTo(destMap);
      destBasemapOverlay.bringToBack();
      destBasemapId = next.id;
      destMap.setMaxBounds(bounds);
    }

    if (legendMap) {
      if (legendBasemapOverlay) legendMap.removeLayer(legendBasemapOverlay);
      legendBasemapOverlay = L.imageOverlay(url, bounds).addTo(legendMap);
      legendBasemapOverlay.bringToBack();
      legendBasemapId = next.id;
      legendMap.setMaxBounds(bounds);
    }

    const previewMap = document.getElementById("preview-map");
    if (previewMap) {
      previewMap.style.backgroundImage = `url("${url}")`;
    }
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
    const defaultBasemap = window.IsleCoords?.DEFAULT_BASEMAP || "gateway-official";
    preview.dataset.basemap = s.basemap || defaultBasemap;
    preview.dataset.border = s.borderStyle || "classic";
    preview.dataset.frameStack = s.frameMapOnTop ? "map-top" : "frame-top";
    preview.classList.toggle("hide-fov", !s.showFov);
    preview.classList.toggle(
      "hide-compass",
      s.showCompass === false ||
      s.borderStyle === "isle-evrima" ||
      s.borderStyle === "primal-pinas"
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
    applyDashboardBasemap(s.basemap || defaultBasemap);
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

  function isPhotoFrameBorder(style) {
    return style === "isle-evrima" || style === "primal-pinas";
  }

  function syncBorderStyleFields(style) {
    const framed = isPhotoFrameBorder(style);
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
    const showDot =
      category === "landmarks" ||
      category === "waters" ||
      category === "wallows" ||
      category === "sanctuaries";
    const hl = highlighted ? " is-highlight" : "";
    const dot = showDot ? '<span class="pp-dot" aria-hidden="true"></span>' : "";
    const label = `<span class="pp-label">${escapeHtml(place.name)}</span>`;
    const catClass =
      category === "waters"
        ? "pp-water"
        : category === "landmarks"
          ? "pp-landmark"
          : category === "wallows"
            ? "pp-wallow"
            : category === "sanctuaries"
              ? "pp-sanctuary"
              : "pp-area";
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

  async function reloadDestPlaces() {
    if (!destMap) return;
    if (destPlacesLayer) {
      destMap.removeLayer(destPlacesLayer);
      destPlacesLayer = null;
    }
    destPlaceRecords = [];
    destPlacesLoaded = false;
    await loadDestPlaces();
  }

  async function loadDestPlaces() {
    if (!destMap || destPlacesLoaded) return;
    destPlacesLayer = L.layerGroup().addTo(destMap);
    try {
      let data = null;
      if (typeof api.getPlaces === "function") {
        const res = await api.getPlaces();
        if (res?.ok) data = res.doc;
      }
      if (!data) {
        const res = await fetch(`../data/gateway-areas.json?t=${Date.now()}`);
        data = await res.json();
      }
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
      wallows: destLayerToggles.wallows?.checked !== false,
      sanctuaries: destLayerToggles.sanctuaries?.checked !== false,
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
    const basemapId =
      fields.basemap?.value ||
      window.IsleCoords.DEFAULT_BASEMAP ||
      "gateway-official";
    const { setBasemap, basemapUrl, mapBounds } = window.IsleCoords;
    setBasemap(basemapId);
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
    destBasemapOverlay = L.imageOverlay(
      basemapUrl(basemapId, "dashboard"),
      bounds
    ).addTo(destMap);
    destBasemapId = setBasemap(basemapId).id;
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
    if (fields.basemap) {
      fields.basemap.value =
        s.basemap || window.IsleCoords?.DEFAULT_BASEMAP || "gateway-official";
    }
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
    if (fields.showWallows) fields.showWallows.checked = s.showWallows !== false;
    if (fields.showSanctuaries) {
      fields.showSanctuaries.checked = s.showSanctuaries !== false;
    }
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
    if (fields.edgeWallows) fields.edgeWallows.checked = s.edgeWallows !== false;
    if (fields.edgeSanctuaries) {
      fields.edgeSanctuaries.checked = s.edgeSanctuaries !== false;
    }
    fields.showChrome.checked = s.showChrome;
    syncEdgeChecklistState();
    fields.mapSize.value = s.mapSize;
    fields.zoom.value = s.zoom;
    fields.position.value = s.position;
    fields.followPlayer.checked = s.followPlayer !== false;
    if (fields.requireGameFocus) {
      fields.requireGameFocus.checked = s.requireGameFocus !== false;
    }
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
      basemap:
        fields.basemap?.value ||
        window.IsleCoords?.DEFAULT_BASEMAP ||
        "gateway-official",
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
      showWallows: fields.showWallows?.checked !== false,
      showSanctuaries: fields.showSanctuaries?.checked !== false,
      placeStyle: fields.placeStyle.value,
      placeFilter: fields.placeFilter.value,
      placeNearbyOnly: Boolean(fields.placeNearbyOnly?.checked),
      placeNearbyRadiusKm: Number(fields.placeNearbyRadiusKm?.value ?? 2),
      edgePins: fields.edgePins.checked,
      edgeWaters: fields.edgeWaters.checked,
      edgeAreas: fields.edgeAreas.checked,
      edgeLandmarks: fields.edgeLandmarks.checked,
      edgeWallows: fields.edgeWallows?.checked !== false,
      edgeSanctuaries: fields.edgeSanctuaries?.checked !== false,
      showChrome: fields.showChrome.checked,
      showWaypointPin: fields.showWaypointPin?.checked !== false,
      showWaypointLabel: fields.showWaypointLabel?.checked !== false,
      mapSize: Number(fields.mapSize.value),
      zoom: Number(fields.zoom.value),
      overlayDisplay: fields.overlayDisplay?.value || "primary",
      position: fields.position.value,
      followPlayer: fields.followPlayer.checked,
      requireGameFocus: fields.requireGameFocus?.checked !== false,
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

    // Map editor is unpackaged/developer-only
    if (id === "map-editor") {
      const nav = document.getElementById("nav-map-editor");
      if (!nav || nav.hidden || nav.hasAttribute("hidden")) {
        id = "overlay";
      }
    }

    document.querySelectorAll(".nav").forEach((b) => {
      b.classList.toggle("active", b.dataset.panel === id);
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("is-active", p.dataset.panel === id);
    });
    contentEl?.classList.toggle("is-destination", id === "destination");
    contentEl?.classList.toggle("is-map-editor", id === "map-editor");
    contentEl?.classList.toggle("is-group", id === "group");
    contentEl?.classList.toggle("is-game", id === "game");
    contentEl?.classList.toggle("is-tutorial", id === "tutorial");
    contentEl?.classList.toggle("is-contributors", id === "contributors");
    contentEl?.classList.toggle("is-developer", id === "developer");
    const meta = panelMeta[id];
    if (meta) {
      panelTitle.textContent = meta.title;
      panelSub.textContent = meta.sub;
    }
    if (id === "contributors") {
      // Re-fetch each visit so src/data/contributors.json edits show up in dev
      void initContributorsPage();
    }
    if (id === "destination") {
      ensureDestMap();
      refreshDestMapSize();
    }
    if (id === "map-editor") {
      ensureLegendEditorMap();
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
      body: "Sidebar modules: Overlay, Destination, Group, Game & hotkeys, Tutorial, Contributors, and Updates.",
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
      body: "Pick the island Map (Gateway or Gateway Official), Map design (tactical, phosphor…), border (classic, Isle Evrima, or Primal Pinas), player pin, and FOV color.",
    },
    {
      target: "frame-card",
      panel: "overlay",
      tab: "frame",
      title: "Frame",
      body: "When Border design is a photo frame (Isle Evrima or Primal Pinas), unlock scale, map fill, offsets, hole anchors, and padding so the art sits flush on the map.",
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
      body: "The radar starts hidden. Use Show map to enable it. By default it only appears while The Isle is active — turn that off under Overlay → Layout to keep it visible anytime. Hide map turns it off fully.",
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
      target: "nav-group",
      panel: "group",
      title: "Group module",
      body: "Share live pins with a squad. No accounts — just a username and an automatic PC ID for this computer.",
    },
    {
      target: "group-identity",
      panel: "group",
      title: "Identity",
      body: "Pick a username others see on the radar. Your PC ID is unique to this install and is saved across updates.",
    },
    {
      target: "group-lobby",
      panel: "group",
      title: "Lobby",
      body: "Create group to get a shareable code, or enter a friend’s code and Join. Copy the code so your squad can connect.",
    },
    {
      target: "group-members",
      panel: "group",
      title: "Members & pins",
      body: "See who’s online. Host can Remove members. After you Copy Location (Asset Location), your pin appears on everyone’s radar.",
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
      target: "setup-group",
      panel: "game",
      tab: "setup",
      title: "Group tip",
      body: "Under Group: set a username, create or join with a code, then click Asset Location so squadmates see your pin on the radar.",
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
      title: "Updates",
      body: "Check for new builds from GitHub Releases here — download and restart to install. IsleMap is by Balake Gaming (balake101). You’re ready — click Asset Location, join a Group, set a waypoint, and tune Overlay.",
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

  function setOverlayVisibilityUi(state) {
    const enabled =
      typeof state === "object" && state != null
        ? Boolean(state.enabled)
        : Boolean(state);
    const waiting =
      typeof state === "object" && state != null
        ? Boolean(state.waitingForGame)
        : false;
    const shown =
      typeof state === "object" && state != null
        ? Boolean(state.visible)
        : enabled;

    if (toggleBtn) {
      toggleBtn.textContent = enabled ? "Hide map" : "Show map";
      toggleBtn.classList.toggle("btn-primary", !enabled);
      toggleBtn.classList.toggle("btn-secondary", enabled);
    }
    const requireFocus =
      typeof state === "object" && state != null
        ? state.requireGameFocus !== false
        : fields.requireGameFocus?.checked !== false;

    if (overlayCopy) {
      if (!enabled) {
        overlayCopy.textContent = requireFocus
          ? "Map is hidden. Click Show map when you’re ready to play — it only appears while The Isle is active."
          : "Map is hidden. Click Show map to show the radar anytime.";
      } else if (waiting) {
        overlayCopy.textContent =
          "Map is on. Focus The Isle to show the radar — it hides when you leave the game.";
      } else if (shown) {
        overlayCopy.textContent = requireFocus
          ? "Map is on over The Isle. It hides when another app is focused. Hide map anytime here, from the tray, or with the hotkey."
          : "Map is on. It stays visible even if The Isle is closed. Hide map anytime here, from the tray, or with the hotkey.";
      } else {
        overlayCopy.textContent =
          "Map is on. Focus The Isle to show the radar.";
      }
    }
    if (overlayPill) {
      if (!enabled) {
        overlayPill.textContent = "Hidden";
        overlayPill.dataset.state = "hidden";
      } else if (waiting) {
        overlayPill.textContent = "Waiting";
        overlayPill.dataset.state = "waiting";
      } else {
        overlayPill.textContent = "Visible";
        overlayPill.dataset.state = "visible";
      }
    }
  }

  toggleBtn?.addEventListener("click", async () => {
    const state = await api.toggleOverlay();
    setOverlayVisibilityUi(state);
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

  /** @type {import('leaflet').Map | null} */
  let legendMap = null;
  /** @type {any} */
  let legendBasemapOverlay = null;
  /** @type {string} */
  let legendBasemapId = "";
  /** @type {import('leaflet').LayerGroup | null} */
  let legendPlacesLayer = null;
  /** @type {import('leaflet').Marker | null} */
  let legendDraftMarker = null;
  /** @type {{ id: string, name: string, x: number, y: number, category: string, grid: string|null }[]} */
  let legendPlaces = [];
  let legendSelectedId = null;
  let legendDirty = false;
  let legendEditorReady = false;

  function legendDraftIcon() {
    return L.divIcon({
      className: "legend-draft-marker",
      html: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  function setLegendStatus(text, kind) {
    const el = document.getElementById("legend-editor-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-dirty", kind === "dirty");
    el.classList.toggle("is-ok", kind === "ok");
    el.classList.toggle("is-error", kind === "error");
  }

  function markLegendDirty(dirty) {
    legendDirty = Boolean(dirty);
    if (legendDirty) {
      setLegendStatus(
        `${legendPlaces.length} legends · unsaved changes`,
        "dirty"
      );
    } else {
      setLegendStatus(`${legendPlaces.length} legends · saved`, "ok");
    }
  }

  function syncLegendFormFromSelection() {
    const nameEl = document.getElementById("legend-name");
    const catEl = document.getElementById("legend-category");
    const xEl = document.getElementById("legend-x");
    const yEl = document.getElementById("legend-y");
    const gridEl = document.getElementById("legend-grid");
    const btnAdd = document.getElementById("legend-btn-add");
    const btnUpdate = document.getElementById("legend-btn-update");
    const btnDelete = document.getElementById("legend-btn-delete");
    const place = legendPlaces.find((p) => p.id === legendSelectedId);

    if (!place) {
      if (btnAdd) btnAdd.hidden = false;
      if (btnUpdate) btnUpdate.hidden = true;
      if (btnDelete) btnDelete.hidden = true;
      return;
    }

    if (nameEl) nameEl.value = place.name;
    if (catEl) {
      catEl.value = place.category;
      refreshNvSelect(catEl);
    }
    if (xEl) xEl.value = String(Math.round(place.x));
    if (yEl) yEl.value = String(Math.round(place.y));
    if (gridEl) {
      gridEl.textContent =
        place.grid ||
        window.IsleCoords?.gridCode(place.x, place.y) ||
        "—";
    }
    if (btnAdd) btnAdd.hidden = true;
    if (btnUpdate) btnUpdate.hidden = false;
    if (btnDelete) btnDelete.hidden = false;
    syncLegendDraftMarker(place.x, place.y);
  }

  function syncLegendDraftMarker(x, y) {
    if (!legendMap || !window.IsleCoords || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    const ll = window.IsleCoords.worldToLatLng(L, x, y);
    if (!legendDraftMarker) {
      legendDraftMarker = L.marker(ll, {
        icon: legendDraftIcon(),
        interactive: false,
        keyboard: false,
        zIndexOffset: 500,
      }).addTo(legendMap);
    } else {
      legendDraftMarker.setLatLng(ll);
      if (!legendMap.hasLayer(legendDraftMarker)) {
        legendDraftMarker.addTo(legendMap);
      }
    }
  }

  function syncLegendGridFromInputs() {
    const x = Number(document.getElementById("legend-x")?.value);
    const y = Number(document.getElementById("legend-y")?.value);
    const gridEl = document.getElementById("legend-grid");
    if (!gridEl) return;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !window.IsleCoords) {
      gridEl.textContent = "—";
      return;
    }
    gridEl.textContent = window.IsleCoords.gridCode(x, y) || "—";
    syncLegendDraftMarker(x, y);
  }

  function renderLegendList() {
    const list = document.getElementById("legend-list");
    if (!list) return;
    const q = String(document.getElementById("legend-search")?.value || "")
      .trim()
      .toLowerCase();
    const rows = legendPlaces
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));

    list.innerHTML = rows
      .map((p) => {
        const selected = p.id === legendSelectedId ? " is-selected" : "";
        const grid = p.grid || "—";
        return `<li class="${selected}" data-id="${escapeHtml(p.id)}" tabindex="0">
          <span class="legend-list-name">${escapeHtml(p.name)}</span>
          <span class="legend-cat">${escapeHtml(p.category)}</span>
          <span class="legend-list-meta">${escapeHtml(grid)} · ${Math.round(p.x)}, ${Math.round(p.y)}</span>
        </li>`;
      })
      .join("");
  }

  function categoryKeyForPlace(category) {
    if (category === "water") return "waters";
    if (category === "area") return "areas";
    if (category === "wallow") return "wallows";
    if (category === "sanctuary") return "sanctuaries";
    return "landmarks";
  }

  function rebuildLegendMapMarkers() {
    if (!legendMap || !window.IsleCoords) return;
    if (legendPlacesLayer) legendPlacesLayer.clearLayers();
    else legendPlacesLayer = L.layerGroup().addTo(legendMap);

    for (const place of legendPlaces) {
      const ll = window.IsleCoords.worldToLatLng(L, place.x, place.y);
      const selected = place.id === legendSelectedId;
      const marker = L.marker(ll, {
        icon: ppPlaceIcon(place, categoryKeyForPlace(place.category), selected),
        interactive: true,
        keyboard: false,
        zIndexOffset: selected ? 400 : 100,
      }).addTo(legendPlacesLayer);
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectLegendPlace(place.id);
      });
    }
  }

  function selectLegendPlace(id) {
    legendSelectedId = id;
    syncLegendFormFromSelection();
    renderLegendList();
    rebuildLegendMapMarkers();
    const place = legendPlaces.find((p) => p.id === id);
    if (place && legendMap && window.IsleCoords) {
      legendMap.panTo(window.IsleCoords.worldToLatLng(L, place.x, place.y));
    }
  }

  function clearLegendForm() {
    legendSelectedId = null;
    const nameEl = document.getElementById("legend-name");
    const xEl = document.getElementById("legend-x");
    const yEl = document.getElementById("legend-y");
    const gridEl = document.getElementById("legend-grid");
    const btnAdd = document.getElementById("legend-btn-add");
    const btnUpdate = document.getElementById("legend-btn-update");
    const btnDelete = document.getElementById("legend-btn-delete");
    if (nameEl) nameEl.value = "";
    if (xEl) xEl.value = "";
    if (yEl) yEl.value = "";
    if (gridEl) gridEl.textContent = "—";
    if (btnAdd) btnAdd.hidden = false;
    if (btnUpdate) btnUpdate.hidden = true;
    if (btnDelete) btnDelete.hidden = true;
    if (legendDraftMarker && legendMap?.hasLayer(legendDraftMarker)) {
      legendMap.removeLayer(legendDraftMarker);
    }
    renderLegendList();
    rebuildLegendMapMarkers();
  }

  function readLegendForm() {
    const name = String(document.getElementById("legend-name")?.value || "").trim();
    const category = String(document.getElementById("legend-category")?.value || "landmark");
    const x = Number(document.getElementById("legend-x")?.value);
    const y = Number(document.getElementById("legend-y")?.value);
    const grid =
      window.IsleCoords && Number.isFinite(x) && Number.isFinite(y)
        ? window.IsleCoords.gridCode(x, y)
        : null;
    return { name, category, x, y, grid };
  }

  function addOrUpdateLegend(asUpdate) {
    const form = readLegendForm();
    if (!form.name) {
      setLegendStatus("Name is required.", "error");
      return;
    }
    if (!Number.isFinite(form.x) || !Number.isFinite(form.y)) {
      setLegendStatus("Click the map (or enter X/Y) first.", "error");
      return;
    }

    if (asUpdate && legendSelectedId) {
      const idx = legendPlaces.findIndex((p) => p.id === legendSelectedId);
      if (idx >= 0) {
        legendPlaces[idx] = {
          ...legendPlaces[idx],
          name: form.name,
          category: form.category,
          x: form.x,
          y: form.y,
          grid: form.grid,
        };
      }
    } else {
      const used = new Set(legendPlaces.map((p) => p.id));
      let base = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "place";
      let id = `${base}-custom`;
      let n = 0;
      while (used.has(id)) {
        n += 1;
        id = `${base}-custom-${n}`;
      }
      legendPlaces.push({
        id,
        name: form.name,
        category: form.category,
        x: form.x,
        y: form.y,
        grid: form.grid,
      });
      legendSelectedId = id;
    }

    markLegendDirty(true);
    syncLegendFormFromSelection();
    renderLegendList();
    rebuildLegendMapMarkers();
  }

  async function loadLegendPlacesFromDisk() {
    if (typeof api.getPlaces !== "function") return;
    const res = await api.getPlaces();
    if (!res?.ok) {
      setLegendStatus(`Failed to load · ${res?.reason || "unknown"}`, "error");
      return;
    }
    legendPlaces = (res.places || []).map((p) => ({
      id: p.id,
      name: p.name,
      x: Number(p.x),
      y: Number(p.y),
      category: p.category || "landmark",
      grid: p.grid ?? null,
    }));
    legendSelectedId = null;
    markLegendDirty(false);
    clearLegendForm();
    renderLegendList();
    rebuildLegendMapMarkers();
    setLegendStatus(`${legendPlaces.length} legends loaded from project`, "ok");
  }

  async function saveLegendPlacesToDisk() {
    if (typeof api.savePlaces !== "function") return;
    const res = await api.savePlaces({ places: legendPlaces });
    if (!res?.ok) {
      setLegendStatus(`Save failed · ${res?.reason || "unknown"}`, "error");
      return;
    }
    legendPlaces = flattenFromDoc(res.doc);
    markLegendDirty(false);
    setLegendStatus(
      `Saved ${legendPlaces.length} legends to project · include in the next release`,
      "ok"
    );
    await reloadDestPlaces();
  }

  function flattenFromDoc(doc) {
    const out = [];
    const cats = doc?.categories || {};
    for (const [key, list] of Object.entries(cats)) {
      if (!Array.isArray(list)) continue;
      for (const p of list) {
        out.push({
          id: p.id,
          name: p.name,
          x: Number(p.x),
          y: Number(p.y),
          category:
            p.category ||
            (key === "waters"
              ? "water"
              : key === "areas"
                ? "area"
                : key === "wallows"
                  ? "wallow"
                  : key === "sanctuaries"
                    ? "sanctuary"
                    : "landmark"),
          grid: p.grid ?? null,
        });
      }
    }
    return out;
  }

  function ensureLegendEditorMap() {
    const mapEl = document.getElementById("legend-editor-map");
    const editor = document.getElementById("legend-editor");
    if (!mapEl || !editor) return;
    if (!legendMap && typeof L !== "undefined" && window.IsleCoords) {
      const basemapId =
        fields.basemap?.value ||
        window.IsleCoords.DEFAULT_BASEMAP ||
        "gateway-official";
      const { setBasemap, basemapUrl, mapBounds } = window.IsleCoords;
      setBasemap(basemapId);
      const bounds = mapBounds();
      legendMap = L.map(mapEl, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 4,
        zoomSnap: 0.25,
        attributionControl: false,
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
      });
      legendBasemapOverlay = L.imageOverlay(
        basemapUrl(basemapId, "dashboard"),
        bounds
      ).addTo(legendMap);
      legendBasemapId = setBasemap(basemapId).id;
      legendMap.getContainer().style.background = "#05070d";
      legendMap.fitBounds(bounds, { padding: [8, 8] });
      legendPlacesLayer = L.layerGroup().addTo(legendMap);
      legendMap.on("click", (e) => {
        const world = window.IsleCoords.latLngToWorld(e.latlng);
        const xEl = document.getElementById("legend-x");
        const yEl = document.getElementById("legend-y");
        if (xEl) xEl.value = String(Math.round(world.x));
        if (yEl) yEl.value = String(Math.round(world.y));
        syncLegendGridFromInputs();
        const hint = document.getElementById("legend-editor-hint");
        if (hint) {
          hint.textContent = legendSelectedId
            ? "Position updated — click Update selected to apply."
            : "Position set — enter a name and click Add legend.";
        }
      });
      rebuildLegendMapMarkers();
    }
    requestAnimationFrame(() => {
      legendMap?.invalidateSize({ animate: false });
    });
  }

  async function initLegendEditor() {
    const editor = document.getElementById("legend-editor");
    const nav = document.getElementById("nav-map-editor");
    const panel = document.getElementById("panel-map-editor");
    if (!editor) return;

    let canEdit = false;
    if (typeof api.canEditPlaces === "function") {
      try {
        const info = await api.canEditPlaces();
        canEdit = Boolean(info?.ok);
      } catch {
        canEdit = false;
      }
    } else if (typeof api.isDev === "function") {
      canEdit = await api.isDev();
    }

    // Packaged / production builds: hide Map editor entirely
    if (!canEdit) {
      if (nav) {
        nav.hidden = true;
        nav.setAttribute("hidden", "");
        nav.style.display = "none";
      }
      if (panel) {
        panel.hidden = true;
        panel.setAttribute("hidden", "");
        panel.style.display = "none";
      }
      return;
    }

    if (nav) {
      nav.hidden = false;
      nav.removeAttribute("hidden");
      nav.style.display = "";
    }
    if (panel) {
      panel.hidden = false;
      panel.removeAttribute("hidden");
      panel.style.display = "";
    }

    if (legendEditorReady) {
      ensureLegendEditorMap();
      return;
    }
    legendEditorReady = true;

    const catEl = document.getElementById("legend-category");
    if (catEl) refreshNvSelect(catEl);

    document.getElementById("legend-list")?.addEventListener("click", (e) => {
      const row = e.target.closest("li[data-id]");
      if (!row) return;
      selectLegendPlace(row.dataset.id);
    });
    document.getElementById("legend-search")?.addEventListener("input", () => {
      renderLegendList();
    });
    document.getElementById("legend-x")?.addEventListener("input", syncLegendGridFromInputs);
    document.getElementById("legend-y")?.addEventListener("input", syncLegendGridFromInputs);
    document.getElementById("legend-btn-add")?.addEventListener("click", () => {
      addOrUpdateLegend(false);
    });
    document.getElementById("legend-btn-update")?.addEventListener("click", () => {
      addOrUpdateLegend(true);
    });
    document.getElementById("legend-btn-clear")?.addEventListener("click", () => {
      clearLegendForm();
    });
    document.getElementById("legend-btn-delete")?.addEventListener("click", () => {
      if (!legendSelectedId) return;
      legendPlaces = legendPlaces.filter((p) => p.id !== legendSelectedId);
      clearLegendForm();
      markLegendDirty(true);
      renderLegendList();
      rebuildLegendMapMarkers();
    });
    document.getElementById("legend-btn-save")?.addEventListener("click", () => {
      saveLegendPlacesToDisk().catch(() => {});
    });
    document.getElementById("legend-btn-reload")?.addEventListener("click", () => {
      loadLegendPlacesFromDisk().catch(() => {});
    });

    if (typeof api.onPlacesUpdated === "function") {
      api.onPlacesUpdated(() => {
        reloadDestPlaces().catch(() => {});
      });
    }

    await loadLegendPlacesFromDisk();
    ensureLegendEditorMap();
  }

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

  function openExternalFromClick(e) {
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
  }

  document.querySelector(".developer-page")?.addEventListener("click", openExternalFromClick);
  document.querySelector(".contributors-page")?.addEventListener("click", openExternalFromClick);

  function contributorInitials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  function renderContributorCard(person) {
    const name = escapeHtml(person.name || "Contributor");
    const role = escapeHtml(person.role || "");
    const note = person.note ? `<p class="contributor-note">${escapeHtml(person.note)}</p>` : "";
    const handle = person.handle
      ? `<p class="contributor-handle"><code>${escapeHtml(person.handle)}</code></p>`
      : "";
    const links = Array.isArray(person.links)
      ? person.links
          .filter((l) => l?.url && l?.label)
          .map(
            (l) =>
              `<a href="${escapeHtml(l.url)}" data-external="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`
          )
          .join("")
      : "";
    const avatar = person.avatar
      ? `<img class="contributor-avatar" src="${escapeHtml(person.avatar)}" alt="" width="56" height="56" />`
      : `<div class="contributor-avatar-fallback" aria-hidden="true">${escapeHtml(contributorInitials(person.name))}</div>`;

    return `<article class="contributor-card">
      ${avatar}
      <div class="contributor-body">
        <h5 class="contributor-name">${name}</h5>
        ${role ? `<p class="contributor-role">${role}</p>` : ""}
        ${handle}
        ${note}
        ${links ? `<div class="contributor-links">${links}</div>` : ""}
      </div>
    </article>`;
  }

  function initGroupPage() {
    if (typeof api.getGroupStatus !== "function") return;

    const els = {
      pill: document.getElementById("group-status-pill"),
      username: document.getElementById("group-username"),
      pcid: document.getElementById("group-pcid"),
      hint: document.getElementById("group-config-hint"),
      lobbyIdle: document.getElementById("group-lobby-idle"),
      lobbyActive: document.getElementById("group-lobby-active"),
      lobbyMsg: document.getElementById("group-lobby-msg"),
      codeValue: document.getElementById("group-code-value"),
      joinCode: document.getElementById("group-join-code"),
      memberList: document.getElementById("group-member-list"),
      memberCount: document.getElementById("group-member-count"),
      pusherKey: document.getElementById("group-pusher-key"),
      pusherCluster: document.getElementById("group-pusher-cluster"),
      authUrl: document.getElementById("group-auth-url"),
    };

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderGroup(status) {
      if (!status) return;
      const state = status.status || "idle";
      if (els.pill) {
        els.pill.dataset.state = state;
        els.pill.textContent =
          state === "joined"
            ? "In group"
            : state === "connecting"
              ? "Connecting"
              : state === "error"
                ? "Error"
                : "Idle";
      }
      if (els.pcid) els.pcid.textContent = status.pcId || "—";
      if (els.username && document.activeElement !== els.username) {
        els.username.value = status.username || "";
      }
      if (els.hint) {
        els.hint.textContent = status.configured
          ? state === "joined"
            ? "Squad linked — Copy Location to share your pin."
            : "Set a username, then create or join a group."
          : "Pusher isn’t configured yet. Open Advanced or use .env — players still only need a username.";
      }

      const msg = String(status.message || "").trim();
      if (els.lobbyMsg) {
        els.lobbyMsg.hidden = !msg;
        els.lobbyMsg.textContent = msg;
        els.lobbyMsg.dataset.tone =
          state === "error" ? "error" : state === "joined" ? "ok" : "";
      }

      const inGroup = state === "joined";
      if (els.lobbyIdle) els.lobbyIdle.hidden = inGroup || state === "connecting";
      if (els.lobbyActive) els.lobbyActive.hidden = !inGroup;
      if (els.codeValue) els.codeValue.textContent = status.roomCode || "————";
      if (els.joinCode && status.roomCode && document.activeElement !== els.joinCode) {
        // keep last typed code unless empty
        if (!els.joinCode.value) els.joinCode.value = status.roomCode;
      }

      const members = Array.isArray(status.members) ? status.members : [];
      if (els.memberCount) els.memberCount.textContent = String(members.length);
      if (els.memberList) {
        if (!members.length) {
          els.memberList.innerHTML = inGroup
            ? '<li class="group-member-empty">Waiting for squadmates…</li>'
            : '<li class="group-member-empty">Join or create a group to see members</li>';
        } else {
          els.memberList.innerHTML = members
            .map((m) => {
              const badges = [
                m.isHost ? '<span class="group-badge is-host">Host</span>' : "",
                m.isSelf ? '<span class="group-badge is-you">You</span>' : "",
              ].join("");
              const kick =
                status.isHost && !m.isSelf
                  ? `<button type="button" class="btn btn-ghost btn-small btn-danger-ghost" data-kick="${escapeHtml(
                      m.pcId
                    )}">Remove</button>`
                  : "";
              const color = escapeHtml(m.color || "#76b900");
              return `<li class="${m.isSelf ? "is-self" : ""}">
                <span class="group-member-swatch" style="--member:${color}"></span>
                <div class="group-member-meta">
                  <strong>${escapeHtml(m.username || "Hunter")}</strong>
                  <span>${escapeHtml(m.pcId || "")}</span>
                </div>
                <div class="group-member-side">${badges}${kick}</div>
              </li>`;
            })
            .join("");
        }
      }
    }

    els.memberList?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-kick]");
      if (!btn) return;
      const pcId = btn.getAttribute("data-kick");
      await api.kickGroupMember?.(pcId);
    });

    document.getElementById("btn-copy-pcid")?.addEventListener("click", async () => {
      const id = els.pcid?.textContent || "";
      if (!id || id === "—") return;
      try {
        await navigator.clipboard.writeText(id);
      } catch {
        /* ignore */
      }
    });

    document
      .getElementById("btn-copy-group-code")
      ?.addEventListener("click", async () => {
        const code = els.codeValue?.textContent || "";
        if (!code || code.includes("—")) return;
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          /* ignore */
        }
      });

    let usernameTimer = null;
    els.username?.addEventListener("input", () => {
      clearTimeout(usernameTimer);
      usernameTimer = setTimeout(() => {
        api.setGroupUsername?.(els.username.value);
      }, 280);
    });

    document
      .getElementById("btn-group-create")
      ?.addEventListener("click", async () => {
        if (els.username?.value) await api.setGroupUsername?.(els.username.value);
        const snap = await api.createGroup?.();
        renderGroup(snap);
      });

    async function joinFromForm() {
      if (els.username?.value) await api.setGroupUsername?.(els.username.value);
      const snap = await api.joinGroup?.(els.joinCode?.value || "");
      renderGroup(snap);
    }

    document
      .getElementById("btn-group-join")
      ?.addEventListener("click", () => {
        joinFromForm().catch(() => {});
      });

    els.joinCode?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        joinFromForm().catch(() => {});
      }
    });

    document
      .getElementById("btn-group-leave")
      ?.addEventListener("click", async () => {
        const snap = await api.leaveGroup?.();
        renderGroup(snap);
      });

    document
      .getElementById("btn-group-save-config")
      ?.addEventListener("click", async () => {
        await api.setSettings?.({
          groupPusherKey: els.pusherKey?.value || "",
          groupPusherCluster: els.pusherCluster?.value || "",
          groupAuthUrl: els.authUrl?.value || "",
        });
        const snap = await api.getGroupStatus?.();
        renderGroup(snap);
      });

    api.onGroupStatus?.(renderGroup);
    api.getGroupStatus?.().then((s) => {
      renderGroup(s);
    });
    api.getSettings?.().then((s) => {
      if (els.pusherKey) els.pusherKey.value = s.groupPusherKey || "";
      if (els.pusherCluster) els.pusherCluster.value = s.groupPusherCluster || "";
      if (els.authUrl) els.authUrl.value = s.groupAuthUrl || "";
      if (els.joinCode && s.groupLastCode) els.joinCode.value = s.groupLastCode;
      if (els.username && s.groupUsername && !els.username.value) {
        els.username.value = s.groupUsername;
      }
    });
  }

  async function initContributorsPage() {
    const root = document.getElementById("contributors-root");
    const introEl = document.getElementById("contributors-intro");
    if (!root) return;

    try {
      const res = await fetch(`../data/contributors.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (introEl && data.intro) introEl.textContent = data.intro;

      const roles = Array.isArray(data.roles) ? data.roles : [];
      if (!roles.length) {
        root.innerHTML = `<p class="contributors-empty">No contributors listed yet.</p>`;
        return;
      }

      root.innerHTML = roles
        .map((role) => {
          const people = Array.isArray(role.people) ? role.people : [];
          const label = escapeHtml(role.label || "Contributors");
          const count = people.length;
          const cards = people.length
            ? `<div class="contributors-grid">${people.map(renderContributorCard).join("")}</div>`
            : `<p class="contributors-empty">No one listed in this group yet — be the first.</p>`;
          return `<section class="contributors-role">
            <div class="contributors-role-head">
              <h4>${label}</h4>
              <span class="contributors-role-count">${count}</span>
            </div>
            ${cards}
          </section>`;
        })
        .join("");
    } catch (err) {
      console.warn("[dashboard] contributors load failed", err);
      root.innerHTML = `<p class="contributors-empty">Could not load contributors.</p>`;
    }
  }

  /** @type {{ version: string, highlights: string[] }[]} */
  let changelogEntries = [];

  function formatChangelogDate(iso) {
    const raw = String(iso || "").trim();
    if (!raw) return "";
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderChangelogEntry(entry, installedVersion) {
    const ver = String(entry.version || "").replace(/^v/i, "");
    const installed = String(installedVersion || "").replace(/^v/i, "");
    const isCurrent = ver && installed && ver === installed;
    const title = escapeHtml(entry.title || "Update");
    const date = formatChangelogDate(entry.date);
    const highlights = Array.isArray(entry.highlights)
      ? entry.highlights.filter(Boolean)
      : [];
    const items = highlights.length
      ? `<ul class="changelog-list">${highlights
          .map((h) => `<li>${escapeHtml(h)}</li>`)
          .join("")}</ul>`
      : "";
    return `<article class="changelog-entry${isCurrent ? " is-current" : ""}">
      <header class="changelog-entry-head">
        <div class="changelog-entry-meta">
          <span class="changelog-version">v${escapeHtml(ver || "?")}</span>
          ${isCurrent ? `<span class="changelog-badge">Installed</span>` : ""}
        </div>
        ${date ? `<time class="changelog-date" datetime="${escapeHtml(String(entry.date))}">${escapeHtml(date)}</time>` : ""}
      </header>
      <h4 class="changelog-title">${title}</h4>
      ${items}
    </article>`;
  }

  function syncForceUpdateNotes(latestVersion) {
    const notesEl = document.getElementById("force-update-notes");
    if (!notesEl) return;
    const target = String(latestVersion || "").replace(/^v/i, "");
    const entry = changelogEntries.find(
      (e) => String(e.version || "").replace(/^v/i, "") === target
    );
    const highlights = Array.isArray(entry?.highlights)
      ? entry.highlights.filter(Boolean).slice(0, 3)
      : [];
    if (!highlights.length) {
      notesEl.hidden = true;
      notesEl.innerHTML = "";
      return;
    }
    notesEl.hidden = false;
    notesEl.innerHTML = highlights
      .map((h) => `<li>${escapeHtml(h)}</li>`)
      .join("");
  }

  async function initChangelogPage() {
    const root = document.getElementById("changelog-root");
    const introEl = document.getElementById("changelog-intro");
    if (!root) return;

    let installed = "";
    try {
      if (typeof api.getAppVersion === "function") {
        installed = String((await api.getAppVersion()) || "").replace(/^v/i, "");
      }
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch(`../data/changelog.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (introEl && data.intro) introEl.textContent = data.intro;

      const entries = Array.isArray(data.entries) ? data.entries : [];
      changelogEntries = entries.map((e) => ({
        version: String(e.version || ""),
        highlights: Array.isArray(e.highlights) ? e.highlights : [],
      }));

      if (!entries.length) {
        root.innerHTML = `<p class="changelog-empty">No changelog entries yet.</p>`;
        return;
      }

      root.innerHTML = entries
        .map((entry) => renderChangelogEntry(entry, installed))
        .join("");

      if (lastForceUpdateStatus?.latestVersion) {
        syncForceUpdateNotes(lastForceUpdateStatus.latestVersion);
      }
    } catch (err) {
      console.warn("[dashboard] changelog load failed", err);
      root.innerHTML = `<p class="changelog-empty">Could not load changelog.</p>`;
    }
  }

  let lastForceUpdateStatus = null;

  function showForceUpdateModal(show) {
    const modal = document.getElementById("force-update-modal");
    if (!modal) return;
    const open = Boolean(show);
    modal.classList.toggle("is-open", open);
    document.body.classList.toggle("force-update-active", open);
    if (open) {
      modal.removeAttribute("hidden");
      modal.setAttribute("aria-hidden", "false");
      showWelcomeModal(false);
      if (tourActive) endTour(true);
      requestAnimationFrame(() =>
        document.getElementById("force-update-action")?.focus()
      );
    } else {
      modal.setAttribute("hidden", "");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function syncForceUpdateModal(status) {
    lastForceUpdateStatus = status || null;
    const forced = Boolean(status?.forceUpdate);
    showForceUpdateModal(forced);
    if (!forced) return;

    const currentEl = document.getElementById("force-update-current");
    const latestEl = document.getElementById("force-update-latest");
    const statusEl = document.getElementById("force-update-status");
    const progressEl = document.getElementById("force-update-progress");
    const barEl = document.getElementById("force-update-progress-bar");
    const actionBtn = document.getElementById("force-update-action");

    if (currentEl) {
      const cur = String(status.version || "").replace(/^v/i, "").trim();
      currentEl.textContent = cur ? `v${cur}` : "—";
    }
    if (latestEl) {
      const lat = String(status.latestVersion || "").replace(/^v/i, "").trim();
      latestEl.textContent = lat ? `v${lat}` : "—";
    }
    syncForceUpdateNotes(status.latestVersion);

    const state = status.state || "idle";
    const packaged = status.packaged === true;
    const percent = Math.max(0, Math.min(100, status.percent || 0));
    let text = status.message || "";
    if (!text) {
      if (state === "checking") text = "Checking for updates…";
      else if (state === "available") {
        text = packaged
          ? "Downloading the update automatically…"
          : "A newer installer is available.";
      } else if (state === "downloading") {
        text = `Downloading update… ${Math.floor(percent)}%`;
      } else if (state === "ready") {
        text = "Update downloaded. Restart to install and unlock the map.";
      } else if (state === "error") {
        text =
          status.message ||
          "Download failed. Try again, or open the installer in your browser.";
      } else text = "A newer version is required to continue.";
    }
    if (statusEl) statusEl.textContent = text;

    const downloading = state === "downloading";
    if (progressEl) progressEl.hidden = !downloading;
    if (barEl) barEl.style.width = `${percent}%`;

    if (actionBtn) {
      if (state === "ready") {
        actionBtn.textContent = "Restart & install";
        actionBtn.disabled = false;
      } else if (downloading || state === "checking") {
        actionBtn.textContent = downloading ? "Downloading…" : "Checking…";
        actionBtn.disabled = true;
      } else if (state === "error") {
        actionBtn.textContent = packaged
          ? "Retry download"
          : "Download installer";
        actionBtn.disabled = false;
      } else if (!packaged) {
        actionBtn.textContent = "Download installer";
        actionBtn.disabled = false;
      } else {
        actionBtn.textContent = "Download & install";
        actionBtn.disabled = false;
      }
    }

    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.title = "Update required before showing the map";
    }
  }

  function applyUpdateStatus(status) {
    if (!status) return;
    const statusEl = document.getElementById("update-status");
    const progressEl = document.getElementById("update-progress");
    const barEl = document.getElementById("update-progress-bar");
    const btnCheck = document.getElementById("btn-check-update");
    const btnDownload = document.getElementById("btn-download-update");
    const btnInstall = document.getElementById("btn-install-update");
    const btnInstaller = document.getElementById("btn-open-installer");
    const btnOpen = document.getElementById("btn-open-release");

    const state = status.state || "idle";
    const packaged = status.packaged === true;
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
    if (btnInstaller) {
      btnInstaller.hidden = !(
        state === "available" ||
        state === "error" ||
        Boolean(status.installerUrl)
      );
    }
    if (btnOpen) {
      btnOpen.hidden = !(
        state === "available" ||
        state === "error" ||
        state === "current" ||
        Boolean(status.releaseUrl)
      );
    }
    if (btnCheck) btnCheck.disabled = state === "checking" || downloading;

    syncForceUpdateModal(status);
    if (!status.forceUpdate && toggleBtn) {
      toggleBtn.disabled = false;
      toggleBtn.title = "";
    }
  }

  async function runForceUpdateAction() {
    const status = lastForceUpdateStatus;
    if (!status) return;
    const state = status.state || "idle";
    if (state === "ready") {
      api.installUpdate?.();
      return;
    }
    if (!status.packaged) {
      const next = await api.openInstallerDownload?.();
      applyUpdateStatus(next || status);
      return;
    }
    if (state === "error" || state === "available" || state === "idle") {
      const next = await api.downloadUpdate?.();
      applyUpdateStatus(next || { ...status, state: "downloading" });
    }
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
    document.getElementById("btn-open-installer")?.addEventListener("click", async () => {
      const status = await api.openInstallerDownload?.();
      applyUpdateStatus(status);
    });
    document.getElementById("btn-open-release")?.addEventListener("click", () => {
      api.openReleasePage?.();
    });
    document
      .getElementById("force-update-action")
      ?.addEventListener("click", () => {
        runForceUpdateAction().catch(() => {});
      });
    document.getElementById("force-update-quit")?.addEventListener("click", () => {
      if (typeof api.quitApp === "function") api.quitApp();
      else window.close();
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
    await initLegendEditor();
    initGroupPage();
    await initContributorsPage();
    await initChangelogPage();
    await fillAppVersion();
    initUpdaterUi();
    if (!s.tutorialCompleted && !document.body.classList.contains("force-update-active")) {
      showWelcomeModal(true);
    }
  });
})();
