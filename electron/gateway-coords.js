/**
 * Gateway Unreal cm ↔ basemap pixel transform (main-process copy of src/coords.js CAL).
 * Used by Bosch Island map-tracker pixel → world conversion.
 */

const CAL = Object.freeze({
  unrealDivisor: 1000,
  minX: -607,
  maxX: 509,
  minY: -505,
  maxY: 607,
  axisX: "H",
  srcWidth: 7800,
  srcHeight: 7817,
  imageWidth: 1254,
  imageHeight: 1254,
});

const RANGE_X = CAL.maxX - CAL.minX;
const RANGE_Y = CAL.maxY - CAL.minY;
const PX_PER_UNIT_V = CAL.srcHeight / RANGE_X;
const PX_PER_UNIT_H = CAL.srcWidth / RANGE_Y;

/**
 * Convert a point on a Gateway-style map image (any pixel size) to Unreal cm.
 * @param {number} px
 * @param {number} py
 * @param {number} [mapW]
 * @param {number} [mapH]
 */
function pixelToWorld(px, py, mapW = CAL.imageWidth, mapH = CAL.imageHeight) {
  const w = Number(mapW) > 0 ? Number(mapW) : CAL.imageWidth;
  const h = Number(mapH) > 0 ? Number(mapH) : CAL.imageHeight;
  const nx = (Number(px) / w) * CAL.imageWidth;
  const ny = (Number(py) / h) * CAL.imageHeight;
  const srcPx = (nx / CAL.imageWidth) * CAL.srcWidth;
  const srcPy = (ny / CAL.imageHeight) * CAL.srcHeight;
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

module.exports = { CAL, pixelToWorld };
