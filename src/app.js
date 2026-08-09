(() => {
  window.addEventListener("error", (event) => {
    console.error("[IsleMap]", event.message, event.filename, event.lineno);
  });

  if (typeof L === "undefined" || !window.IsleCoords || !window.isleOverlay) {
    console.error("[IsleMap] bootstrap failed");
    return;
  }

  const {
    worldToLatLng,
    mapBounds,
    formatWorld,
    setBasemap,
    basemapUrl,
  } = window.IsleCoords;

  // Copy Location is X,Y,Z only — no dino yaw. Facing is inferred from motion
  // between clipboard updates (same approach as community Isle overlays).
  const TRAIL_MIN_DIST_CM = 300; // ignore <3m jitter
  const HEADING_MIN_DIST_CM = 1500; // need ~15m baseline for a stable bearing

  const els = {
    shell: document.getElementById("shell"),
    map: document.getElementById("map"),
    chrome: document.getElementById("chrome"),
    status: document.getElementById("status-text"),
    coords: document.getElementById("coord-text"),
    toast: document.getElementById("toast"),
    edgePins: document.getElementById("edge-pins"),
    radarSweep: document.getElementById("radar-sweep"),
    radarRings: document.getElementById("radar-rings"),
    btnInteract: document.getElementById("btn-interact"),
    btnDashboard: document.getElementById("btn-dashboard"),
  };

  let lastPos = null;
  let playerMarker = null;
  let toastTimer = null;
  let settings = null;
  let playerHeading = null; // deg clockwise from screen-up
  let lastCoordTs = 0;
  const playerTrail = []; // [{ wx, wy, ts }]
  let placesData = null;
  /** @type {Array<{ place: any, category: string, ll: any, worldMarker: any, edgeEl: HTMLElement }>} */
  let placeRecords = [];
  /** @type {any} */
  let placeWorldLayer = null;
  let edgeUpdateQueued = false;
  /** @type {any} */
  let waypointMarker = null;
  /** @type {HTMLElement|null} */
  let waypointEdgeEl = null;
  /** @type {any} */
  let waypointLl = null;
  /** @type {any} */
  let navPathLine = null;

  function playerIconStyle() {
    const style = settings?.playerIconStyle || "dino";
    if (style === "custom" && settings?.playerIconCustomData) return "custom";
    if (style === "dot") return "dot";
    return "dino";
  }

  function playerIconHtml() {
    const style = playerIconStyle();
    const pulse = '<div class="player-pulse" aria-hidden="true"></div>';
    const heading =
      '<div class="player-heading"><div class="player-fov"></div></div>';
    if (style === "dot") {
      return pulse + heading + '<div class="player-dot"></div>';
    }
    if (style === "custom") {
      // data: URLs must not be HTML-escaped (& breaks base64)
      const src = String(settings.playerIconCustomData || "").replace(/"/g, "");
      return (
        pulse +
        heading +
        `<div class="player-custom" aria-hidden="true"><img class="player-custom-img" src="${src}" alt="" draggable="false" /></div>`
      );
    }
    // Side-view dino (faces right). Base -90° aligns snout with FOV / heading 0° (up).
    const dino =
      '<svg class="player-dino-svg" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M8 36c0-2.2 1.4-4 3.4-4.6l4.2-1.2 2.1-7.4C19.2 17.2 24.6 13 31 13c3.2 0 6.2 1 8.7 2.9l3.1 2.3 5.2-2.4c2.1-1 4.5-.2 5.6 1.8.9 1.7.5 3.8-1 4.9L48 25.2l3.6.8c2.8.6 4.8 3.1 4.8 6 0 2.4-1.5 4.5-3.7 5.3l-1.7.6.9 5.2c.5 2.7-1.6 5.1-4.3 5.1h-3.2l.6 6.3c.2 2.1-1.4 3.9-3.5 3.9h-4.1c-1.7 0-3.1-1.2-3.4-2.9L32.4 43h-4.2l-1.2 7.2c-.3 1.7-1.8 2.9-3.5 2.9h-4.4c-2.1 0-3.7-1.9-3.4-4l.9-6.4h-2.8c-3.1 0-5.6-2.5-5.6-5.6V36z"/>' +
      "</svg>";
    return (
      pulse +
      heading +
      `<div class="player-dino" aria-hidden="true">${dino}</div>`
    );
  }

  function buildPlayerIcon() {
    return L.divIcon({
      className: `player-marker style-${playerIconStyle()}`,
      html: playerIconHtml(),
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }

  function syncPlayerMarkerIcon() {
    if (!playerMarker) return;
    playerMarker.setIcon(buildPlayerIcon());
    requestAnimationFrame(applyHeadingToIcon);
  }

  const bounds = mapBounds();
  const map = L.map(els.map, {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 3,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    attributionControl: false,
    zoomControl: false,
    preferCanvas: true,
    // Don't clamp panning — maxBounds prevented centering near coasts
  });

  /** @type {any} */
  const defaultBasemap = window.IsleCoords.DEFAULT_BASEMAP || "gateway-official";
  let basemapOverlay = L.imageOverlay(
    basemapUrl(defaultBasemap, "overlay"),
    bounds
  ).addTo(map);
  let activeBasemapId = defaultBasemap;

  function applyBasemap(id) {
    const nextId = setBasemap(id || defaultBasemap).id;
    if (nextId === activeBasemapId && basemapOverlay) return;
    activeBasemapId = nextId;
    const nextBounds = mapBounds();
    const url = basemapUrl(nextId, "overlay");
    if (basemapOverlay) {
      map.removeLayer(basemapOverlay);
    }
    basemapOverlay = L.imageOverlay(url, nextBounds).addTo(map);
    basemapOverlay.bringToBack();
    if (placeWorldLayer) placeWorldLayer.bringToFront();
  }

  map.getContainer().style.background = "#05080d";
  map.fitBounds(bounds);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  placeWorldLayer = L.layerGroup().addTo(map);

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
  }

  function syncRadarSweep(s) {
    const on = Boolean(s?.showRadarSweep);
    const sec = Number(s?.radarSweepSeconds);
    const period = Number.isFinite(sec) ? Math.min(12, Math.max(2, sec)) : 4;
    document.documentElement.style.setProperty("--radar-sweep-seconds", `${period}s`);
    if (els.radarSweep) {
      if (on) els.radarSweep.removeAttribute("hidden");
      else els.radarSweep.setAttribute("hidden", "");
    }
    if (els.radarRings) {
      if (on) els.radarRings.removeAttribute("hidden");
      else els.radarRings.setAttribute("hidden", "");
    }
    document.body.classList.toggle("radar-sweep-on", on);
  }

  function applySettings(next) {
    settings = next;
    const root = document.documentElement;
    root.style.setProperty("--border-color", next.borderColor);
    root.style.setProperty("--border-width", `${next.borderWidth}px`);
    root.style.setProperty("--border-glow", `${next.borderGlow}px`);
    root.style.setProperty("--map-size", `${next.mapSize}px`);
    root.style.setProperty("--map-opacity", String(next.mapOpacity));
    root.style.setProperty("--overlay-opacity", String(next.overlayOpacity));
    root.style.setProperty("--pin", next.pinColor);
    root.style.setProperty("--fov", next.fovColor);
    root.style.setProperty("--waypoint", next.waypointColor || "#ff7a45");
    root.style.setProperty("--nav-path", next.navPathColor || "#ffb347");

    applyBasemap(next.basemap || defaultBasemap);
    els.shell.dataset.design = next.mapDesign;
    els.shell.dataset.border = next.borderStyle || "classic";
    els.shell.dataset.frameStack = next.frameMapOnTop ? "map-top" : "frame-top";
    root.style.setProperty(
      "--frame-scale",
      String(Number(next.frameScale) || 1.49)
    );
    root.style.setProperty(
      "--frame-hole-x",
      `${Number(next.frameHoleX) || 50}%`
    );
    root.style.setProperty(
      "--frame-hole-y",
      `${Number(next.frameHoleY) || 47.36}%`
    );
    root.style.setProperty(
      "--frame-offset-x",
      `${Number(next.frameOffsetX) || 0}px`
    );
    root.style.setProperty(
      "--frame-offset-y",
      `${Number(next.frameOffsetY) || 0}px`
    );
    root.style.setProperty(
      "--frame-map-scale",
      String(Number(next.frameMapScale) || 1)
    );
    root.style.setProperty(
      "--frame-pad",
      String(Number(next.framePad) || 0.26)
    );
    document.body.classList.toggle("hide-fov", !next.showFov);
    document.body.classList.toggle(
      "hide-compass",
      next.showCompass === false ||
      next.borderStyle === "isle-evrima" ||
      next.borderStyle === "primal-pinas"
    );

    if (next.showChrome) els.chrome.removeAttribute("hidden");
    else els.chrome.setAttribute("hidden", "");

    syncRadarSweep(next);

    map.invalidateSize({ animate: false });
    syncPlayerMarkerIcon();
    applyHeadingToIcon();
    syncPlaceLayers();
    syncWaypoint();
    syncNavPath();

    // Keep player centered after size/zoom setting changes
    if (lastPos?.ll && next.followPlayer !== false) {
      centerOnPlayer(lastPos.ll, false);
    } else if (Number.isFinite(next.zoom) && !lastPos) {
      map.setZoom(next.zoom, { animate: false });
    }
  }

  function navDistanceMeters() {
    if (!lastPos || !settings?.waypointEnabled) return null;
    const dx = Number(settings.waypointX) - lastPos.x;
    const dy = Number(settings.waypointY) - lastPos.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    return Math.hypot(dx, dy) / 100; // Unreal cm → meters
  }

  function formatNavDistance(meters) {
    if (meters == null || !Number.isFinite(meters)) return "";
    if (meters >= 1000) {
      const km = meters / 1000;
      return `${km >= 10 ? km.toFixed(1) : km.toFixed(2)} km`;
    }
    return `${Math.max(0, Math.round(meters))} m`;
  }

  function syncNavPath() {
    const show =
      settings?.navPath !== false &&
      settings?.waypointEnabled &&
      waypointLl &&
      lastPos?.ll;

    if (!show) {
      if (navPathLine) {
        map.removeLayer(navPathLine);
        navPathLine = null;
      }
      return;
    }

    const color = settings.navPathColor || settings.waypointColor || "#ffb347";
    const latlngs = [lastPos.ll, waypointLl];
    if (!navPathLine) {
      navPathLine = L.polyline(latlngs, {
        color,
        weight: 3,
        opacity: 0.92,
        dashArray: "7 10",
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
        className: "nav-path-line",
      }).addTo(map);
      if (navPathLine.bringToFront) navPathLine.bringToFront();
    } else {
      navPathLine.setLatLngs(latlngs);
      navPathLine.setStyle({ color });
    }
  }

  function followZoom() {
    const preferred = Number.isFinite(settings?.zoom) ? settings.zoom : 1;
    return preferred;
  }

  function centerOnPlayer(ll, animate = true) {
    if (!ll) return;
    map.invalidateSize({ animate: false });
    map.setView(ll, followZoom(), {
      animate,
      duration: 0.35,
      easeLinearity: 0.25,
    });
  }

  function normalizePlaceCat(key) {
    if (key === "waters" || key === "water") return "water";
    if (key === "landmarks" || key === "landmark") return "landmark";
    if (key === "wallows" || key === "wallow") return "wallow";
    if (key === "sanctuaries" || key === "sanctuary") return "sanctuary";
    return "area";
  }

  function categoryGlyph(cat) {
    if (cat === "water") {
      return '<svg class="place-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5C8 1.5 2.5 7.2 2.5 10.2a5.5 5.5 0 0 0 11 0C13.5 7.2 8 1.5 8 1.5z"/></svg>';
    }
    if (cat === "landmark") {
      return '<svg class="place-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 9.7 5.4l4.5.4-3.4 2.9 1 4.4L8 11.2l-3.8 2 1-4.4L1.8 5.8l4.5-.4z"/></svg>';
    }
    if (cat === "wallow") {
      return '<svg class="place-glyph" viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="8" cy="9" rx="6" ry="3.5"/><ellipse cx="8" cy="7.5" rx="4.5" ry="2.2" opacity=".55"/></svg>';
    }
    if (cat === "sanctuary") {
      return '<svg class="place-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 13.5 4.2v4.6c0 3.2-2.2 5.4-5.5 6.5C4.7 14.2 2.5 12 2.5 8.8V4.2L8 1.2z"/></svg>';
    }
    // area
    return '<svg class="place-glyph" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14.5 13.5H1.5L8 1.5z"/></svg>';
  }

  function placeIcon(place, style, categoryKey) {
    const cat = normalizePlaceCat(categoryKey || place.category);
    const showIcon = style === "icon" || style === "icon-label";
    const showLabel = style === "label" || style === "icon-label";
    const iconHtml = showIcon
      ? `<span class="place-icon">${categoryGlyph(cat)}</span>`
      : "";
    const labelHtml = showLabel
      ? `<span class="place-label">${escapeHtml(place.name)}</span>`
      : "";
    const modeClass = `place-style-${style}`;
    return L.divIcon({
      className: `place-marker place-${cat} ${modeClass}`,
      html: `${iconHtml}${labelHtml}`,
      iconSize: showLabel ? [130, 22] : [16, 16],
      iconAnchor: showLabel ? (showIcon ? [8, 11] : [0, 11]) : [8, 8],
    });
  }

  function placeMarkersVisible() {
    const style = settings?.placeStyle || "icon-label";
    return style !== "none";
  }

  function createEdgePinEl(place, categoryKey) {
    const cat = normalizePlaceCat(categoryKey || place.category);
    const el = document.createElement("div");
    el.className = `edge-pin place-${cat}`;
    el.innerHTML =
      `<span class="edge-chevron" aria-hidden="true"></span>` +
      `<span class="place-icon">${categoryGlyph(cat)}</span>`;
    el.title = place.name || "";
    els.edgePins.appendChild(el);
    return el;
  }

  function setEdgePin(el, x, y, angleDeg) {
    // Chevron defaults pointing up; rotate so it aims outward.
    const rot = angleDeg + 90;
    const icon = el.querySelector(".place-icon");
    el.style.transform =
      `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg)`;
    if (icon) icon.style.transform = `rotate(${-rot}deg)`;
    el.classList.add("is-on");
  }

  function hideEdgePin(el) {
    if (el) el.classList.remove("is-on");
  }

  function waypointIconHtml(label, distText) {
    const showPin = settings?.showWaypointPin !== false;
    const showLabel = settings?.showWaypointLabel !== false;
    if (!showPin && !showLabel) return `<div class="waypoint-pin is-empty"></div>`;

    const flag = showPin
      ? `<span class="waypoint-flag" aria-hidden="true"></span>`
      : "";
    let meta = "";
    if (showLabel) {
      const text = escapeHtml(label || "Go");
      const dist = distText
        ? `<span class="waypoint-dist">${escapeHtml(distText)}</span>`
        : "";
      meta =
        `<span class="waypoint-meta">` +
        `<span class="waypoint-label">${text}</span>` +
        dist +
        `</span>`;
    }
    return `<div class="waypoint-pin">${flag}${meta}</div>`;
  }

  function ensureWaypointEdgeEl() {
    if (waypointEdgeEl || !els.edgePins) return waypointEdgeEl;
    const el = document.createElement("div");
    el.className = "edge-pin edge-waypoint";
    el.innerHTML =
      `<span class="edge-chevron" aria-hidden="true"></span>` +
      `<span class="place-icon waypoint-edge-icon" aria-hidden="true"></span>` +
      `<span class="edge-dist" hidden></span>`;
    els.edgePins.appendChild(el);
    waypointEdgeEl = el;
    return el;
  }

  function syncWaypointEdgeDistance(distText) {
    const el = ensureWaypointEdgeEl();
    if (!el) return;
    const badge = el.querySelector(".edge-dist");
    if (!badge) return;
    if (distText) {
      badge.textContent = distText;
      badge.removeAttribute("hidden");
    } else {
      badge.textContent = "";
      badge.setAttribute("hidden", "");
    }
  }

  function syncWaypoint() {
    const on =
      settings?.waypointEnabled &&
      Number.isFinite(Number(settings.waypointX)) &&
      Number.isFinite(Number(settings.waypointY));

    if (!on) {
      if (waypointMarker) {
        map.removeLayer(waypointMarker);
        waypointMarker = null;
      }
      waypointLl = null;
      hideEdgePin(waypointEdgeEl);
      syncWaypointEdgeDistance("");
      syncNavPath();
      return;
    }

    const wx = Number(settings.waypointX);
    const wy = Number(settings.waypointY);
    waypointLl = worldToLatLng(L, wx, wy);
    const label = settings.waypointLabel || "Go here";
    const distMeters = navDistanceMeters();
    const distText =
      settings?.showWaypointLabel !== false && distMeters != null
        ? formatNavDistance(distMeters)
        : "";
    const showPin = settings?.showWaypointPin !== false;
    const showLabel = settings?.showWaypointLabel !== false;
    const showWorldMarker = showPin || showLabel;

    if (!showWorldMarker) {
      if (waypointMarker) {
        map.removeLayer(waypointMarker);
        waypointMarker = null;
      }
    } else {
      const icon = L.divIcon({
        className: "waypoint-marker",
        html: waypointIconHtml(label, distText),
        iconSize: showLabel && distText ? [88, 36] : showLabel ? [72, 28] : [18, 18],
        iconAnchor: showLabel && distText ? [10, 32] : showLabel ? [10, 24] : [7, 14],
      });

      if (!waypointMarker) {
        waypointMarker = L.marker(waypointLl, {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 800,
        }).addTo(map);
      } else {
        waypointMarker.setLatLng(waypointLl);
        waypointMarker.setIcon(icon);
      }
    }

    ensureWaypointEdgeEl();
    if (waypointEdgeEl) {
      waypointEdgeEl.title =
        distText && showLabel ? `${label} · ${distText}` : label;
      waypointEdgeEl.classList.toggle("hide-edge-icon", !showPin);
      waypointEdgeEl.classList.toggle("hide-edge-dist", !showLabel);
    }
    syncWaypointEdgeDistance(showLabel ? distText : "");
    syncNavPath();
    queueEdgeUpdate();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function categoryEnabled(key) {
    if (!settings) return true;
    const filter = settings.placeFilter || "all";
    if (filter !== "all") return filter === key;
    if (key === "areas") return settings.showAreas !== false;
    if (key === "waters") return settings.showWaters !== false;
    if (key === "landmarks") return settings.showLandmarks !== false;
    if (key === "wallows") return settings.showWallows !== false;
    if (key === "sanctuaries") return settings.showSanctuaries !== false;
    return true;
  }

  /** Rim stick checklist — only checked types clamp to the circle */
  function categoryEdgeEnabled(key) {
    if (!settings || settings.edgePins === false) return false;
    if (key === "waters") return settings.edgeWaters !== false;
    if (key === "areas") return Boolean(settings.edgeAreas);
    if (key === "landmarks") return Boolean(settings.edgeLandmarks);
    if (key === "wallows") return settings.edgeWallows !== false;
    if (key === "sanctuaries") return settings.edgeSanctuaries !== false;
    return false;
  }

  /** When enabled, only places within placeNearbyRadiusKm of the player pin are shown */
  function placeWithinNearbyRange(place) {
    if (!settings?.placeNearbyOnly) return true;
    if (!lastPos) return false;
    let km = Number(settings.placeNearbyRadiusKm);
    if (!Number.isFinite(km)) km = 2;
    km = Math.min(10, Math.max(0.5, km));
    const dx = place.x - lastPos.x;
    const dy = place.y - lastPos.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
    return Math.hypot(dx, dy) / 100 <= km * 1000;
  }

  /** Hide POI markers sitting under the player pin (e.g. Dam white circle under dino) */
  function placeOverlapsPlayer(place) {
    if (!lastPos) return false;
    const dx = place.x - lastPos.x;
    const dy = place.y - lastPos.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
    return Math.hypot(dx, dy) / 100 < 40; // meters
  }

  function rebuildPlaceLayers() {
    if (!placeWorldLayer || !els.edgePins) return;
    placeWorldLayer.clearLayers();
    // Keep destination rim pin; only clear place edge icons
    for (const child of [...els.edgePins.children]) {
      if (!child.classList.contains("edge-waypoint")) child.remove();
    }
    placeRecords = [];
    if (!placesData?.categories || !placeMarkersVisible()) {
      queueEdgeUpdate();
      return;
    }
    const style = settings?.placeStyle || "icon-label";

    for (const [key, list] of Object.entries(placesData.categories)) {
      if (!categoryEnabled(key) || !Array.isArray(list)) continue;
      for (const place of list) {
        const ll = worldToLatLng(L, place.x, place.y);
        const worldMarker = L.marker(ll, {
          icon: placeIcon(place, style, key),
          interactive: false,
          keyboard: false,
          zIndexOffset: key === "landmarks" ? 200 : 100,
        }).addTo(placeWorldLayer);

        placeRecords.push({
          place,
          category: key,
          ll,
          worldMarker,
          edgeEl: createEdgePinEl(place, key),
        });
      }
    }
    queueEdgeUpdate();
  }

  function syncPlaceLayers() {
    if (!settings) return;
    rebuildPlaceLayers();
  }

  function queueEdgeUpdate() {
    if (edgeUpdateQueued) return;
    edgeUpdateQueued = true;
    requestAnimationFrame(() => {
      edgeUpdateQueued = false;
      updateEdgePins();
    });
  }

  function updateEdgePins() {
    const size = map.getSize();
    if (!size.x || !size.y) return;

    // Radar is a circle inscribed in the square map container
    const cx = size.x / 2;
    const cy = size.y / 2;
    // Sit on the cyan ring (account for border width)
    const border = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--border-width")
    ) || 3;
    const R = Math.min(cx, cy) - border * 0.5 - 2;
    const inside = R - 18; // hide map icon once it nears the rim
    const rimMasterOn = settings && settings.edgePins !== false;

    for (const rec of placeRecords) {
      if (!placeWithinNearbyRange(rec.place) || placeOverlapsPlayer(rec.place)) {
        rec.worldMarker.setOpacity(0);
        hideEdgePin(rec.edgeEl);
        continue;
      }

      const pt = map.latLngToContainerPoint(rec.ll);
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.hypot(dx, dy);
      const canStick = rimMasterOn && categoryEdgeEnabled(rec.category);

      if (dist <= inside || dist < 0.5) {
        rec.worldMarker.setOpacity(1);
        hideEdgePin(rec.edgeEl);
        continue;
      }

      // Off-screen: only checklist categories stick to the rim
      rec.worldMarker.setOpacity(0);
      if (!canStick) {
        hideEdgePin(rec.edgeEl);
        continue;
      }

      const k = R / dist;
      const x = cx + dx * k;
      const y = cy + dy * k;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      setEdgePin(rec.edgeEl, x, y, angleDeg);
    }

    // Destination always sticks to the rim when off-screen
    if (waypointLl && waypointMarker && settings?.waypointEnabled) {
      const edgeEl = ensureWaypointEdgeEl();
      const pt = map.latLngToContainerPoint(waypointLl);
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= inside || dist < 0.5) {
        waypointMarker.setOpacity(1);
        hideEdgePin(edgeEl);
      } else {
        waypointMarker.setOpacity(0);
        const k = R / dist;
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        setEdgePin(edgeEl, cx + dx * k, cy + dy * k, angleDeg);
      }
    } else {
      hideEdgePin(waypointEdgeEl);
    }
  }

  async function loadPlaces() {
    try {
      if (typeof window.isleOverlay.getPlaces === "function") {
        const res = await window.isleOverlay.getPlaces();
        if (res?.ok && res.doc) {
          placesData = res.doc;
          syncPlaceLayers();
          return;
        }
      }
      const res = await fetch(`./data/gateway-areas.json?t=${Date.now()}`);
      placesData = await res.json();
      syncPlaceLayers();
    } catch (err) {
      console.error("[IsleMap] failed to load areas JSON", err);
    }
  }

  function setModeBadge(playMode) {
    document.body.classList.toggle("is-interactive", !playMode);
    if (els.btnInteract) {
      els.btnInteract.textContent = playMode ? "Map (F9)" : "Play (F9)";
    }
  }

  function appendTrailPoint(wx, wy, ts) {
    const last = playerTrail[playerTrail.length - 1];
    if (last) {
      const dx = wx - last.wx;
      const dy = wy - last.wy;
      if (dx * dx + dy * dy < TRAIL_MIN_DIST_CM * TRAIL_MIN_DIST_CM) {
        return false;
      }
    }
    playerTrail.push({ wx, wy, ts });
    while (playerTrail.length > 80) playerTrail.shift();
    return true;
  }

  function updateHeadingFromTrail() {
    if (playerTrail.length < 2) return false;
    const tail = playerTrail[playerTrail.length - 1];
    for (let i = playerTrail.length - 2; i >= 0; i--) {
      const p = playerTrail[i];
      const dx = tail.wx - p.wx;
      const dy = tail.wy - p.wy;
      if (dx * dx + dy * dy < HEADING_MIN_DIST_CM * HEADING_MIN_DIST_CM) {
        continue;
      }
      // Screen-space bearing: CRS.Simple lat grows up, so atan2(Δlng, Δlat)
      // is clockwise from screen-up — matches CSS rotate().
      const a = worldToLatLng(L, p.wx, p.wy);
      const b = worldToLatLng(L, tail.wx, tail.wy);
      playerHeading =
        (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
      return true;
    }
    return false;
  }

  function applyHeadingToIcon() {
    if (!playerMarker) return;
    const el = playerMarker.getElement();
    if (!el) return;
    const cone = el.querySelector(".player-heading");
    const dino = el.querySelector(".player-dino");
    const custom = el.querySelector(".player-custom");
    const face = dino || custom;
    // Dino art faces right; custom icons should face up in the image file
    const baseRot = dino ? -90 : 0;

    if (playerHeading == null) {
      cone?.classList.remove("is-live", "is-stale");
      if (cone) cone.style.transform = "";
      if (face) {
        face.style.transform = `translate(-50%, -50%) rotate(${baseRot}deg)`;
        face.classList.remove("is-stale");
      }
      return;
    }

    const age = Date.now() - lastCoordTs;
    if (cone) {
      if (settings?.showFov === false) {
        cone.classList.remove("is-live", "is-stale");
      } else {
        cone.classList.toggle("is-live", age < 8000);
        cone.classList.toggle("is-stale", age >= 8000);
      }
      cone.style.transform = `rotate(${playerHeading}deg)`;
    }
    if (face) {
      face.style.transform = `translate(-50%, -50%) rotate(${
        playerHeading + baseRot
      }deg)`;
      face.classList.toggle("is-stale", age >= 8000);
    }
  }

  const peerMarkers = new Map();

  function peerIcon(peer) {
    const color = peer.color || "#ff7ab8";
    const name = peer.username || "Hunter";
    return L.divIcon({
      className: "peer-marker",
      html:
        `<div class="peer-dot" style="--peer:${color}"></div>` +
        `<div class="peer-label" style="--peer:${color}">${String(name)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  function syncPeerMarkers(status) {
    const peers = Array.isArray(status?.peers) ? status.peers : [];
    const seen = new Set();
    for (const peer of peers) {
      if (!peer?.pcId || !Number.isFinite(peer.x) || !Number.isFinite(peer.y)) {
        continue;
      }
      seen.add(peer.pcId);
      const ll = worldToLatLng(L, peer.x, peer.y);
      let marker = peerMarkers.get(peer.pcId);
      if (!marker) {
        marker = L.marker(ll, {
          icon: peerIcon(peer),
          zIndexOffset: 800,
          interactive: false,
        }).addTo(map);
        peerMarkers.set(peer.pcId, marker);
      } else {
        marker.setLatLng(ll);
        marker.setIcon(peerIcon(peer));
      }
    }
    for (const [id, marker] of peerMarkers) {
      if (!seen.has(id)) {
        map.removeLayer(marker);
        peerMarkers.delete(id);
      }
    }
  }

  function updatePin(x, y, z) {
    const ll = worldToLatLng(L, x, y);
    const ts = Date.now();
    const moved = appendTrailPoint(x, y, ts);
    const hadHeading = playerHeading != null;
    if (moved) updateHeadingFromTrail();
    lastCoordTs = ts;
    lastPos = { x, y, z, ll };

    if (!playerMarker) {
      playerMarker = L.marker(ll, {
        icon: buildPlayerIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      playerMarker.setLatLng(ll);
    }

    // Leaflet may recreate the icon DOM after move — apply on next frame
    requestAnimationFrame(applyHeadingToIcon);

    if (settings?.followPlayer !== false) {
      centerOnPlayer(ll, true);
    } else if (!map.getBounds().contains(ll)) {
      centerOnPlayer(ll, true);
    }
    syncNavPath();
    syncWaypoint();
    queueEdgeUpdate();
    if (els.coords) els.coords.textContent = formatWorld(x, y, z);

    const dist = navDistanceMeters();
    const distTxt = dist != null ? ` · ${formatNavDistance(dist)} left` : "";

    if (playerHeading == null) {
      if (els.status) {
        els.status.textContent =
          "Move & Copy Location again for facing" + distTxt;
      }
      if (!hadHeading) {
        showToast(
          dist != null
            ? `Pin set · ${formatNavDistance(dist)} to destination`
            : "Pin set — copy again while moving for arrow"
        );
      }
    } else {
      if (els.status) {
        els.status.textContent =
          `Facing ~${Math.round(
            ((playerHeading % 360) + 360) % 360
          )}° (from movement)` + distTxt;
      }
      showToast(
        dist != null
          ? `Updated · ${formatNavDistance(dist)} to destination`
          : "Pin + facing updated"
      );
    }
  }

  function recenter() {
    if (!lastPos) {
      showToast("No location yet — Copy Location in-game");
      return;
    }
    centerOnPlayer(lastPos.ll, true);
    showToast("Centered on you");
  }

  // Dim the cone over time while standing still
  setInterval(() => {
    if (playerHeading != null) applyHeadingToIcon();
  }, 2000);

  if (els.status) els.status.textContent = "Waiting for Copy Location…";

  window.isleOverlay.onLocation((coords) => updatePin(coords.x, coords.y, coords.z));
  window.isleOverlay.onClickThrough(setModeBadge);
  window.isleOverlay.onRecenter(recenter);
  window.isleOverlay.onToast(showToast);
  window.isleOverlay.onSettings(applySettings);
  if (typeof window.isleOverlay.onPlacesUpdated === "function") {
    window.isleOverlay.onPlacesUpdated(() => {
      loadPlaces();
    });
  }
  if (typeof window.isleOverlay.onGroupStatus === "function") {
    window.isleOverlay.onGroupStatus(syncPeerMarkers);
    window.isleOverlay.getGroupStatus?.().then(syncPeerMarkers).catch(() => {});
  }

  els.btnInteract?.addEventListener("click", async () => {
    const current = await window.isleOverlay.getClickThrough();
    await window.isleOverlay.setClickThrough(!current);
  });

  els.btnDashboard?.addEventListener("click", () => {
    window.isleOverlay.openDashboard();
  });

  window.isleOverlay.getClickThrough().then(setModeBadge);
  window.isleOverlay.getSettings().then((s) => {
    applySettings(s);
    loadPlaces();
  });

  map.on("move zoom moveend zoomend viewreset", queueEdgeUpdate);

  const ro = new ResizeObserver(() => {
    map.invalidateSize({ animate: false });
    queueEdgeUpdate();
  });
  ro.observe(els.map);
})();
