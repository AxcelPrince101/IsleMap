/**
 * Gateway map georeference for The Isle (Evrima).
 *
 * Transform mirrors VulnonaMAP Gateway_v0.21 calibration (community-verified
 * against Copy Location / Unreal cm), scaled to bundled 1254² basemaps.
 *
 * Source: VulnonaMAP — https://vulnona.com/game/map/
 *   min/max are in “simple” units (Unreal cm / 1000).
 *   axis_X === "H" → world Y drives image X, world X drives image Y.
 */
window.IsleCoords = (() => {
  const BASEMAPS = Object.freeze({
    "gateway-realistic": Object.freeze({
      id: "gateway-realistic",
      label: "Gateway Realistic",
      file: "maps/gateway-realistic.png",
      imageWidth: 1254,
      imageHeight: 1254,
    }),
    "gateway-official": Object.freeze({
      id: "gateway-official",
      label: "Gateway Official",
      file: "maps/gateway-official.png",
      imageWidth: 1254,
      imageHeight: 1254,
    }),
    gateway: Object.freeze({
      id: "gateway",
      label: "Gateway [Deprecated]",
      /** Path relative to src/ (overlay) or ../ from dashboard */
      file: "gateway.png",
      imageWidth: 1254,
      imageHeight: 1254,
    }),
  });

  const DEFAULT_BASEMAP = "gateway-official";

  const CAL = {
    mapVersion: "Gateway_v0.21",
    source: "VulnonaMAP",
    // Unreal cm → simple units
    unrealDivisor: 1000,
    // Vulnona #cfg extents (simple units)
    minX: -607,
    maxX: 509,
    minY: -505,
    maxY: 607,
    /** "H" = world X is the vertical map axis (Vulnona Gateway) */
    axisX: "H",
    // Native calibration image size from Vulnona Gateway_v0.21
    srcWidth: 7800,
    srcHeight: 7817,
    // Active basemap pixel size (updated by setBasemap)
    imageWidth: 1254,
    imageHeight: 1254,
    // A–T / 01–20 grid (Unreal cm)
    gridOriginX: -580000,
    gridOriginY: -580000,
    gridCell: 58000,
    gridRows: 20,
    gridCols: 20,
  };

  let activeBasemapId = DEFAULT_BASEMAP;

  const RANGE_X = CAL.maxX - CAL.minX;
  const RANGE_Y = CAL.maxY - CAL.minY;
  const PX_PER_UNIT_V = CAL.srcHeight / RANGE_X;
  const PX_PER_UNIT_H = CAL.srcWidth / RANGE_Y;

  function getBasemap(id) {
    return BASEMAPS[id] || BASEMAPS[DEFAULT_BASEMAP];
  }

  function listBasemaps() {
    return Object.values(BASEMAPS);
  }

  function getActiveBasemap() {
    return getBasemap(activeBasemapId);
  }

  /**
   * @param {string} id
   * @param {"overlay"|"dashboard"} [from="overlay"]
   */
  function basemapUrl(id, from = "overlay") {
    const m = getBasemap(id);
    const prefix = from === "dashboard" ? "../" : "./";
    return `${prefix}${m.file}`;
  }

  function setBasemap(id) {
    const m = getBasemap(id);
    activeBasemapId = m.id;
    CAL.imageWidth = m.imageWidth;
    CAL.imageHeight = m.imageHeight;
    return m;
  }

  /** @returns {{ x: number, y: number }} pixel on the active basemap */
  function worldToPixel(wx, wy) {
    const sx = wx / CAL.unrealDivisor;
    const sy = wy / CAL.unrealDivisor;
    const rawX = (sx - CAL.minX) * PX_PER_UNIT_V;
    const rawY = (sy - CAL.minY) * PX_PER_UNIT_H;
    let srcPx;
    let srcPy;
    if (CAL.axisX === "H") {
      srcPx = rawY;
      srcPy = rawX;
    } else {
      srcPx = rawX;
      srcPy = rawY;
    }
    return {
      x: (srcPx / CAL.srcWidth) * CAL.imageWidth,
      y: (srcPy / CAL.srcHeight) * CAL.imageHeight,
    };
  }

  function worldToLatLng(L, wx, wy) {
    const { x, y } = worldToPixel(wx, wy);
    return L.latLng(CAL.imageHeight - y, x);
  }

  function pixelToWorld(px, py) {
    const srcPx = (px / CAL.imageWidth) * CAL.srcWidth;
    const srcPy = (py / CAL.imageHeight) * CAL.srcHeight;
    let rawX;
    let rawY;
    if (CAL.axisX === "H") {
      rawX = srcPy;
      rawY = srcPx;
    } else {
      rawX = srcPx;
      rawY = srcPy;
    }
    const sx = rawX / PX_PER_UNIT_V + CAL.minX;
    const sy = rawY / PX_PER_UNIT_H + CAL.minY;
    return {
      x: sx * CAL.unrealDivisor,
      y: sy * CAL.unrealDivisor,
    };
  }

  function latLngToWorld(latlng) {
    const px = latlng.lng;
    const py = CAL.imageHeight - latlng.lat;
    return pixelToWorld(px, py);
  }

  function mapBounds() {
    return [
      [0, 0],
      [CAL.imageHeight, CAL.imageWidth],
    ];
  }

  function gridCode(wx, wy) {
    const row = Math.floor((wx - CAL.gridOriginX) / CAL.gridCell);
    const col = Math.floor((wy - CAL.gridOriginY) / CAL.gridCell);
    if (
      row < 0 ||
      row >= CAL.gridRows ||
      col < 0 ||
      col >= CAL.gridCols
    ) {
      return null;
    }
    return `${String.fromCharCode(65 + row)}${String(col + 1).padStart(2, "0")}`;
  }

  function formatWorld(wx, wy, wz) {
    const z = Number.isFinite(wz) ? wz.toFixed(1) : "—";
    return `${wx.toFixed(1)}, ${wy.toFixed(1)}, ${z}`;
  }

  setBasemap(DEFAULT_BASEMAP);

  return {
    CAL,
    BASEMAPS,
    DEFAULT_BASEMAP,
    getBasemap,
    listBasemaps,
    getActiveBasemap,
    basemapUrl,
    setBasemap,
    worldToPixel,
    worldToLatLng,
    pixelToWorld,
    latLngToWorld,
    mapBounds,
    gridCode,
    formatWorld,
  };
})();
