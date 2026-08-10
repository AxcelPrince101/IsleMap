/**
 * Circular frequency spectrum matching vue-audio-visual `<av-circle>` / useAVCircle.
 *
 * Algorithm adapted from vue-audio-visual (MIT)
 * https://www.npmjs.com/package/vue-audio-visual
 * https://github.com/staskobzar/vue-audio-visual
 *
 * Wired to IsleMap desktop-audio AnalyserNode instead of an HTMLAudioElement.
 */
(function () {
  let rotateAngle = 1.5; // π multiplier — same default as vue-audio-visual Circle.angle

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  /**
   * Idle / demo frequency data so the ring is visible before audio arrives.
   * Shape mimics a lively FFT buffer.
   */
  function synthFrequencyData(fftSize, clock, driven, pulse) {
    const n = Math.max(32, fftSize >> 1);
    const data = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const wave =
        0.45 +
        0.25 * Math.sin(clock * 1.7 + i * 0.11) +
        0.2 * Math.sin(clock * 2.9 + i * 0.27) +
        0.15 * Math.sin(clock * 0.6 + u * 12);
      const kick = pulse > 0.2 ? pulse * (0.5 + 0.5 * Math.sin(i * 0.4 + clock * 4)) : 0;
      const v = clamp(wave * (0.55 + driven * 0.7) + kick, 0, 1);
      data[i] = Math.round(v * 255);
    }
    return data;
  }

  function setBarColor(ctx, p) {
    const barColor = p.barColor;
    if (!Array.isArray(barColor)) {
      return barColor || "#5ec8ff";
    }
    // Gradient along the bar (rim → tip) so FX / random colors actually read
    const inner = Math.max(0, p.r * 0.9);
    const outer = Math.max(inner + 1, p.r + Math.max(8, p.barLen));
    const gradient = ctx.createRadialGradient(
      p.cx,
      p.cy,
      inner,
      p.cx,
      p.cy,
      outer
    );
    const n = Math.max(1, barColor.length);
    barColor.forEach((color, i) => {
      gradient.addColorStop(i / Math.max(1, n - 1), color);
    });
    return gradient;
  }

  function drawOutline(ctx, cx, cy, r, outlineWidth, outlineColor) {
    if (!outlineWidth) return;
    ctx.beginPath();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  /**
   * Exact av-circle bar loop from useAVCircle.draw()
   * @param {Uint8Array} data frequency bins
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} p circle props
   */
  function drawAvCircleBars(data, ctx, p) {
    const dataLen = data.length;
    const step = ((p.lineWidth + p.lineSpace) / dataLen) * (2 * Math.PI);

    ctx.clearRect(0, 0, p.canvWidth, p.canvHeight);
    if (p.canvFillColor) {
      ctx.fillStyle = p.canvFillColor;
      ctx.fillRect(0, 0, p.canvWidth, p.canvHeight);
    }

    drawOutline(ctx, p.cx, p.cy, p.r, p.outlineWidth, p.outlineColor);

    ctx.lineWidth = p.barWidth;
    ctx.strokeStyle = setBarColor(ctx, p);
    ctx.lineCap = "butt";

    let angle = p.angle;
    for (let i = 0; i < dataLen; i++) {
      angle += step;
      if (i % p.arcStep) continue;

      const bits = Math.round(
        data.slice(i, i + p.arcStep).reduce((v, t) => t + v, 0) / p.arcStep
      );
      const blen = p.r + (bits / 255.0) * p.barLen;

      ctx.beginPath();
      ctx.moveTo(p.r * Math.cos(angle) + p.cx, p.r * Math.sin(angle) + p.cy);
      ctx.lineTo(blen * Math.cos(angle) + p.cx, blen * Math.sin(angle) + p.cy);
      ctx.stroke();
    }
  }

  let clock = 0;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ width: number, height: number }} hostSize
   * @param {object} tune
   * @param {Uint8Array | null} freqData raw analyser frequency data (optional)
   */
  function draw(canvas, hostSize, tune = {}, freqData = null) {
    if (!canvas) return;

    const hostW = Math.max(64, hostSize.width || 240);
    const hostH = Math.max(64, hostSize.height || 240);

    const intensity = clamp(tune.intensity ?? 1, 0.25, 1);
    const motion = clamp(tune.motion ?? 1, 0.25, 2);
    const size = clamp(tune.size ?? 1, 0.5, 1.8);
    const punch = clamp(tune.punch ?? 1, 0.2, 3);
    const detail = Math.round(clamp(tune.detail ?? 5, 2, 8));
    const level = clamp(tune.level ?? 0.35, 0, 1);
    const pulse = clamp(tune.pulse ?? 0, 0, 1);
    // Bar size / thickness / spacing are 0–100 from settings
    const asPct = (v, fallback) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback / 100;
      return clamp(n, 0, 100) / 100;
    };
    const sizePct = asPct(tune.barSize, 45);
    const thickPct = asPct(tune.barLength, 40);
    const spacePct = asPct(tune.barSpacing ?? tune.barGap, 35);
    const barDistance = clamp(tune.barDistance ?? 0, -0.35, 0.45);
    const barRotation = clamp(tune.barRotation ?? 1, 0, 3);
    const rotateGraph = tune.rotateGraph !== false && barRotation > 0.01;

    const baseR = (Math.min(hostW, hostH) / 2) * 0.985;
    const r = Math.max(8, baseR * (1 + barDistance));
    // Bar size 0–100 → bloom length (100 ≈ half the map radius)
    const bloom =
      Math.min(hostW, hostH) *
      (0.02 + sizePct * 0.52) *
      (0.85 + motion * 0.2) *
      (0.75 + intensity * 0.35) *
      (0.85 + punch * 0.2);
    const rimExtra = Math.max(0, r - baseR);
    const pad = Math.ceil(bloom + rimExtra + 10);
    const cssW = hostW + pad * 2;
    const cssH = hostH + pad * 2;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.max(1, Math.round(cssW * dpr));
    const ph = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    clock += 0.016 * (0.6 + motion * 0.9);

    // Match Circle class getters from vue-audio-visual
    const canvWidth = cssW;
    const canvHeight = cssH;
    const cx = canvWidth / 2;
    const cy = canvHeight / 2;
    // Thickness 0–100
    const lineWidth = 0.45 + thickPct * 5.5 * (0.85 + size * 0.2);
    // Spacing 0–100 = distance between bars (line gap + skip step)
    const lineSpace = 0.12 + spacePct * 7.5;
    const arcStep = Math.max(
      1,
      Math.round(1 + spacePct * 14 + (8 - detail) * 0.35)
    );
    const barLen = Math.max(2, bloom);
    const barWidth = Math.max(0.6, lineWidth * (0.9 + size * 0.15));

    // Prefer live FX colors (random gradient / solid); neon fallback
    const barColor = Array.isArray(tune.barColor)
      ? tune.barColor
      : typeof tune.barColor === "string" && tune.barColor
        ? [tune.barColor]
        : ["#7CFFB2", "#3CE7FF", "#4A6BFF", "#B03CFF", "#FF3CB0", "#FFFFFF"];

    if (rotateGraph) {
      const spin = 0.001 * barRotation * (0.55 + motion * 0.65);
      rotateAngle = rotateAngle >= 3.5 ? 1.5 : rotateAngle + spin;
    }

    const p = {
      canvWidth,
      canvHeight,
      canvFillColor: null,
      cx,
      cy,
      r,
      lineWidth,
      lineSpace,
      arcStep,
      barWidth,
      barLen,
      barColor,
      outlineWidth: 0,
      outlineColor: "transparent",
      angle: Math.PI * rotateAngle,
    };

    let data = freqData;
    if (!data || !data.length) {
      data = synthFrequencyData(1024, clock, level, pulse);
    } else {
      // Boost with beat punch so desktop audio reads clearly
      const boosted = new Uint8Array(data.length);
      const gain = 0.75 + level * 0.55 + pulse * 0.45 * punch;
      for (let i = 0; i < data.length; i++) {
        boosted[i] = Math.min(255, Math.round(data[i] * gain * intensity));
      }
      data = boosted;
    }

    drawAvCircleBars(data, ctx, p);
  }

  function clear(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
  }

  function reset() {
    rotateAngle = 1.5;
    clock = 0;
  }

  // Keep API compatible with previous spectrum module + beat.js
  function updateFromFrequencyData() {
    /* frequency buffer is passed directly to draw() via beat.js */
  }

  window.IsleBorderFxSpectrum = {
    draw,
    clear,
    reset,
    updateFromFrequencyData,
    /** @deprecated alias — av-circle style */
    drawAvCircle: draw,
  };
})();
