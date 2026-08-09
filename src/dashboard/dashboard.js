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
    borderEffect: document.getElementById("borderEffect"),
    borderEffectCount: document.getElementById("borderEffectCount"),
    borderEffectSpeed: document.getElementById("borderEffectSpeed"),
    borderEffectIntensity: document.getElementById("borderEffectIntensity"),
    borderEffectSize: document.getElementById("borderEffectSize"),
    borderEffectDistance: document.getElementById("borderEffectDistance"),
    borderEffectDinoSpecies: document.getElementById("borderEffectDinoSpecies"),
    borderEffectOrientation: document.getElementById("borderEffectOrientation"),
    borderEffectColor: document.getElementById("borderEffectColor"),
    borderEffectRandomGradient: document.getElementById(
      "borderEffectRandomGradient"
    ),
    borderEffectBeatSensitivity: document.getElementById(
      "borderEffectBeatSensitivity"
    ),
    borderEffectBeatPunch: document.getElementById("borderEffectBeatPunch"),
    borderEffectBeatSmooth: document.getElementById("borderEffectBeatSmooth"),
    borderEffectBeatBass: document.getElementById("borderEffectBeatBass"),
    borderEffectBeatMotion: document.getElementById("borderEffectBeatMotion"),
    borderEffectBeatRings: document.getElementById("borderEffectBeatRings"),
    borderEffectBeatLegendGradient: document.getElementById(
      "borderEffectBeatLegendGradient"
    ),
    borderEffectRandomSpawn: document.getElementById("borderEffectRandomSpawn"),
    borderEffectSound: document.getElementById("borderEffectSound"),
    borderEffectSoundVolume: document.getElementById("borderEffectSoundVolume"),
    borderColor: document.getElementById("borderColor"),
    pinColor: document.getElementById("pinColor"),
    playerIconStyle: document.getElementById("playerIconStyle"),
    playerIconDinoSpecies: document.getElementById("playerIconDinoSpecies"),
    playerIcon3dSize: document.getElementById("playerIcon3dSize"),
    playerIcon3dSpeed: document.getElementById("playerIcon3dSpeed"),
    playerIcon3dGlow: document.getElementById("playerIcon3dGlow"),
    playerIcon3dAnimate: document.getElementById("playerIcon3dAnimate"),
    playerIcon3dOrientation: document.getElementById("playerIcon3dOrientation"),
    playerIconFollowHeading: document.getElementById("playerIconFollowHeading"),
    fovColor: document.getElementById("fovColor"),
    fovStyle: document.getElementById("fovStyle"),
    fovAngle: document.getElementById("fovAngle"),
    fovLength: document.getElementById("fovLength"),
    fovIntensity: document.getElementById("fovIntensity"),
    fovPulse: document.getElementById("fovPulse"),
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
    radarSweepStyle: document.getElementById("radarSweepStyle"),
    radarSweepDirection: document.getElementById("radarSweepDirection"),
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
    screenshotNotify: document.getElementById("screenshotNotify"),
    screenshotCopyClipboard: document.getElementById("screenshotCopyClipboard"),
    recordingDesktopAudio: document.getElementById("recordingDesktopAudio"),
  };

  const labels = {
    borderWidthVal: document.getElementById("borderWidthVal"),
    borderGlowVal: document.getElementById("borderGlowVal"),
    borderEffectCountVal: document.getElementById("borderEffectCountVal"),
    borderEffectSpeedVal: document.getElementById("borderEffectSpeedVal"),
    borderEffectIntensityVal: document.getElementById("borderEffectIntensityVal"),
    borderEffectSizeVal: document.getElementById("borderEffectSizeVal"),
    borderEffectDistanceVal: document.getElementById("borderEffectDistanceVal"),
    borderEffectSoundVolumeVal: document.getElementById(
      "borderEffectSoundVolumeVal"
    ),
    borderEffectBeatSensitivityVal: document.getElementById(
      "borderEffectBeatSensitivityVal"
    ),
    borderEffectBeatPunchVal: document.getElementById(
      "borderEffectBeatPunchVal"
    ),
    borderEffectBeatSmoothVal: document.getElementById(
      "borderEffectBeatSmoothVal"
    ),
    borderEffectBeatBassVal: document.getElementById("borderEffectBeatBassVal"),
    borderEffectBeatMotionVal: document.getElementById(
      "borderEffectBeatMotionVal"
    ),
    borderEffectBeatRingsVal: document.getElementById(
      "borderEffectBeatRingsVal"
    ),
    playerIcon3dSizeVal: document.getElementById("playerIcon3dSizeVal"),
    playerIcon3dSpeedVal: document.getElementById("playerIcon3dSpeedVal"),
    playerIcon3dGlowVal: document.getElementById("playerIcon3dGlowVal"),
    fovAngleVal: document.getElementById("fovAngleVal"),
    fovLengthVal: document.getElementById("fovLengthVal"),
    fovIntensityVal: document.getElementById("fovIntensityVal"),
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
      sub: "Style, border, effects, sweep, frame, HUD, places, opacity, layout, and preview.",
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
    "all-players": {
      title: "All players",
      sub: "Developer only (unpackaged) — live map of online IsleMap clients.",
    },
    game: {
      title: "Game & hotkeys",
      sub: "EAC-safe usage, bindings, and system notes.",
    },
    screenshots: {
      title: "Screenshots",
      sub: "Capture map or screen stills, then review saves in-app.",
    },
    recording: {
      title: "Recording",
      sub: "Screen capture controls and recorded media library.",
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
    {
      key: "hotkeyClearWaypoint",
      label: "Clear waypoint",
      hint: "Remove the destination pin",
    },
    {
      key: "hotkeyScreenshot",
      label: "Screenshot map",
      hint: "Save map overlay to Pictures/Screenshots/IsleMap",
    },
    {
      key: "hotkeyScreenshotScreen",
      label: "Screenshot screen",
      hint: "Save full monitor to Pictures/Screenshots/IsleMap",
    },
    {
      key: "hotkeyRecordToggle",
      label: "Record: start / stop",
      hint: "Toggle screen recording on or off",
    },
    {
      key: "hotkeyRecordPauseToggle",
      label: "Record: pause / play",
      hint: "Toggle pause while recording",
    },
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
    hotkeyClearWaypoint: "-",
    hotkeyScreenshot: "=",
    hotkeyScreenshotScreen: "F10",
    hotkeyRecordToggle: "F1",
    hotkeyRecordPauseToggle: "F2",
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

  /** @type {any} */
  let allPlayersMap = null;
  /** @type {any} */
  let allPlayersBasemapOverlay = null;
  /** @type {string} */
  let allPlayersBasemapId = "";
  /** @type {Map<string, any>} */
  const allPlayerMarkers = new Map();
  /** @type {Map<string, any>} */
  const allPlayerData = new Map();
  let allPlayersAgeTimer = null;
  let allPlayersReady = false;
  /** @type {any} */
  let lastGlobalPlayersStatus = { players: [], count: 0 };

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
    const wrap = document.getElementById("radar-sweep-settings");
    wrap?.classList.toggle("is-disabled", !on);
    document.getElementById("field-radar-sweep-speed")?.classList.toggle("is-dimmed", !on);
    document.getElementById("field-radar-sweep-style")?.classList.toggle("is-dimmed", !on);
    document.getElementById("field-radar-sweep-direction")?.classList.toggle("is-dimmed", !on);
    if (fields.radarSweepSeconds) fields.radarSweepSeconds.disabled = !on;
    if (fields.radarSweepStyle) fields.radarSweepStyle.disabled = !on;
    if (fields.radarSweepDirection) fields.radarSweepDirection.disabled = !on;
  }

  function syncPlayerIconCustomRow() {
    const style = fields.playerIconStyle?.value || "dino";
    const is3d = style === "dino3d";
    const row = document.getElementById("player-icon-custom-row");
    if (row) {
      if (style === "custom") row.removeAttribute("hidden");
      else row.setAttribute("hidden", "");
    }
    const settings3d = document.getElementById("player-icon-3d-settings");
    if (settings3d) {
      if (is3d) {
        settings3d.hidden = false;
        settings3d.removeAttribute("hidden");
      } else {
        settings3d.hidden = true;
        settings3d.setAttribute("hidden", "");
      }
    }
    if (fields.playerIconDinoSpecies) {
      fields.playerIconDinoSpecies.disabled = !is3d;
    }
    if (fields.playerIcon3dSize) fields.playerIcon3dSize.disabled = !is3d;
    if (fields.playerIcon3dSpeed) fields.playerIcon3dSpeed.disabled = !is3d;
    if (fields.playerIcon3dGlow) fields.playerIcon3dGlow.disabled = !is3d;
    if (fields.playerIcon3dAnimate) fields.playerIcon3dAnimate.disabled = !is3d;
    if (fields.playerIcon3dOrientation) {
      fields.playerIcon3dOrientation.disabled = !is3d;
    }
    if (fields.playerIconFollowHeading) {
      fields.playerIconFollowHeading.disabled = !is3d;
    }
    const topFollow = document.getElementById("top-pin-follow");
    const topFollowInput = document.getElementById("playerIconFollowHeadingTop");
    if (topFollow) {
      if (is3d) topFollow.removeAttribute("hidden");
      else topFollow.setAttribute("hidden", "");
    }
    if (topFollowInput) topFollowInput.disabled = !is3d;
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
    if (labels.borderEffectCountVal) {
      labels.borderEffectCountVal.textContent = String(
        Math.round(s.borderEffectCount ?? 8)
      );
    }
    if (labels.borderEffectSpeedVal) {
      labels.borderEffectSpeedVal.textContent = `${Number(
        s.borderEffectSpeed ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.borderEffectIntensityVal) {
      labels.borderEffectIntensityVal.textContent = `${Math.round(
        (s.borderEffectIntensity ?? 1) * 100
      )}%`;
    }
    if (labels.borderEffectSizeVal) {
      labels.borderEffectSizeVal.textContent = `${Number(
        s.borderEffectSize ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.borderEffectDistanceVal) {
      const d = Math.round(Number(s.borderEffectDistance ?? 5));
      labels.borderEffectDistanceVal.textContent =
        d === 0 ? "On rim" : d > 0 ? `Outside ${d}` : `Inside ${-d}`;
    }
    if (labels.playerIcon3dSizeVal) {
      labels.playerIcon3dSizeVal.textContent = `${Number(
        s.playerIcon3dSize ?? 4
      ).toFixed(2)}×`;
    }
    if (labels.playerIcon3dSpeedVal) {
      labels.playerIcon3dSpeedVal.textContent = `${Number(
        s.playerIcon3dSpeed ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.playerIcon3dGlowVal) {
      labels.playerIcon3dGlowVal.textContent = `${Math.round(
        (s.playerIcon3dGlow ?? 0.7) * 100
      )}%`;
    }
    if (labels.fovAngleVal) {
      labels.fovAngleVal.textContent = `${Math.round(s.fovAngle ?? 60)}°`;
    }
    if (labels.fovLengthVal) {
      labels.fovLengthVal.textContent = `${Number(s.fovLength ?? 1.15).toFixed(
        2
      )}×`;
    }
    if (labels.fovIntensityVal) {
      labels.fovIntensityVal.textContent = `${Math.round(
        (s.fovIntensity ?? 0.65) * 100
      )}%`;
    }
    if (labels.borderEffectSoundVolumeVal) {
      labels.borderEffectSoundVolumeVal.textContent = `${Math.round(
        (s.borderEffectSoundVolume ?? 0.3) * 100
      )}%`;
    }
    if (labels.borderEffectBeatSensitivityVal) {
      labels.borderEffectBeatSensitivityVal.textContent = `${Number(
        s.borderEffectBeatSensitivity ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.borderEffectBeatPunchVal) {
      labels.borderEffectBeatPunchVal.textContent = `${Number(
        s.borderEffectBeatPunch ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.borderEffectBeatSmoothVal) {
      labels.borderEffectBeatSmoothVal.textContent = `${Math.round(
        (s.borderEffectBeatSmooth ?? 0.45) * 100
      )}%`;
    }
    if (labels.borderEffectBeatBassVal) {
      labels.borderEffectBeatBassVal.textContent = `${Math.round(
        (s.borderEffectBeatBass ?? 0.7) * 100
      )}%`;
    }
    if (labels.borderEffectBeatMotionVal) {
      labels.borderEffectBeatMotionVal.textContent = `${Number(
        s.borderEffectBeatMotion ?? 1
      ).toFixed(2)}×`;
    }
    if (labels.borderEffectBeatRingsVal) {
      labels.borderEffectBeatRingsVal.textContent = String(
        Math.round(s.borderEffectBeatRings ?? 5)
      );
    }
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
      buildDestGrid();
      void loadDestPlaces();
      syncDestMarker();
      destMap.fitBounds(bounds, { padding: [8, 8], animate: false });
    }

    if (legendMap) {
      if (legendBasemapOverlay) legendMap.removeLayer(legendBasemapOverlay);
      legendBasemapOverlay = L.imageOverlay(url, bounds).addTo(legendMap);
      legendBasemapOverlay.bringToBack();
      legendBasemapId = next.id;
      legendMap.setMaxBounds(bounds);
      // Re-place legend markers in the active pixel space
      if (typeof rebuildLegendMapMarkers === "function") {
        rebuildLegendMapMarkers();
      }
      legendMap.fitBounds(bounds, { padding: [8, 8], animate: false });
    }

    if (allPlayersMap) {
      if (allPlayersBasemapOverlay) {
        allPlayersMap.removeLayer(allPlayersBasemapOverlay);
      }
      allPlayersBasemapOverlay = L.imageOverlay(url, bounds).addTo(allPlayersMap);
      allPlayersBasemapOverlay.bringToBack();
      allPlayersBasemapId = next.id;
      allPlayersMap.setMaxBounds(bounds);
      allPlayersMap.fitBounds(bounds, { padding: [8, 8], animate: false });
      if (typeof syncAllPlayerMarkers === "function" && lastGlobalPlayersStatus) {
        syncAllPlayerMarkers(lastGlobalPlayersStatus);
      }
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
    {
      const angle = Math.max(24, Math.min(120, Number(s.fovAngle ?? 60)));
      const length = Math.max(0.6, Math.min(2.2, Number(s.fovLength ?? 1.15)));
      const intensity = Math.max(
        0.15,
        Math.min(1, Number(s.fovIntensity ?? 0.65))
      );
      const style = ["classic", "los", "beam", "soft"].includes(s.fovStyle)
        ? s.fovStyle
        : "los";
      const half = angle / 2;
      root.style.setProperty("--fov-angle", `${angle}deg`);
      root.style.setProperty("--fov-half", `${half}deg`);
      root.style.setProperty("--fov-from", `${-half}deg`);
      root.style.setProperty("--fov-mid", `${half}deg`);
      root.style.setProperty("--fov-length", String(length));
      root.style.setProperty("--fov-intensity", String(intensity));
      preview.dataset.fov = style;
      preview.classList.toggle("fov-pulse", s.fovPulse !== false);
      const pfov = document.querySelector("#preview-player .p-fov");
      if (pfov) pfov.dataset.fov = style;
    }
    applyFrameCssVars(s);
    preview.dataset.design = s.mapDesign;
    const defaultBasemap = window.IsleCoords?.DEFAULT_BASEMAP || "gateway-official";
    preview.dataset.basemap = s.basemap || defaultBasemap;
    preview.dataset.border = s.borderStyle || "classic";
    preview.dataset.borderEffect = s.borderEffect || "none";
    preview.dataset.frameStack = s.frameMapOnTop ? "map-top" : "frame-top";
    preview.classList.toggle(
      "beat-legend-gradient",
      s.borderEffect === "beat" && Boolean(s.borderEffectBeatLegendGradient)
    );
    if (typeof window.IsleBorderFx?.apply === "function") {
      window.IsleBorderFx.apply(
        document.getElementById("preview-border-fx"),
        window.IsleBorderFx.fromSettings(s)
      );
    }
    if (typeof window.IsleBorderFxBeat?.sync === "function") {
      window.IsleBorderFxBeat.sync(
        document.getElementById("preview-border-fx"),
        window.IsleBorderFxBeat.fromSettings(s)
      );
    }
    if (typeof window.IsleBorderFxAudio?.sync === "function") {
      window.IsleBorderFxAudio.sync(
        window.IsleBorderFxAudio.fromSettings(s, {
          duck: document.hasFocus() ? 0.45 : 0,
        })
      );
    }
    syncBorderEffectFields(s.borderEffect || "beat");
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
    const sweepStyle = s.radarSweepStyle || "classic";
    const sweepDir = s.radarSweepDirection === "cw" ? "cw" : "ccw";
    root.style.setProperty("--radar-sweep-seconds", `${sweepSec}s`);
    const previewSweep = document.getElementById("preview-sweep");
    const previewRings = document.getElementById("preview-rings");
    if (previewSweep) {
      previewSweep.dataset.sweep = sweepStyle;
      previewSweep.dataset.dir = sweepDir;
      if (sweepOn) previewSweep.removeAttribute("hidden");
      else previewSweep.setAttribute("hidden", "");
    }
    if (previewRings) {
      previewRings.dataset.sweep = sweepStyle;
      previewRings.dataset.dir = sweepDir;
      if (sweepOn) previewRings.removeAttribute("hidden");
      else previewRings.setAttribute("hidden", "");
    }
    preview.classList.toggle("radar-sweep-on", sweepOn);
    preview.dataset.sweep = sweepStyle;
    preview.dataset.dir = sweepDir;
    syncPreviewPlayerIcon(s);
    syncBorderStyleFields(s.borderStyle || "classic");
    syncRadarSweepState();
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
    const prev3d = mark.querySelector(".player-dino3d");
    if (prev3d) window.IslePlayerIcon3d?.unmount?.(prev3d);

    if (style === "dot") {
      mark.className = "p-mark p-dot";
      mark.style.transform = "";
      mark.innerHTML = "";
    } else if (style === "custom" && s.playerIconCustomData) {
      mark.className = "p-mark p-dino p-custom";
      mark.style.transform = "translate(-50%, -50%) rotate(0deg)";
      mark.innerHTML = `<img class="p-dino-svg" src="${String(
        s.playerIconCustomData
      ).replace(/"/g, "")}" alt="" draggable="false" />`;
    } else if (style === "dino3d") {
      const species =
        window.IslePlayerIcon3d?.resolveSpecies?.(s.playerIconDinoSpecies) ||
        s.playerIconDinoSpecies ||
        "triceratops";
      let orient = s.playerIcon3dOrientation || "top";
      if (orient === "auto") {
        orient =
          species === "pteranodon"
            ? "fly"
            : species === "deinosuchus"
              ? "side"
              : "top";
      }
      const topFace = orient === "top" || orient === "topRev";
      mark.className = "p-mark p-dino3d";
      mark.style.transform = topFace
        ? "translate(-50%, -50%) rotate(0deg)"
        : "translate(-50%, -50%) rotate(-90deg)";
      mark.innerHTML = `<div class="player-dino3d" data-species="${String(
        species
      ).replace(/"/g, "")}"><canvas class="player-dino3d-canvas"></canvas></div>`;
      const wrap = mark.querySelector(".player-dino3d");
      window.IslePlayerIcon3d?.mount?.(wrap, {
        species,
        color: s.pinColor || "#5ef0ff",
        size: s.playerIcon3dSize ?? 4,
        speed: s.playerIcon3dSpeed ?? 1,
        glow: s.playerIcon3dGlow ?? 0.7,
        animate: s.playerIcon3dAnimate !== false,
        orientation: s.playerIcon3dOrientation || "top",
      });
    } else {
      mark.className = "p-mark p-dino";
      mark.style.transform = "translate(-50%, -50%) rotate(-90deg)";
      mark.innerHTML =
        '<svg class="p-dino-svg" viewBox="0 0 64 64"><path d="M8 36c0-2.2 1.4-4 3.4-4.6l4.2-1.2 2.1-7.4C19.2 17.2 24.6 13 31 13c3.2 0 6.2 1 8.7 2.9l3.1 2.3 5.2-2.4c2.1-1 4.5-.2 5.6 1.8.9 1.7.5 3.8-1 4.9L48 25.2l3.6.8c2.8.6 4.8 3.1 4.8 6 0 2.4-1.5 4.5-3.7 5.3l-1.7.6.9 5.2c.5 2.7-1.6 5.1-4.3 5.1h-3.2l.6 6.3c.2 2.1-1.4 3.9-3.5 3.9h-4.1c-1.7 0-3.1-1.2-3.4-2.9L32.4 43h-4.2l-1.2 7.2c-.3 1.7-1.8 2.9-3.5 2.9h-4.4c-2.1 0-3.7-1.9-3.4-4l.9-6.4h-2.8c-3.1 0-5.6-2.5-5.6-5.6V36z"/></svg>';
    }
  }

  function isPhotoFrameBorder(style) {
    return style === "isle-evrima" || style === "primal-pinas";
  }

  function syncBorderEffectFields(effect) {
    const wrap = document.getElementById("border-effect-settings");
    const on = Boolean(effect && effect !== "none");
    const is3d = effect === "dragon" || effect === "dinosaur";
    const isDino3d = effect === "dinosaur";
    const isBeat = effect === "beat";
    const randomGrad = Boolean(fields.borderEffectRandomGradient?.checked);
    if (wrap) {
      if (on) {
        wrap.hidden = false;
        wrap.removeAttribute("hidden");
      } else {
        wrap.hidden = true;
        wrap.setAttribute("hidden", "");
      }
    }
    const block3d = document.getElementById("fx-block-3d");
    if (block3d) {
      if (is3d) {
        block3d.hidden = false;
        block3d.removeAttribute("hidden");
      } else {
        block3d.hidden = true;
        block3d.setAttribute("hidden", "");
      }
    }
    const blockBeat = document.getElementById("fx-block-beat");
    if (blockBeat) {
      if (isBeat) {
        blockBeat.hidden = false;
        blockBeat.removeAttribute("hidden");
      } else {
        blockBeat.hidden = true;
        blockBeat.setAttribute("hidden", "");
      }
    }
    // Spawn count / random spawn matter less for audio beat
    document.querySelectorAll(
      "#borderEffectCount, #borderEffectRandomSpawn"
    ).forEach((el) => {
      el.disabled = !on || isBeat;
    });
    document
      .getElementById("borderEffectCount")
      ?.closest(".field")
      ?.classList.toggle("is-dimmed", !on || isBeat);
    document
      .querySelector("#border-effect-settings .fx-check")
      ?.classList.toggle("is-dimmed", !on || isBeat);
    const speciesField = document.getElementById("field-border-effect-dino-species");
    if (speciesField) {
      if (isDino3d) {
        speciesField.hidden = false;
        speciesField.removeAttribute("hidden");
      } else {
        speciesField.hidden = true;
        speciesField.setAttribute("hidden", "");
      }
    }
    document
      .getElementById("field-border-effect-color")
      ?.classList.toggle("is-dimmed", !on || randomGrad);
    document
      .getElementById("field-border-effect-random-gradient")
      ?.classList.toggle("is-dimmed", !on);
    if (fields.borderEffectColor) {
      fields.borderEffectColor.disabled = !on || randomGrad;
    }
    if (fields.borderEffectRandomGradient) {
      fields.borderEffectRandomGradient.disabled = !on;
    }
    if (fields.borderEffectRandomSpawn) {
      fields.borderEffectRandomSpawn.disabled = !on || isBeat;
    }
    [
      fields.borderEffectBeatSensitivity,
      fields.borderEffectBeatPunch,
      fields.borderEffectBeatSmooth,
      fields.borderEffectBeatBass,
      fields.borderEffectBeatMotion,
      fields.borderEffectBeatRings,
      fields.borderEffectBeatLegendGradient,
    ].forEach((el) => {
      if (el) el.disabled = !on || !isBeat;
    });
    document
      .getElementById("field-border-effect-beat-legend-grad")
      ?.classList.toggle("is-dimmed", !on || !isBeat);
    if (fields.borderEffectDistance) {
      fields.borderEffectDistance.disabled = !is3d;
    }
    if (fields.borderEffectDinoSpecies) {
      fields.borderEffectDinoSpecies.disabled = !isDino3d;
    }
    if (fields.borderEffectOrientation) {
      fields.borderEffectOrientation.disabled = !is3d;
    }
    if (fields.borderEffectSound) fields.borderEffectSound.disabled = !on;
    const soundOn = on && fields.borderEffectSound?.checked !== false;
    document
      .getElementById("field-border-effect-sound-vol")
      ?.classList.toggle("is-dimmed", !soundOn);
    if (fields.borderEffectSoundVolume) {
      fields.borderEffectSoundVolume.disabled = !soundOn;
    }
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
    if (fields.borderEffect) {
      fields.borderEffect.value = s.borderEffect || "beat";
    }
    if (fields.borderEffectCount) {
      fields.borderEffectCount.value = s.borderEffectCount ?? 8;
    }
    if (fields.borderEffectSpeed) {
      fields.borderEffectSpeed.value = s.borderEffectSpeed ?? 1;
    }
    if (fields.borderEffectIntensity) {
      fields.borderEffectIntensity.value = s.borderEffectIntensity ?? 1;
    }
    if (fields.borderEffectSize) {
      fields.borderEffectSize.value = s.borderEffectSize ?? 1;
    }
    if (fields.borderEffectDistance) {
      fields.borderEffectDistance.value = s.borderEffectDistance ?? 5;
    }
    if (fields.borderEffectDinoSpecies) {
      fields.borderEffectDinoSpecies.value =
        s.borderEffectDinoSpecies || "triceratops";
    }
    if (fields.borderEffectOrientation) {
      fields.borderEffectOrientation.value =
        s.borderEffectOrientation || "auto";
    }
    if (fields.borderEffectColor) {
      fields.borderEffectColor.value = toHexColor(
        s.borderEffectColor || s.borderColor || "#5ec8ff"
      );
    }
    if (fields.borderEffectRandomGradient) {
      fields.borderEffectRandomGradient.checked = Boolean(
        s.borderEffectRandomGradient
      );
    }
    if (fields.borderEffectRandomSpawn) {
      fields.borderEffectRandomSpawn.checked = s.borderEffectRandomSpawn !== false;
    }
    if (fields.borderEffectSound) {
      fields.borderEffectSound.checked = s.borderEffectSound !== false;
    }
    if (fields.borderEffectSoundVolume) {
      fields.borderEffectSoundVolume.value = s.borderEffectSoundVolume ?? 0.3;
    }
    if (fields.borderEffectBeatSensitivity) {
      fields.borderEffectBeatSensitivity.value =
        s.borderEffectBeatSensitivity ?? 1;
    }
    if (fields.borderEffectBeatPunch) {
      fields.borderEffectBeatPunch.value = s.borderEffectBeatPunch ?? 1;
    }
    if (fields.borderEffectBeatSmooth) {
      fields.borderEffectBeatSmooth.value = s.borderEffectBeatSmooth ?? 0.45;
    }
    if (fields.borderEffectBeatBass) {
      fields.borderEffectBeatBass.value = s.borderEffectBeatBass ?? 0.7;
    }
    if (fields.borderEffectBeatMotion) {
      fields.borderEffectBeatMotion.value = s.borderEffectBeatMotion ?? 1;
    }
    if (fields.borderEffectBeatRings) {
      fields.borderEffectBeatRings.value = s.borderEffectBeatRings ?? 5;
    }
    if (fields.borderEffectBeatLegendGradient) {
      fields.borderEffectBeatLegendGradient.checked = Boolean(
        s.borderEffectBeatLegendGradient
      );
    }
    syncBorderEffectFields(s.borderEffect || "beat");
    fields.borderColor.value = toHexColor(s.borderColor);
    fields.pinColor.value = toHexColor(s.pinColor);
    if (fields.playerIconStyle) {
      fields.playerIconStyle.value = s.playerIconStyle || "dino";
    }
    if (fields.playerIconDinoSpecies) {
      fields.playerIconDinoSpecies.value =
        s.playerIconDinoSpecies || "triceratops";
    }
    if (fields.playerIcon3dSize) {
      fields.playerIcon3dSize.value = s.playerIcon3dSize ?? 4;
    }
    if (fields.playerIcon3dSpeed) {
      fields.playerIcon3dSpeed.value = s.playerIcon3dSpeed ?? 1;
    }
    if (fields.playerIcon3dGlow) {
      fields.playerIcon3dGlow.value = s.playerIcon3dGlow ?? 0.7;
    }
    if (fields.playerIcon3dAnimate) {
      fields.playerIcon3dAnimate.checked = s.playerIcon3dAnimate !== false;
    }
    if (fields.playerIcon3dOrientation) {
      fields.playerIcon3dOrientation.value =
        s.playerIcon3dOrientation || "top";
    }
    if (fields.playerIconFollowHeading) {
      fields.playerIconFollowHeading.checked =
        s.playerIconFollowHeading !== false;
    }
    const topFollowInput = document.getElementById("playerIconFollowHeadingTop");
    if (topFollowInput) {
      topFollowInput.checked = s.playerIconFollowHeading !== false;
    }
    playerIconCustomData = s.playerIconCustomData || "";
    playerIconCustomName = s.playerIconCustomName || "";
    syncPlayerIconCustomRow();
    fields.fovColor.value = toHexColor(s.fovColor);
    if (fields.fovStyle) fields.fovStyle.value = s.fovStyle || "los";
    if (fields.fovAngle) fields.fovAngle.value = s.fovAngle ?? 60;
    if (fields.fovLength) fields.fovLength.value = s.fovLength ?? 1.15;
    if (fields.fovIntensity) fields.fovIntensity.value = s.fovIntensity ?? 0.65;
    if (fields.fovPulse) fields.fovPulse.checked = s.fovPulse !== false;
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
    if (fields.radarSweepStyle) {
      fields.radarSweepStyle.value = s.radarSweepStyle || "classic";
    }
    if (fields.radarSweepDirection) {
      fields.radarSweepDirection.value =
        s.radarSweepDirection === "cw" ? "cw" : "ccw";
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
    if (fields.screenshotNotify) {
      fields.screenshotNotify.checked = s.screenshotNotify !== false;
    }
    if (fields.screenshotCopyClipboard) {
      fields.screenshotCopyClipboard.checked =
        s.screenshotCopyClipboard !== false;
    }
    if (fields.recordingDesktopAudio) {
      fields.recordingDesktopAudio.checked = s.recordingDesktopAudio !== false;
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
      borderEffect: fields.borderEffect?.value || "beat",
      borderEffectCount: Number(fields.borderEffectCount?.value ?? 8),
      borderEffectSpeed: Number(fields.borderEffectSpeed?.value ?? 1),
      borderEffectIntensity: Number(fields.borderEffectIntensity?.value ?? 1),
      borderEffectSize: Number(fields.borderEffectSize?.value ?? 1),
      borderEffectDistance: Number(fields.borderEffectDistance?.value ?? 5),
      borderEffectDinoSpecies:
        fields.borderEffectDinoSpecies?.value || "triceratops",
      borderEffectOrientation:
        fields.borderEffectOrientation?.value || "auto",
      borderEffectColor: fields.borderEffectColor?.value || "#5ec8ff",
      borderEffectRandomGradient: Boolean(
        fields.borderEffectRandomGradient?.checked
      ),
      borderEffectRandomSpawn: fields.borderEffectRandomSpawn?.checked !== false,
      borderEffectSound: fields.borderEffectSound?.checked !== false,
      borderEffectSoundVolume: Number(
        fields.borderEffectSoundVolume?.value ?? 0.3
      ),
      borderEffectBeatSensitivity: Number(
        fields.borderEffectBeatSensitivity?.value ?? 1
      ),
      borderEffectBeatPunch: Number(fields.borderEffectBeatPunch?.value ?? 1),
      borderEffectBeatSmooth: Number(
        fields.borderEffectBeatSmooth?.value ?? 0.45
      ),
      borderEffectBeatBass: Number(fields.borderEffectBeatBass?.value ?? 0.7),
      borderEffectBeatMotion: Number(
        fields.borderEffectBeatMotion?.value ?? 1
      ),
      borderEffectBeatRings: Number(fields.borderEffectBeatRings?.value ?? 5),
      borderEffectBeatLegendGradient: Boolean(
        fields.borderEffectBeatLegendGradient?.checked
      ),
      borderColor: fields.borderColor.value,
      pinColor: fields.pinColor.value,
      playerIconStyle: fields.playerIconStyle?.value || "dino",
      playerIconDinoSpecies:
        fields.playerIconDinoSpecies?.value || "triceratops",
      playerIcon3dSize: Number(fields.playerIcon3dSize?.value ?? 1),
      playerIcon3dSpeed: Number(fields.playerIcon3dSpeed?.value ?? 1),
      playerIcon3dGlow: Number(fields.playerIcon3dGlow?.value ?? 0.7),
      playerIcon3dAnimate: fields.playerIcon3dAnimate?.checked !== false,
      playerIcon3dOrientation:
        fields.playerIcon3dOrientation?.value || "top",
      playerIconFollowHeading:
        fields.playerIconFollowHeading?.checked !== false,
      playerIconCustomData,
      playerIconCustomName,
      fovColor: fields.fovColor.value,
      fovStyle: fields.fovStyle?.value || "los",
      fovAngle: Number(fields.fovAngle?.value ?? 60),
      fovLength: Number(fields.fovLength?.value ?? 1.15),
      fovIntensity: Number(fields.fovIntensity?.value ?? 0.65),
      fovPulse: fields.fovPulse?.checked !== false,
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
      radarSweepStyle: fields.radarSweepStyle?.value || "classic",
      radarSweepDirection:
        fields.radarSweepDirection?.value === "cw" ? "cw" : "ccw",
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
      screenshotNotify: fields.screenshotNotify?.checked !== false,
      screenshotCopyClipboard:
        fields.screenshotCopyClipboard?.checked !== false,
      recordingDesktopAudio: fields.recordingDesktopAudio?.checked !== false,
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
    syncScreenshotHotkeyHints();
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
  fields.borderEffectSound?.addEventListener("change", () => {
    syncBorderEffectFields(fields.borderEffect?.value || "beat");
    window.IsleBorderFxAudio?.unlock?.();
  });
  fields.borderEffectRandomGradient?.addEventListener("change", () => {
    syncBorderEffectFields(fields.borderEffect?.value || "beat");
  });
  fields.borderEffectBeatLegendGradient?.addEventListener("change", () => {
    syncBorderEffectFields(fields.borderEffect?.value || "beat");
  });
  fields.borderEffect?.addEventListener("change", () => {
    syncBorderEffectFields(fields.borderEffect?.value || "beat");
  });
  window.addEventListener("focus", () => {
    try {
      const s = readForm();
      window.IsleBorderFxAudio?.sync?.(
        window.IsleBorderFxAudio.fromSettings(s, { duck: 0.45 })
      );
    } catch (_) {}
  });
  window.addEventListener("blur", () => {
    window.IsleBorderFxAudio?.sync?.({
      effect: "none",
      enabled: false,
      volume: 0,
    });
  });
  document.addEventListener(
    "pointerdown",
    () => window.IsleBorderFxAudio?.unlock?.(),
    { once: true }
  );
  fields.playerIconStyle?.addEventListener("change", () => {
    syncPlayerIconCustomRow();
  });

  function syncFollowHeadingMirrors(fromTop) {
    const main = fields.playerIconFollowHeading;
    const top = document.getElementById("playerIconFollowHeadingTop");
    if (!main || !top) return;
    if (fromTop) main.checked = top.checked;
    else top.checked = main.checked;
  }

  fields.playerIconFollowHeading?.addEventListener("change", () => {
    syncFollowHeadingMirrors(false);
  });
  document
    .getElementById("playerIconFollowHeadingTop")
    ?.addEventListener("change", () => {
      syncFollowHeadingMirrors(true);
      schedulePersist();
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

  function syncScreenshotHotkeyHints() {
    const pairs = [
      ["hotkeyScreenshot", "ss-hk-map-btn"],
      ["hotkeyScreenshotScreen", "ss-hk-screen-btn"],
      ["hotkeyRecordToggle", "ss-hk-rec-toggle-btn"],
      ["hotkeyRecordPauseToggle", "ss-hk-rec-pause-btn"],
    ];
    for (const [key, id] of pairs) {
      const btn = document.getElementById(id);
      if (!btn || btn.classList.contains("is-recording")) continue;
      btn.textContent = formatAccel(hotkeyValues[key] || HOTKEY_DEFAULTS[key]);
    }
    const toggleLabel = document.getElementById("ss-hk-rec-toggle-label");
    const pauseLabel = document.getElementById("ss-hk-rec-pause-label");
    if (toggleLabel) {
      toggleLabel.textContent = formatAccel(
        hotkeyValues.hotkeyRecordToggle || HOTKEY_DEFAULTS.hotkeyRecordToggle
      );
    }
    if (pauseLabel) {
      pauseLabel.textContent = formatAccel(
        hotkeyValues.hotkeyRecordPauseToggle ||
          HOTKEY_DEFAULTS.hotkeyRecordPauseToggle
      );
    }
  }

  let ssFilter = "all";
  let ssBusy = false;
  let ssPreviewName = null;

  async function refreshScreenshotFolderPath() {
    const el = document.getElementById("ss-folder-path");
    if (!el || typeof api.getScreenshotsDir !== "function") return;
    try {
      const dir = await api.getScreenshotsDir();
      if (dir) el.textContent = dir;
    } catch {
      // keep default label
    }
  }

  function formatSsBytes(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${(v / 1024).toFixed(0)} KB`;
    return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function refreshScreenshotLibrary() {
    const grid = document.getElementById("ss-grid");
    const empty = document.getElementById("ss-empty");
    if (!grid || typeof api.listScreenshots !== "function") return;
    let items = [];
    try {
      items = await api.listScreenshots(ssFilter);
    } catch {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    grid.replaceChildren();
    if (empty) empty.hidden = items.length > 0;

    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ss-card";
      btn.dataset.name = item.name;
      btn.title = item.name;

      const thumb = document.createElement("div");
      thumb.className = "ss-card-thumb";
      if (item.thumbDataUrl) {
        thumb.style.backgroundImage = `url("${item.thumbDataUrl}")`;
      }

      const meta = document.createElement("div");
      meta.className = "ss-card-meta";
      meta.innerHTML =
        `<span class="ss-card-kind">${item.kind === "screen" ? "Screen" : "Map"}</span>` +
        `<span class="ss-card-name">${item.name}</span>` +
        `<span class="ss-card-name">${formatSsBytes(item.size)}</span>`;

      btn.append(thumb, meta);
      btn.addEventListener("click", () => {
        void openScreenshotPreview(item.name);
      });
      grid.appendChild(btn);
    }
  }

  function closeScreenshotPreview() {
    ssPreviewName = null;
    const box = document.getElementById("ss-lightbox");
    const img = document.getElementById("ss-lightbox-img");
    if (box) {
      box.hidden = true;
      box.setAttribute("aria-hidden", "true");
    }
    if (img) img.removeAttribute("src");
  }

  async function openScreenshotPreview(name) {
    if (!name || typeof api.readScreenshot !== "function") return;
    const res = await api.readScreenshot(name);
    if (!res?.ok || !res.dataUrl) return;
    ssPreviewName = name;
    const box = document.getElementById("ss-lightbox");
    const img = document.getElementById("ss-lightbox-img");
    const title = document.getElementById("ss-lightbox-title");
    const kind = document.getElementById("ss-lightbox-kind");
    if (title) title.textContent = name;
    if (kind) kind.textContent = res.kind === "screen" ? "Screen" : "Map";
    if (img) img.src = res.dataUrl;
    if (box) {
      box.hidden = false;
      box.setAttribute("aria-hidden", "false");
    }
  }

  async function captureScreenshotFromUi(kind) {
    if (ssBusy || typeof api.takeScreenshot !== "function") return;
    ssBusy = true;
    try {
      await api.takeScreenshot(kind);
      await refreshScreenshotLibrary();
    } finally {
      ssBusy = false;
    }
  }

  function initScreenshotsPanel() {
    document.querySelectorAll(".ss-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        ssFilter = btn.dataset.ssFilter || "all";
        document.querySelectorAll(".ss-filter").forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.classList.toggle("btn-secondary", on);
          b.classList.toggle("btn-ghost", !on);
        });
        void refreshScreenshotLibrary();
      });
    });

    document
      .getElementById("btn-ss-capture-map")
      ?.addEventListener("click", () => void captureScreenshotFromUi("map"));
    document
      .getElementById("btn-ss-capture-screen")
      ?.addEventListener("click", () => void captureScreenshotFromUi("screen"));
    document
      .getElementById("btn-ss-open-folder")
      ?.addEventListener("click", () => {
        api.openScreenshotsFolder?.().catch(() => {});
      });
    document
      .getElementById("btn-ss-refresh")
      ?.addEventListener("click", () => void refreshScreenshotLibrary());

    document.querySelectorAll("#ss-hotkey-list .hotkey-capture").forEach((btn) => {
      btn.addEventListener("click", () =>
        startHotkeyCapture(btn.dataset.key, btn)
      );
    });

    document.querySelectorAll("[data-ss-close]").forEach((el) => {
      el.addEventListener("click", () => closeScreenshotPreview());
    });

    document.getElementById("ss-lightbox-reveal")?.addEventListener("click", () => {
      if (ssPreviewName) api.revealScreenshot?.(ssPreviewName);
    });

    document.getElementById("ss-lightbox-delete")?.addEventListener("click", async () => {
      if (!ssPreviewName || typeof api.deleteScreenshot !== "function") return;
      const name = ssPreviewName;
      const res = await api.deleteScreenshot(name);
      if (res?.ok) {
        closeScreenshotPreview();
        await refreshScreenshotLibrary();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeScreenshotPreview();
    });

    if (typeof api.onScreenshotsUpdated === "function") {
      api.onScreenshotsUpdated(() => {
        const active = document.querySelector(
          '.panel[data-panel="screenshots"].is-active'
        );
        if (active) void refreshScreenshotLibrary();
      });
    }

    syncScreenshotHotkeyHints();
    void refreshScreenshotFolderPath();
  }

  let recMediaSelected = null;
  let ytWired = false;

  function renderRecordingDebug(debug) {
    const log = document.getElementById("rec-debug-log");
    const tip = document.getElementById("rec-debug-tip");
    if (!log) return;
    if (!debug) {
      log.textContent = "No recording debug yet.";
      return;
    }
    try {
      log.textContent = JSON.stringify(debug, null, 2);
    } catch {
      log.textContent = String(debug);
    }
    if (tip) {
      tip.textContent =
        debug.tip ||
        (debug.ok === false
          ? "Issue detected — see JSON below for sniff/probe details."
          : "Latest recording diagnostics.");
    }
  }

  function formatYtTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function setYtError(msg) {
    const err = document.getElementById("yt-error");
    if (!err) return;
    if (msg) {
      err.hidden = false;
      err.textContent = msg;
    } else {
      err.hidden = true;
      err.textContent = "";
    }
  }

  function syncYtPlayUi() {
    const video = document.getElementById("rec-media-video");
    const player = document.getElementById("yt-player");
    const big = document.getElementById("yt-big-play");
    const playBtn = document.getElementById("yt-play");
    const playIco = document.querySelector("#yt-play .yt-ico-play");
    const pauseIco = document.querySelector("#yt-play .yt-ico-pause");
    const playing = Boolean(video && !video.paused && !video.ended);

    if (player) player.classList.toggle("is-playing", playing);
    if (big) {
      big.hidden = playing;
      big.setAttribute("aria-hidden", playing ? "true" : "false");
    }
    if (playBtn) {
      playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
      playBtn.title = playing ? "Pause" : "Play";
    }
    if (playIco) playIco.hidden = playing;
    if (pauseIco) pauseIco.hidden = !playing;
  }

  function syncYtProgress() {
    const video = document.getElementById("rec-media-video");
    const seek = document.getElementById("yt-seek");
    const time = document.getElementById("yt-time");
    if (!video) return;
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    const cur = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    if (seek && dur > 0 && seek.dataset.dragging !== "1") {
      seek.value = String(Math.round((cur / dur) * 1000));
    }
    if (time) time.textContent = `${formatYtTime(cur)} / ${formatYtTime(dur)}`;
  }

  function toggleYtPlay() {
    const video = document.getElementById("rec-media-video");
    if (!video || !video.src) return;
    if (video.paused || video.ended) {
      void video.play().then(syncYtPlayUi).catch(() => {
        syncYtPlayUi();
      });
    } else {
      video.pause();
      syncYtPlayUi();
    }
  }

  let ytImmersive = false;
  /** @type {{ parent: Element, next: ChildNode | null } | null} */
  let ytPlayerHome = null;

  function isYtFullscreenActive() {
    const root = document.getElementById("yt-player");
    if (!root) return false;
    return Boolean(ytImmersive || root.classList.contains("is-immersive"));
  }

  function syncYtFullscreenUi() {
    const root = document.getElementById("yt-player");
    const btn = document.getElementById("yt-fs");
    const enterIco = document.querySelector("#yt-fs .yt-ico-fs-enter");
    const exitIco = document.querySelector("#yt-fs .yt-ico-fs-exit");
    const active = isYtFullscreenActive();
    if (root) {
      root.classList.toggle("is-fullscreen", active);
      root.classList.toggle("is-immersive", ytImmersive);
    }
    document.documentElement.classList.toggle("rec-player-immersive", ytImmersive);
    document.body.classList.toggle("rec-player-immersive", ytImmersive);
    if (btn) {
      btn.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
      btn.title = active ? "Exit fullscreen" : "Fullscreen";
    }
    if (enterIco) {
      enterIco.hidden = active;
      enterIco.style.display = active ? "none" : "";
    }
    if (exitIco) {
      exitIco.hidden = !active;
      exitIco.style.display = active ? "" : "none";
    }
  }

  async function enterYtImmersive() {
    const root = document.getElementById("yt-player");
    if (!root || ytImmersive) {
      syncYtFullscreenUi();
      return;
    }

    if (!ytPlayerHome) {
      ytPlayerHome = {
        parent: root.parentElement,
        next: root.nextSibling,
      };
    }
    if (root.parentElement !== document.body) {
      document.body.appendChild(root);
    }

    ytImmersive = true;
    root.hidden = false;
    root.classList.add("is-immersive", "is-fullscreen");
    document.documentElement.classList.add("rec-player-immersive");
    document.body.classList.add("rec-player-immersive");

    if (typeof api.setPlayerFullscreen === "function") {
      try {
        await api.setPlayerFullscreen(true);
      } catch (err) {
        console.warn("[player] window fullscreen", err);
      }
    }

    syncYtFullscreenUi();
  }

  async function exitYtImmersive() {
    const root = document.getElementById("yt-player");
    ytImmersive = false;
    root?.classList.remove("is-immersive", "is-fullscreen");
    document.documentElement.classList.remove("rec-player-immersive");
    document.body.classList.remove("rec-player-immersive");

    if (root && ytPlayerHome?.parent) {
      try {
        if (
          ytPlayerHome.next &&
          ytPlayerHome.next.parentNode === ytPlayerHome.parent
        ) {
          ytPlayerHome.parent.insertBefore(root, ytPlayerHome.next);
        } else {
          ytPlayerHome.parent.appendChild(root);
        }
      } catch {
        ytPlayerHome.parent.appendChild(root);
      }
    }
    ytPlayerHome = null;

    if (typeof api.setPlayerFullscreen === "function") {
      try {
        await api.setPlayerFullscreen(false);
      } catch {
        // ignore
      }
    }

    syncYtFullscreenUi();
  }

  async function toggleYtFullscreen() {
    const root = document.getElementById("yt-player");
    if (!root || root.hasAttribute("hidden")) return;

    if (isYtFullscreenActive()) {
      await exitYtImmersive();
      return;
    }

    // Frameless Electron: native element fullscreen is unreliable — use immersive shell
    await enterYtImmersive();
  }

  function wireYtPlayer() {
    if (ytWired) return;
    ytWired = true;
    const video = document.getElementById("rec-media-video");
    const stage = document.getElementById("yt-stage");
    const seek = document.getElementById("yt-seek");
    const vol = document.getElementById("yt-vol");
    if (!video) return;

    document.getElementById("yt-big-play")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleYtPlay();
    });
    document.getElementById("yt-play")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleYtPlay();
    });
    stage?.addEventListener("click", (e) => {
      if (e.target.closest(".nv-controls")) return;
      toggleYtPlay();
    });
    stage?.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void toggleYtFullscreen();
    });
    video.addEventListener("play", syncYtPlayUi);
    video.addEventListener("pause", syncYtPlayUi);
    video.addEventListener("ended", syncYtPlayUi);
    video.addEventListener("timeupdate", syncYtProgress);
    video.addEventListener("loadedmetadata", () => {
      setYtError(null);
      syncYtProgress();
    });
    video.addEventListener("error", () => {
      const code = video.error?.code;
      const mediaErr =
        code === 1
          ? "aborted"
          : code === 2
            ? "network"
            : code === 3
              ? "decode"
              : code === 4
                ? "src-not-supported"
                : `code-${code || "?"}`;
      const msg =
        code === 4
          ? "Clip format not supported / corrupt"
          : code === 3
            ? "Decode failed (corrupt or bad codec)"
            : "Could not load this clip";
      setYtError(`${msg} [${mediaErr}]`);
      syncYtProgress();
      if (recMediaSelected && typeof api.probeRecording === "function") {
        void api.probeRecording(recMediaSelected).then((dbg) => {
          if (dbg) {
            const tip = document.getElementById("rec-debug-tip");
            const details = document.getElementById("rec-debug");
            renderRecordingDebug({
              ...dbg,
              playerError: {
                code,
                mediaErr,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.currentSrc || video.src || null,
              },
              tip:
                dbg.tip ||
                "Player failed — probe result below explains if the file itself is corrupt.",
            });
            if (details) details.open = true;
            if (tip) {
              tip.textContent =
                "Player failed to render — see debug (auto-probed this file).";
            }
          }
        });
      }
    });

    seek?.addEventListener("pointerdown", () => {
      seek.dataset.dragging = "1";
    });
    const applySeek = () => {
      if (!seek || !video) return;
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(dur > 0)) return;
      const next = (Number(seek.value) / 1000) * dur;
      if (!Number.isFinite(next)) return;
      try {
        video.currentTime = next;
      } catch (err) {
        console.warn("[player] seek failed", err);
      }
    };
    const endSeek = () => {
      if (!seek) return;
      seek.dataset.dragging = "0";
      applySeek();
      syncYtProgress();
    };
    seek?.addEventListener("pointerup", endSeek);
    seek?.addEventListener("pointercancel", endSeek);
    seek?.addEventListener("change", endSeek);
    seek?.addEventListener("input", () => {
      const dur = Number.isFinite(video.duration) ? video.duration : 0;
      const cur = dur > 0 ? (Number(seek.value) / 1000) * dur : 0;
      const time = document.getElementById("yt-time");
      if (time) time.textContent = `${formatYtTime(cur)} / ${formatYtTime(dur)}`;
      // Live scrub while dragging (needs byte-range media responses)
      if (seek?.dataset.dragging === "1") applySeek();
    });
    video?.addEventListener("seeked", () => {
      syncYtProgress();
    });
    video?.addEventListener("seeking", () => {
      syncYtProgress();
    });

    vol?.addEventListener("input", () => {
      video.volume = Math.min(1, Math.max(0, Number(vol.value) / 100));
      video.muted = video.volume === 0;
    });
    document.getElementById("yt-mute")?.addEventListener("click", () => {
      video.muted = !video.muted;
      if (vol) vol.value = String(Math.round((video.muted ? 0 : video.volume) * 100));
    });
    document.getElementById("yt-fs")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void toggleYtFullscreen();
    });
    document.addEventListener("fullscreenchange", () => {
      syncYtFullscreenUi();
    });
    document.addEventListener("webkitfullscreenchange", syncYtFullscreenUi);
    document.addEventListener("keydown", (e) => {
      const player = document.getElementById("yt-player");
      if (!player || player.hasAttribute("hidden")) return;
      if (e.key === "Escape" && isYtFullscreenActive()) {
        e.preventDefault();
        void exitYtImmersive();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        if (e.target?.closest?.("input,textarea,select,[contenteditable]")) return;
        e.preventDefault();
        void toggleYtFullscreen();
      }
    });
  }

  async function shareSelectedMedia(kind, target) {
    const name =
      kind === "recording" ? recMediaSelected : ssPreviewName;
    if (!name || typeof api.shareMedia !== "function") return;
    try {
      const res = await api.shareMedia({ kind, name, target });
      if (res?.tip) {
        const status =
          kind === "recording"
            ? document.getElementById("ss-rec-status")
            : document.getElementById("save-state");
        if (status && kind === "recording" && status.dataset.state === "idle") {
          const textEl = status.querySelector(".ss-rec-status-text") || status;
          textEl.textContent = res.tip;
        } else if (kind === "screenshot") {
          markSaved();
          const el = document.getElementById("save-state");
          if (el) el.textContent = res.tip;
        }
      }
    } catch (err) {
      console.warn("[share]", err);
    }
  }

  async function refreshRecordingFolderPath() {
    const el = document.getElementById("ss-rec-folder-path");
    if (!el || typeof api.getRecordingsDir !== "function") return;
    try {
      const dir = await api.getRecordingsDir();
      if (dir) el.textContent = dir;
    } catch {
      // keep default
    }
  }

  function formatRecordingClipTitle(item) {
    const iso = item?.meta?.recordedAt || null;
    const ms = iso ? Date.parse(iso) : Number(item?.mtime) || 0;
    if (ms > 0) {
      const d = new Date(ms);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const name = String(item?.name || "");
    const m = name.match(
      /(\d{4})-(\d{2})-(\d{2})[_-](\d{2})(\d{2})(\d{2})/
    );
    if (m) {
      const d = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6])
      );
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
    }
    return name.replace(/\.[^.]+$/, "") || "Clip";
  }

  function recordingExtBadge(name) {
    return String(name || "").split(".").pop()?.toUpperCase() || "VIDEO";
  }

  function renderRecInfoChips(container, chips) {
    if (!container) return;
    container.replaceChildren();
    for (const chip of chips.filter(Boolean)) {
      const el = document.createElement("span");
      el.className = "rec-media-chip";
      el.textContent = chip;
      container.appendChild(el);
    }
  }

  function clearRecordingPreview() {
    if (ytImmersive) {
      void exitYtImmersive();
    }
    recMediaSelected = null;
    const video = document.getElementById("rec-media-video");
    const empty = document.getElementById("rec-media-preview-empty");
    const meta = document.getElementById("rec-media-preview-meta");
    const player = document.getElementById("yt-player");
    const details = document.getElementById("rec-media-details");
    const filename = document.getElementById("rec-media-preview-filename");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    setYtError(null);
    if (details) details.hidden = true;
    if (player) {
      player.hidden = true;
      player.classList.remove("is-playing", "is-fullscreen");
    }
    if (empty) empty.hidden = false;
    if (meta) meta.hidden = true;
    if (filename) {
      filename.hidden = true;
      filename.textContent = "";
    }
    document.querySelectorAll(".rec-media-item.is-selected").forEach((el) => {
      el.classList.remove("is-selected");
    });
    syncYtPlayUi();
  }

  function fillRecordingDetails(item) {
    const details = document.getElementById("rec-media-details");
    const mapEl = document.getElementById("rec-media-detail-map");
    const placeEl = document.getElementById("rec-media-detail-place");
    const timeEl = document.getElementById("rec-media-detail-time");
    const coordsEl = document.getElementById("rec-media-detail-coords");
    const meta = item?.meta || null;
    if (!details) return;

    if (!meta) {
      details.hidden = true;
      return;
    }
    details.hidden = false;
    if (mapEl) mapEl.textContent = meta.basemapLabel || meta.basemap || "—";
    if (placeEl) placeEl.textContent = meta.placeLabel || "Location unknown";
    if (timeEl) {
      const iso = meta.recordedAt || null;
      timeEl.textContent = iso
        ? new Date(iso).toLocaleString()
        : item?.mtime
          ? new Date(item.mtime).toLocaleString()
          : "—";
    }
    if (coordsEl) {
      coordsEl.textContent = meta.coordsText || "Not available";
    }
  }

  async function selectRecordingMedia(item) {
    if (!item?.name) return;
    if (item.pending || item.status === "encoding") {
      setYtError("Still encoding — preview unlocks when ready");
      return;
    }
    wireYtPlayer();
    recMediaSelected = item.name;
    const video = document.getElementById("rec-media-video");
    const empty = document.getElementById("rec-media-preview-empty");
    const meta = document.getElementById("rec-media-preview-meta");
    const player = document.getElementById("yt-player");
    const title = document.getElementById("rec-media-preview-title");
    const info = document.getElementById("rec-media-preview-info");
    const filename = document.getElementById("rec-media-preview-filename");

    document.querySelectorAll(".rec-media-item").forEach((el) => {
      el.classList.toggle("is-selected", el.dataset.name === item.name);
    });

    const friendly = formatRecordingClipTitle(item);
    if (title) title.textContent = friendly;
    if (filename) {
      filename.textContent = item.name;
      filename.hidden = false;
    }
    const ext = recordingExtBadge(item.name);
    const place = item.meta?.placeLabel || "";
    const map = item.meta?.basemapLabel || item.meta?.basemap || "";
    const chips = [
      ext,
      formatSsBytes(item.size),
      place,
      map,
    ];
    renderRecInfoChips(info, chips);
    fillRecordingDetails(item);
    if (empty) empty.hidden = true;
    if (meta) meta.hidden = false;
    if (player) player.hidden = false;
    if (video && item.url) {
      setYtError(null);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.src = item.url;
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        setYtError(null);
        syncYtProgress();
        // Paint first frame so the stage is not a black box
        try {
          if (video.currentTime < 0.05) video.currentTime = 0.05;
        } catch {
          // ignore
        }
        const vw = video.videoWidth || 0;
        const vh = video.videoHeight || 0;
        if (vw > 0 && vh > 0) {
          renderRecInfoChips(info, [...chips, `${vw}×${vh}`]);
        }
      };
      video.addEventListener("loadedmetadata", onMeta);
      video.load();
      syncYtPlayUi();
      syncYtProgress();
      syncYtFullscreenUi();
    }
  }

  async function refreshRecordingMediaLibrary() {
    const list = document.getElementById("rec-media-list");
    const empty = document.getElementById("rec-media-empty");
    const countEl = document.getElementById("rec-media-count");
    if (!list || typeof api.listRecordings !== "function") return;
    let items = [];
    try {
      items = await api.listRecordings();
    } catch {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    list.replaceChildren();
    if (empty) empty.hidden = items.length > 0;
    const readyCount = items.filter((it) => !it.pending).length;
    if (countEl) {
      if (readyCount > 0) {
        countEl.hidden = false;
        countEl.textContent = String(readyCount);
      } else {
        countEl.hidden = true;
      }
    }

    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rec-media-item";
      btn.dataset.name = item.name;
      if (item.pending) {
        btn.classList.add("is-pending");
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        btn.innerHTML =
          `<span class="rec-media-pending-spin" aria-hidden="true"></span>` +
          `<span class="rec-media-pending-copy">` +
          `<strong>${item.label || "Encoding clip…"}</strong>` +
          `<span>Please wait — not ready to play</span>` +
          `</span>`;
      } else {
        if (item.name === recMediaSelected) btn.classList.add("is-selected");
        const title = formatRecordingClipTitle(item);
        const place = item.meta?.placeLabel || "";
        const subParts = [place, formatSsBytes(item.size)].filter(Boolean);
        const ext = recordingExtBadge(item.name);
        btn.innerHTML =
          `<span class="rec-media-item-thumb" aria-hidden="true"></span>` +
          `<span class="rec-media-item-body">` +
          `<strong class="rec-media-item-title">${title}</strong>` +
          `<span class="rec-media-item-sub">${subParts.join(" · ") || "Clip"}</span>` +
          (item.meta?.coordsText
            ? `<span class="rec-media-item-coords">${item.meta.coordsText}</span>`
            : "") +
          `</span>` +
          `<span class="rec-media-item-badge">${ext}</span>`;
        btn.addEventListener("click", () => {
          void selectRecordingMedia(item);
        });
      }
      list.appendChild(btn);
    }

    if (
      recMediaSelected &&
      !items.some((it) => it.name === recMediaSelected && !it.pending)
    ) {
      clearRecordingPreview();
    }
  }

  function initRecordingPanel() {
    function formatRecClock(ms) {
      const total = Math.max(0, Math.floor(Number(ms) / 1000) || 0);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function setRecordingEncodingUi(jobs) {
      const list = Array.isArray(jobs) ? jobs : [];
      const encoding = list.length > 0;
      const banner = document.getElementById("rec-encoding-banner");
      const title = document.getElementById("rec-encoding-title");
      const sub = document.getElementById("rec-encoding-sub");
      const overlay = document.getElementById("rec-media-encoding-overlay");
      const panel = document.querySelector(".panel-recording");

      // Never lock Start/Stop — encoding is background
      if (panel) {
        panel.classList.remove("is-encoding");
        panel.setAttribute("aria-busy", encoding ? "true" : "false");
        panel.dataset.encodingCount = String(list.length);
      }
      if (banner) banner.hidden = !encoding;
      if (title) {
        title.textContent =
          list.length === 1
            ? "Encoding clip…"
            : `Encoding ${list.length} clips…`;
      }
      if (sub) {
        sub.textContent = encoding
          ? "You can start another recording — pending clips stay locked until ready"
          : "";
      }
      // Soft overlay only on media preview when something is encoding (informational)
      if (overlay) overlay.hidden = true;
    }

    function syncRecordingStatus(state) {
      const el = document.getElementById("ss-rec-status");
      const toggleBtn = document.getElementById("btn-rec-toggle");
      const pauseBtn = document.getElementById("btn-rec-pause-toggle");
      const st = String(state?.state || "idle");
      const jobs = Array.isArray(state?.encodingJobs)
        ? state.encodingJobs
        : [];
      setRecordingEncodingUi(jobs);

      if (el) {
        el.dataset.state = st === "encoding" ? "idle" : st;
        const textEl = el.querySelector(".ss-rec-status-text") || el;
        if (st === "recording") {
          textEl.textContent = `Recording · ${formatRecClock(state.elapsedMs)}`;
        } else if (st === "paused") {
          textEl.textContent = `Paused · ${formatRecClock(state.elapsedMs)}`;
        } else if (state?.saved) {
          textEl.textContent =
            state?.debug?.ok === false
              ? `Saved with issues · ${state.saved}`
              : `Saved ${state.saved}`;
        } else if (jobs.length > 0) {
          textEl.textContent =
            jobs.length === 1
              ? "Idle · encoding 1 clip"
              : `Idle · encoding ${jobs.length} clips`;
          el.dataset.state = "encoding";
        } else {
          textEl.textContent = "Idle";
        }
      }
      if (state?.debug) renderRecordingDebug(state.debug);

      const active = st === "recording" || st === "paused";
      if (toggleBtn) {
        const label = toggleBtn.querySelector(".btn-rec-label");
        toggleBtn.disabled = false;
        if (active) {
          toggleBtn.dataset.mode = "stop";
          toggleBtn.classList.remove("btn-primary");
          toggleBtn.classList.add("btn-ghost");
          toggleBtn.title = "Stop & save";
          toggleBtn.setAttribute("aria-label", "Stop & save");
          if (label) label.textContent = "Stop & save";
        } else {
          toggleBtn.dataset.mode = "start";
          toggleBtn.classList.add("btn-primary");
          toggleBtn.classList.remove("btn-ghost");
          toggleBtn.title = "Start recording";
          toggleBtn.setAttribute("aria-label", "Start recording");
          if (label) label.textContent = "Start";
        }
      }
      if (pauseBtn) {
        const label = pauseBtn.querySelector(".btn-rec-label");
        pauseBtn.disabled = !active;
        if (st === "paused") {
          pauseBtn.dataset.mode = "play";
          pauseBtn.title = "Resume recording";
          pauseBtn.setAttribute("aria-label", "Resume recording");
          if (label) label.textContent = "Play";
        } else {
          pauseBtn.dataset.mode = "pause";
          pauseBtn.title = "Pause recording";
          pauseBtn.setAttribute("aria-label", "Pause recording");
          if (label) label.textContent = "Pause";
        }
      }
      document.querySelectorAll("#ss-rec-hotkey-list .hotkey-capture").forEach((btn) => {
        btn.disabled = false;
      });
    }

    document.querySelectorAll("#ss-rec-hotkey-list .hotkey-capture").forEach((btn) => {
      btn.addEventListener("click", () =>
        startHotkeyCapture(btn.dataset.key, btn)
      );
    });

    document.getElementById("btn-rec-toggle")?.addEventListener("click", () => {
      api.recordingCommand?.("toggle-record");
    });
    document.getElementById("btn-rec-pause-toggle")?.addEventListener("click", () => {
      api.recordingCommand?.("toggle-pause");
    });
    document.getElementById("btn-rec-open-folder")?.addEventListener("click", () => {
      api.openRecordingsFolder?.().catch(() => {});
    });
    document.getElementById("btn-rec-debug-refresh")?.addEventListener("click", async () => {
      try {
        const debug =
          (typeof api.getRecordingDebug === "function"
            ? await api.getRecordingDebug()
            : null) || null;
        renderRecordingDebug(debug);
      } catch {
        renderRecordingDebug({ ok: false, tip: "Could not load debug" });
      }
    });
    document.getElementById("btn-rec-debug-copy")?.addEventListener("click", async () => {
      const log = document.getElementById("rec-debug-log");
      const text = log?.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        const tip = document.getElementById("rec-debug-tip");
        if (tip) tip.textContent = "Debug JSON copied to clipboard.";
      } catch {
        // ignore
      }
    });
    document.getElementById("btn-rec-media-folder")?.addEventListener("click", () => {
      api.openRecordingsFolder?.().catch(() => {});
    });
    document.getElementById("btn-rec-media-refresh")?.addEventListener("click", () => {
      void refreshRecordingMediaLibrary();
    });
    document.getElementById("btn-rec-media-open")?.addEventListener("click", () => {
      if (recMediaSelected) api.openRecording?.(recMediaSelected);
    });
    document.getElementById("btn-rec-media-reveal")?.addEventListener("click", () => {
      if (recMediaSelected) api.revealRecording?.(recMediaSelected);
    });
    document.getElementById("btn-rec-media-copy-coords")?.addEventListener("click", async () => {
      const coordsEl = document.getElementById("rec-media-detail-coords");
      const text = coordsEl?.textContent?.trim();
      if (!text || text === "—" || text === "Not available") return;
      try {
        await navigator.clipboard.writeText(text);
        const tip = coordsEl;
        const prev = tip.textContent;
        tip.textContent = "Copied!";
        setTimeout(() => {
          tip.textContent = prev;
        }, 900);
      } catch {
        // ignore
      }
    });
    document.getElementById("btn-rec-media-probe")?.addEventListener("click", async () => {
      if (!recMediaSelected || typeof api.probeRecording !== "function") return;
      const tip = document.getElementById("rec-debug-tip");
      const details = document.getElementById("rec-debug");
      if (tip) tip.textContent = "Probing file with ffmpeg…";
      try {
        const dbg = await api.probeRecording(recMediaSelected);
        renderRecordingDebug(dbg);
        if (details) details.open = true;
        // Jump user to Controls tab debug if possible
        const controlsTab = document.querySelector(
          '.panel-recording .tab[data-tab="controls"]'
        );
        controlsTab?.click?.();
      } catch (err) {
        renderRecordingDebug({
          ok: false,
          tip: err?.message || "Probe failed",
        });
      }
    });
    document.getElementById("btn-rec-media-delete")?.addEventListener("click", async () => {
      if (!recMediaSelected || typeof api.deleteRecording !== "function") return;
      const name = recMediaSelected;
      const res = await api.deleteRecording(name);
      if (res?.ok) {
        clearRecordingPreview();
        await refreshRecordingMediaLibrary();
      }
    });

    document.querySelectorAll(".btn-share").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.shareKind;
        const target = btn.dataset.shareTarget;
        void shareSelectedMedia(kind, target);
      });
    });

    if (typeof api.onRecordingState === "function") {
      api.onRecordingState((state) => {
        syncRecordingStatus(state);
        if (state?.saved || state?.encodeQueued) {
          void refreshRecordingMediaLibrary();
        }
      });
    }
    if (typeof api.onRecordingsUpdated === "function") {
      api.onRecordingsUpdated(() => {
        void refreshRecordingMediaLibrary();
      });
    }
    api.getRecordingState?.().then(syncRecordingStatus).catch(() => {});
    api.getRecordingDebug?.().then(renderRecordingDebug).catch(() => {});
    void refreshRecordingFolderPath();
    syncScreenshotHotkeyHints();
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

    // Map editor / All players are unpackaged/developer-only
    if (id === "map-editor") {
      const nav = document.getElementById("nav-map-editor");
      if (!nav || nav.hidden || nav.hasAttribute("hidden")) {
        id = "overlay";
      }
    }
    if (id === "all-players") {
      const nav = document.getElementById("nav-all-players");
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
    contentEl?.classList.toggle("is-all-players", id === "all-players");
    contentEl?.classList.toggle("is-group", id === "group");
    contentEl?.classList.toggle("is-game", id === "game");
    contentEl?.classList.toggle("is-screenshots", id === "screenshots");
    contentEl?.classList.toggle("is-recording", id === "recording");
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
    if (id === "screenshots") {
      void refreshScreenshotLibrary();
      syncScreenshotHotkeyHints();
      void refreshScreenshotFolderPath();
    }
    if (id === "recording") {
      syncScreenshotHotkeyHints();
      void refreshRecordingFolderPath();
      void refreshRecordingMediaLibrary();
    }
    if (id === "destination") {
      ensureDestMap();
      refreshDestMapSize();
    }
    if (id === "map-editor") {
      ensureLegendEditorMap();
    }
    if (id === "all-players") {
      ensureAllPlayersMap();
      refreshAllPlayersMapSize();
      syncAllPlayerMarkers(lastGlobalPlayersStatus);
      if (typeof api.refreshGlobalPlayers === "function") {
        api
          .refreshGlobalPlayers()
          .then(syncAllPlayerMarkers)
          .catch(() => {});
      } else if (typeof api.getGlobalPlayers === "function") {
        api.getGlobalPlayers().then(syncAllPlayerMarkers).catch(() => {});
      }
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
      body: "Sidebar modules: Overlay, Destination, Group, Game & hotkeys, Screenshots, Tutorial, Contributors, and Updates.",
    },
    {
      target: "nav-overlay",
      panel: "overlay",
      tab: "visual",
      title: "Overlay module",
      body: "Everything about the radar window lives here — style, border, effects, sweep, frame, HUD, places, opacity, layout, and preview.",
    },
    {
      target: "overlay-tabs",
      panel: "overlay",
      tab: "visual",
      title: "Overlay tabs",
      body: "Style · Border · Effects · Sweep · Frame · HUD · Places · Opacity · Layout · Preview. Each tab is a settings group for the radar.",
    },
    {
      target: "style-card",
      panel: "overlay",
      tab: "visual",
      title: "Style",
      body: "Pick the island Map (Gateway or Gateway Official), Map design (tactical, phosphor…), player pin, FOV color, and player icon.",
    },
    {
      target: "border-card",
      panel: "overlay",
      tab: "border",
      title: "Border",
      body: "Choose classic ring or a photo frame (Isle Evrima / Primal Pinas). Color, width, and glow apply to the classic ring.",
    },
    {
      target: "effects-card",
      panel: "overlay",
      tab: "effects",
      title: "Effects",
      body: "Animated rim FX around the radar. Default is Audio beat — it reacts to desktop/game sound. You can switch to lightning, fire, frost, 3D runs, and more.",
    },
    {
      target: "fx-random-gradient",
      panel: "overlay",
      tab: "effects",
      title: "Random gradient color",
      body: "Cycles the effect through shifting colors instead of a fixed Effect color. Works with Audio beat and the other rim FX.",
    },
    {
      target: "fx-beat-card",
      panel: "overlay",
      tab: "effects",
      title: "Audio beat controls",
      body: "Tune Sensitivity, Punch, Smoothness, Bass weight, Motion, and Rings so the rim pops with music or stay subtle during quiet play.",
    },
    {
      target: "fx-beat-legend",
      panel: "overlay",
      tab: "effects",
      title: "Beat legend tint",
      body: "Optional: tint place icons and rim pins with the beat’s gradient colors. N/S/E/W compass letters also pick up rim FX tints.",
    },
    {
      target: "sweep-card",
      panel: "overlay",
      tab: "sweep",
      title: "Sweep",
      body: "Enable the rotating radar beam, pick a sweep style, direction (clockwise or counterclockwise), and how many seconds per turn.",
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
      body: "Toggle the direction cone, N/S/E/W compass, and status bar under the radar. Compass letters tint with active rim FX. Sweep settings live under Overlay → Sweep.",
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
      tab: "preview",
      title: "Live preview",
      body: "Open Overlay → Preview anytime. This mirrors the overlay look as you edit. Changes sync to the in-game radar instantly.",
    },
    {
      target: "overlay-controls",
      panel: "overlay",
      tab: "preview",
      title: "Show / hide map",
      body: "The radar starts hidden. Use Show map to enable it. By default it only appears while The Isle is active — turn that off under Overlay → Layout to keep it visible anytime. Hide map turns it off fully.",
    },
    {
      target: "top-actions",
      panel: "overlay",
      tab: "preview",
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
      body: "Click a binding, then press your shortcut. Defaults include F8 place filter, F6/F7 zoom, − clear waypoint, = / F10 screenshots, F1/F2 recording, Ctrl+Shift+M hide overlay, Ctrl+Shift+D dashboard.",
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
      target: "nav-screenshots",
      panel: "screenshots",
      tab: "library",
      title: "Screenshots",
      body: "Capture the radar or the full monitor. Library filters Map / Screen captures saved under Pictures\\Screenshots\\IsleMap.",
    },
    {
      target: "screenshots-library-card",
      panel: "screenshots",
      tab: "library",
      title: "Screenshot library",
      body: "Browse captures, open the folder, or refresh. Use the map / screen buttons here or the hotkeys under Settings.",
    },
    {
      target: "screenshots-settings-card",
      panel: "screenshots",
      tab: "settings",
      title: "Screenshot settings",
      body: "Toggle Windows notifications and clipboard copy, and rebind map / screen capture hotkeys (same shortcuts live under Game & hotkeys).",
    },
    {
      target: "nav-recording",
      panel: "recording",
      tab: "controls",
      title: "Recording",
      body: "Record the overlay monitor with a live ring + timer. Start/Stop and Pause/Resume from Controls, or use the hotkeys.",
    },
    {
      target: "recording-controls-card",
      panel: "recording",
      tab: "controls",
      title: "Recording controls",
      body: "Start a clip, pause mid-take, and open the save folder (Videos\\IsleMap). Encoding can finish in the background so you can start another take.",
    },
    {
      target: "recording-desktop-audio",
      panel: "recording",
      tab: "controls",
      title: "Desktop audio",
      body: "Include system / game sound via Windows loopback. Turn it off for silent video-only clips.",
    },
    {
      target: "recording-media-card",
      panel: "recording",
      tab: "media",
      title: "Clip library",
      body: "Preview finished MP4s in HD, rename, open folder, or delete. Pending clips stay locked until encoding finishes.",
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
      requestAnimationFrame(() =>
        document.getElementById("welcome-username")?.focus()
      );
    } else {
      modal.setAttribute("hidden", "");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function showUsernameModal(show) {
    const modal = document.getElementById("username-modal");
    if (!modal) return;
    modal.classList.toggle("is-open", Boolean(show));
    if (show) {
      modal.removeAttribute("hidden");
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() =>
        document.getElementById("username-setup-input")?.focus()
      );
    } else {
      modal.setAttribute("hidden", "");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function readWelcomeUsername() {
    return String(document.getElementById("welcome-username")?.value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 24);
  }

  function showWelcomeUsernameError(show) {
    const el = document.getElementById("welcome-username-error");
    if (el) el.hidden = !show;
  }

  async function saveGameUsername(name) {
    const cleaned = String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 24);
    if (cleaned.length < 2) return { ok: false, reason: "short" };
    try {
      const res = await api.setGroupUsername?.(cleaned);
      if (res && res.ok === false) return res;
      const groupUser = document.getElementById("group-username");
      if (groupUser) groupUser.value = cleaned;
      await api.setSettings?.({ groupUsername: cleaned });
      return { ok: true, username: cleaned };
    } catch {
      return { ok: false, reason: "save-failed" };
    }
  }

  function needsGameUsername(settingsLike) {
    const fromSettings = String(settingsLike?.groupUsername || "").trim();
    const fromField = String(
      document.getElementById("group-username")?.value || ""
    ).trim();
    return fromSettings.length < 2 && fromField.length < 2;
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
    } else if (step.panel) {
      showPanel(step.panel);
      if (step.tab) {
        const scope = document.querySelector(`.panel[data-panel="${step.panel}"]`);
        activateTab(scope, step.tab);
      }
    }
    // Reveal Audio beat panels for spotlight even if another effect is selected
    if (
      step.target === "fx-beat-card" ||
      step.target === "fx-beat-legend" ||
      step.target === "fx-random-gradient"
    ) {
      const wrap = document.getElementById("border-effect-settings");
      if (wrap) {
        wrap.hidden = false;
        wrap.removeAttribute("hidden");
      }
      if (step.target === "fx-beat-card" || step.target === "fx-beat-legend") {
        const blockBeat = document.getElementById("fx-block-beat");
        if (blockBeat) {
          blockBeat.hidden = false;
          blockBeat.removeAttribute("hidden");
        }
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
  initScreenshotsPanel();
  initRecordingPanel();

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
      const label = enabled ? "Hide map" : "Show map";
      toggleBtn.dataset.map = enabled ? "on" : "off";
      toggleBtn.title = label;
      toggleBtn.setAttribute("aria-label", label);
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

  async function finishWelcome(startTour) {
    const name = readWelcomeUsername();
    if (name.length < 2) {
      showWelcomeUsernameError(true);
      document.getElementById("welcome-username")?.focus();
      return;
    }
    showWelcomeUsernameError(false);
    const saved = await saveGameUsername(name);
    if (!saved.ok) {
      showWelcomeUsernameError(true);
      return;
    }
    showWelcomeModal(false);
    await markTutorialDone();
    if (startTour) beginTutorial();
  }

  document.getElementById("welcome-start")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    finishWelcome(true).catch(() => {});
  });

  document.getElementById("welcome-skip")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    finishWelcome(false).catch(() => {});
  });

  document.getElementById("welcome-username")?.addEventListener("input", () => {
    showWelcomeUsernameError(false);
  });

  document.getElementById("welcome-username")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishWelcome(true).catch(() => {});
    }
  });

  async function finishUsernameSetup() {
    const input = document.getElementById("username-setup-input");
    const err = document.getElementById("username-setup-error");
    const name = String(input?.value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 24);
    if (name.length < 2) {
      if (err) err.hidden = false;
      input?.focus();
      return;
    }
    if (err) err.hidden = true;
    const saved = await saveGameUsername(name);
    if (!saved.ok) {
      if (err) err.hidden = false;
      return;
    }
    showUsernameModal(false);
  }

  document.getElementById("username-setup-save")?.addEventListener("click", (e) => {
    e.preventDefault();
    finishUsernameSetup().catch(() => {});
  });

  document
    .getElementById("username-setup-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishUsernameSetup().catch(() => {});
      }
    });

  document
    .getElementById("username-setup-input")
    ?.addEventListener("input", () => {
      const err = document.getElementById("username-setup-error");
      if (err) err.hidden = true;
    });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const welcome = document.getElementById("welcome-modal");
    const usernameModal = document.getElementById("username-modal");
    // Don't dismiss username / welcome with Esc — username is required
    if (welcome?.classList.contains("is-open")) return;
    if (usernameModal?.classList.contains("is-open")) return;
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
      page: document.querySelector(".group-page"),
      onboard: document.getElementById("group-onboard"),
      gated: document.getElementById("group-gated"),
      gateHint: document.getElementById("group-username-gate-hint"),
      usernameField: document.getElementById("group-username-field"),
      usernameSlotOnboard: document.getElementById("group-username-slot-onboard"),
      usernameSlotLive: document.getElementById("group-username-slot-live"),
      pill: document.getElementById("group-status-pill"),
      username: document.getElementById("group-username"),
      pcid: document.getElementById("group-pcid"),
      hint: document.getElementById("group-config-hint"),
      lobbyIdle: document.getElementById("group-lobby-idle"),
      lobbyConnecting: document.getElementById("group-lobby-connecting"),
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

    function setHidden(el, hidden) {
      if (!el) return;
      el.hidden = Boolean(hidden);
      if (hidden) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    }

    function placeUsernameField(ready) {
      const field = els.usernameField;
      const slot = ready ? els.usernameSlotLive : els.usernameSlotOnboard;
      if (!field || !slot) return;
      setHidden(field, false);
      if (field.parentElement !== slot) slot.appendChild(field);
    }

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function usernameReady(value = els.username?.value) {
      return (
        String(value || "")
          .trim()
          .replace(/\s+/g, " ").length >= 2
      );
    }

    function syncGroupGate() {
      const ready = usernameReady();
      els.page?.classList.toggle("is-group-ready", ready);
      setHidden(els.gated, !ready);
      setHidden(els.onboard, ready);
      placeUsernameField(ready);
      if (els.gateHint) els.gateHint.hidden = ready;
      return ready;
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
      const ready = syncGroupGate();
      if (els.hint) {
        if (!status.configured) {
          els.hint.textContent =
            "Pusher isn’t configured yet — open Advanced or use .env.";
        } else if (state === "joined") {
          els.hint.textContent = "Squad linked — Copy Location to share your pin.";
        } else if (state === "connecting") {
          els.hint.textContent = "Connecting to the lobby…";
        } else {
          els.hint.textContent = "Create or join a group to share live map pins.";
        }
      }

      const msg = String(status.message || "").trim();
      if (els.lobbyMsg) {
        setHidden(els.lobbyMsg, !msg);
        els.lobbyMsg.textContent = msg;
        els.lobbyMsg.dataset.tone =
          state === "error" ? "error" : state === "joined" ? "ok" : "";
      }

      const inGroup = state === "joined";
      const connecting = state === "connecting";
      setHidden(els.lobbyIdle, inGroup || connecting);
      setHidden(els.lobbyConnecting, !connecting);
      setHidden(els.lobbyActive, !inGroup);
      if (els.codeValue) {
        els.codeValue.textContent = inGroup && status.roomCode ? status.roomCode : "";
      }
      if (
        inGroup &&
        els.joinCode &&
        status.roomCode &&
        document.activeElement !== els.joinCode &&
        !els.joinCode.value
      ) {
        els.joinCode.value = status.roomCode;
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
                  ? `<button type="button" class="btn btn-ghost btn-icon btn-icon-sm btn-danger-ghost" data-kick="${escapeHtml(
                      m.pcId
                    )}" title="Remove member" aria-label="Remove member"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`
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
      syncGroupGate();
      clearTimeout(usernameTimer);
      usernameTimer = setTimeout(() => {
        if (usernameReady()) {
          api.setGroupUsername?.(els.username.value);
        }
      }, 280);
    });
    els.username?.addEventListener("change", () => {
      syncGroupGate();
    });

    async function ensureGroupUsername() {
      const name = String(els.username?.value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 24);
      if (name.length < 2) {
        syncGroupGate();
        els.username?.focus();
        return false;
      }
      await api.setGroupUsername?.(name);
      syncGroupGate();
      return true;
    }

    document
      .getElementById("btn-group-create")
      ?.addEventListener("click", async () => {
        if (!(await ensureGroupUsername())) return;
        const snap = await api.createGroup?.();
        renderGroup(snap);
      });

    async function joinFromForm() {
      if (!(await ensureGroupUsername())) return;
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
      syncGroupGate();
    });
    api.getSettings?.().then((s) => {
      if (els.pusherKey) els.pusherKey.value = s.groupPusherKey || "";
      if (els.pusherCluster) els.pusherCluster.value = s.groupPusherCluster || "";
      if (els.authUrl) els.authUrl.value = s.groupAuthUrl || "";
      if (els.joinCode && s.groupLastCode) els.joinCode.value = s.groupLastCode;
      if (els.username && s.groupUsername && !els.username.value) {
        els.username.value = s.groupUsername;
      }
      syncGroupGate();
    });
    syncGroupGate();
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

  function applyOnlineStatus(status) {
    const root = document.getElementById("online-users");
    const countEl = document.getElementById("online-users-count");
    const labelEl = document.getElementById("online-users-label");
    if (!root || !countEl || !labelEl) return;

    const state = status?.status || "idle";
    const count = Number(status?.count);
    root.dataset.state = state;

    if (state === "online" && Number.isFinite(count)) {
      countEl.textContent = String(count);
      labelEl.textContent = "online";
      root.title = `${count} IsleMap ${count === 1 ? "client" : "clients"} online`;
      return;
    }
    if (state === "connecting") {
      countEl.textContent = "…";
      labelEl.textContent = "online";
      root.title = "Connecting to presence…";
      return;
    }
    if (state === "error") {
      countEl.textContent = "—";
      labelEl.textContent = "online";
      root.title = status?.message || "Could not load active users";
      return;
    }
    countEl.textContent = "—";
    labelEl.textContent = "online";
    root.title = status?.configured
      ? "Waiting for presence…"
      : "Pusher not configured";
  }

  function initOnlineUsersUi() {
    if (typeof api.onOnlineStatus === "function") {
      api.onOnlineStatus(applyOnlineStatus);
    }
    if (typeof api.getOnlineStatus === "function") {
      api.getOnlineStatus().then(applyOnlineStatus).catch(() => {
        applyOnlineStatus({ status: "error", message: "Unavailable", count: 0 });
      });
    } else {
      applyOnlineStatus({
        status: "error",
        message: "Online status unavailable",
        count: 0,
      });
    }
  }

  function globalPeerAgeSeconds(peer) {
    const ts = Number(peer?.ts);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    return Math.max(0, Math.floor((Date.now() - ts) / 1000));
  }

  function allPlayersPeerIcon(peer) {
    const color = peer.color || "#ff7ab8";
    const name = peer.username || "Hunter";
    const age = globalPeerAgeSeconds(peer);
    const ageLabel = age == null ? "—" : `${age}s`;
    const eye =
      '<svg class="peer-seen-eye" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M8 3.2C4.2 3.2 1.4 6.4 1 8c.4 1.6 3.2 4.8 7 4.8s6.6-3.2 7-4.8c-.4-1.6-3.2-4.8-7-4.8zm0 7.1A2.3 2.3 0 1 1 8 5.7a2.3 2.3 0 0 1 0 4.6z"/>' +
      '<circle cx="8" cy="8" r="1.15"/></svg>';
    return L.divIcon({
      className: "peer-marker",
      html:
        `<div class="peer-dot" style="--peer:${color}"></div>` +
        `<div class="peer-meta" style="--peer:${color}">` +
        `<div class="peer-label">${escapeHtml(name)}${peer.isSelf ? " (you)" : ""}</div>` +
        `<div class="peer-seen" title="Last seen">${eye}<span class="peer-seen-sec">${ageLabel}</span></div>` +
        `</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  function ensureAllPlayersMap() {
    const mapEl = document.getElementById("all-players-map");
    if (
      allPlayersMap ||
      !mapEl ||
      typeof L === "undefined" ||
      !window.IsleCoords
    ) {
      return;
    }
    const basemapId =
      fields.basemap?.value ||
      window.IsleCoords.DEFAULT_BASEMAP ||
      "gateway-official";
    const { setBasemap, basemapUrl, mapBounds } = window.IsleCoords;
    setBasemap(basemapId);
    const bounds = mapBounds();
    allPlayersMap = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomSnap: 0.25,
      attributionControl: false,
      zoomControl: true,
      maxBounds: bounds,
      maxBoundsViscosity: 0.85,
    });
    allPlayersBasemapOverlay = L.imageOverlay(
      basemapUrl(basemapId, "dashboard"),
      bounds
    ).addTo(allPlayersMap);
    allPlayersBasemapId = setBasemap(basemapId).id;
    allPlayersMap.getContainer().style.background = "#05070d";
    allPlayersMap.fitBounds(bounds, { padding: [8, 8] });
    // Pins often arrived before the map existed — paint them now
    syncAllPlayerMarkers(lastGlobalPlayersStatus);
  }

  function refreshAllPlayersMapSize() {
    if (!allPlayersMap || !window.IsleCoords) return;
    requestAnimationFrame(() => {
      allPlayersMap.invalidateSize({ animate: false });
      allPlayersMap.fitBounds(window.IsleCoords.mapBounds(), {
        padding: [10, 10],
        animate: false,
      });
    });
  }

  function refreshAllPlayersAges() {
    for (const [id, marker] of allPlayerMarkers) {
      const peer = allPlayerData.get(id);
      if (peer) marker.setIcon(allPlayersPeerIcon(peer));
    }
    renderAllPlayersList([...allPlayerData.values()]);
  }

  function ensureAllPlayersAgeTimer() {
    if (allPlayersAgeTimer || allPlayerMarkers.size === 0) return;
    allPlayersAgeTimer = setInterval(() => {
      if (allPlayerMarkers.size === 0) {
        clearInterval(allPlayersAgeTimer);
        allPlayersAgeTimer = null;
        return;
      }
      refreshAllPlayersAges();
    }, 1000);
  }

  function renderAllPlayersList(players) {
    const listEl = document.getElementById("all-players-list");
    if (!listEl) return;
    if (!players.length) {
      listEl.innerHTML =
        '<li class="is-empty" style="grid-template-columns:1fr"><span class="name" style="color:var(--muted)">No pinned players yet</span></li>';
      return;
    }
    listEl.innerHTML = players
      .map((p) => {
        const age = globalPeerAgeSeconds(p);
        const ageLabel = age == null ? "—" : `${age}s`;
        const color = escapeHtml(p.color || "#ff7ab8");
        return `<li class="${p.isSelf ? "is-self" : ""}" data-id="${escapeHtml(
          p.pcId || ""
        )}">
          <span class="dot" style="--peer:${color}"></span>
          <span class="name">${escapeHtml(p.username || "Hunter")}${
          p.isSelf ? " (you)" : ""
        }</span>
          <span class="age">${ageLabel}</span>
        </li>`;
      })
      .join("");
  }

  function syncAllPlayerMarkers(status) {
    if (status && typeof status === "object") {
      lastGlobalPlayersStatus = status;
    }
    const players = Array.isArray(lastGlobalPlayersStatus?.players)
      ? lastGlobalPlayersStatus.players
      : [];
    const onlineEl = document.getElementById("all-players-online");
    const pinnedEl = document.getElementById("all-players-pinned");
    const hintEl = document.getElementById("all-players-hint");
    if (onlineEl) {
      onlineEl.textContent = Number.isFinite(lastGlobalPlayersStatus?.count)
        ? String(lastGlobalPlayersStatus.count)
        : "—";
    }
    if (pinnedEl) pinnedEl.textContent = String(players.length);
    if (hintEl) {
      const online = Number(lastGlobalPlayersStatus?.count) || 0;
      if (players.length === 0 && online > 0) {
        hintEl.textContent =
          `${online} online, but no Copy Location pins yet. Installed builds only share presence — unpackaged/dev clients (or Copy Location here) show pins.`;
      } else {
        hintEl.textContent =
          "Pins appear after clients use Copy Location. Stale pins drop after ~45s.";
      }
    }

    if (!allPlayersMap || !window.IsleCoords) {
      renderAllPlayersList(players);
      return;
    }

    const seen = new Set();
    for (const peer of players) {
      if (!peer?.pcId || !Number.isFinite(peer.x) || !Number.isFinite(peer.y)) {
        continue;
      }
      seen.add(peer.pcId);
      allPlayerData.set(peer.pcId, peer);
      const ll = window.IsleCoords.worldToLatLng(L, peer.x, peer.y);
      let marker = allPlayerMarkers.get(peer.pcId);
      if (!marker) {
        marker = L.marker(ll, {
          icon: allPlayersPeerIcon(peer),
          zIndexOffset: peer.isSelf ? 900 : 800,
          interactive: false,
        }).addTo(allPlayersMap);
        allPlayerMarkers.set(peer.pcId, marker);
      } else {
        marker.setLatLng(ll);
        marker.setIcon(allPlayersPeerIcon(peer));
      }
    }
    for (const [id, marker] of allPlayerMarkers) {
      if (!seen.has(id)) {
        allPlayersMap.removeLayer(marker);
        allPlayerMarkers.delete(id);
        allPlayerData.delete(id);
      }
    }
    renderAllPlayersList(players);
    ensureAllPlayersAgeTimer();
  }

  async function initAllPlayersMap() {
    const nav = document.getElementById("nav-all-players");
    const panel = document.getElementById("panel-all-players");
    if (!nav && !panel) return;

    // Same gate as Map editor: unpackaged / developer builds only
    let canView = false;
    if (typeof api.canEditPlaces === "function") {
      try {
        const info = await api.canEditPlaces();
        canView = Boolean(info?.ok);
      } catch {
        canView = false;
      }
    } else if (typeof api.isDev === "function") {
      try {
        canView = Boolean(await api.isDev());
      } catch {
        canView = false;
      }
    }

    // Packaged / production builds: hide All players entirely
    if (!canView) {
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

    if (allPlayersReady) {
      ensureAllPlayersMap();
      return;
    }
    allPlayersReady = true;

    if (typeof api.onGlobalPlayers === "function") {
      api.onGlobalPlayers(syncAllPlayerMarkers);
    }
    if (typeof api.getGlobalPlayers === "function") {
      api
        .getGlobalPlayers()
        .then(syncAllPlayerMarkers)
        .catch(() => syncAllPlayerMarkers({ players: [], count: 0 }));
    }

    document
      .getElementById("all-players-list")
      ?.addEventListener("click", (e) => {
        const row = e.target.closest("li[data-id]");
        const id = row?.getAttribute("data-id");
        if (!id || !allPlayersMap || !window.IsleCoords) return;
        const peer = allPlayerData.get(id);
        if (!peer || !Number.isFinite(peer.x) || !Number.isFinite(peer.y)) return;
        allPlayersMap.panTo(
          window.IsleCoords.worldToLatLng(L, peer.x, peer.y)
        );
      });
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
    await initAllPlayersMap();
    initGroupPage();
    await initContributorsPage();
    await initChangelogPage();
    await fillAppVersion();
    initOnlineUsersUi();
    initUpdaterUi();
    const forceUpdate = document.body.classList.contains("force-update-active");
    if (!forceUpdate) {
      if (!s.tutorialCompleted) {
        if (s.groupUsername) {
          const welcomeUser = document.getElementById("welcome-username");
          if (welcomeUser) welcomeUser.value = s.groupUsername;
        }
        showWelcomeModal(true);
      } else if (needsGameUsername(s)) {
        showUsernameModal(true);
      }
    }
  });
})();
