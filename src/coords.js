/**
 * Gateway map georeference — Primal Pinas public map
 * (https://primalpinas.online/map), matched to their /gateway.png.
 *
 * Their SVG uses a 4096 viewBox with the same affine; we scale to the
 * actual PNG size (1254²) so grid lines and POIs lock to the art.
 */
window.IsleCoords = (() => {
  const CAL = Object.freeze({
    mapVersion: "Gateway_PrimalPinas",
    source: "https://primalpinas.online/map",
    // World units are Unreal cm (same as Copy Location)
    xMin: 448459,
    xMax: -603005,
    yMin: -480441,
    yMax: 570299,
    imageWidth: 1254,
    imageHeight: 1254,
    // A–T / 01–20 grid (same as Primal Pinas)
    gridOriginX: -580000,
    gridOriginY: -580000,
    gridCell: 58000,
    gridRows: 20,
    gridCols: 20,
  });

  function worldToPixel(wx, wy) {
    const x =
      ((wy - CAL.yMin) / (CAL.yMax - CAL.yMin)) * CAL.imageWidth;
    const y =
      (1 - (wx - CAL.xMin) / (CAL.xMax - CAL.xMin)) * CAL.imageHeight;
    return { x, y };
  }

  function worldToLatLng(L, wx, wy) {
    const { x, y } = worldToPixel(wx, wy);
    return L.latLng(CAL.imageHeight - y, x);
  }

  function pixelToWorld(px, py) {
    const wy =
      CAL.yMin + (px / CAL.imageWidth) * (CAL.yMax - CAL.yMin);
    const wx =
      CAL.xMin + (1 - py / CAL.imageHeight) * (CAL.xMax - CAL.xMin);
    return { x: wx, y: wy };
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

  return {
    CAL,
    worldToPixel,
    worldToLatLng,
    pixelToWorld,
    latLngToWorld,
    mapBounds,
    gridCode,
    formatWorld,
  };
})();
