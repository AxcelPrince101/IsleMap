/**
 * Apply border-effect tuning (spawn count / speed / intensity / size)
 * to an FX host (#radar-border-fx or #preview-border-fx).
 */
(function () {
  const MAX_COUNT = 66;
  const SPAWN_SEL =
    ".bfx-bolt, .bfx-flame, .bfx-crystal, .bfx-dino-orbit, .bfx-sat, .bfx-spark, .bfx-drip, .bfx-plume";

  /** @type {WeakMap<Element, { timer: any, gradRaf: any, opts: object, grad: object|null }>} */
  const hostState = new WeakMap();

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function hslToHex(h, s, l) {
    const hh = ((h % 360) + 360) % 360;
    const ss = clamp(s, 0, 1);
    const ll = clamp(l, 0, 1);
    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = ll - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (hh < 60) {
      r = c;
      g = x;
    } else if (hh < 120) {
      r = x;
      g = c;
    } else if (hh < 180) {
      g = c;
      b = x;
    } else if (hh < 240) {
      g = x;
      b = c;
    } else if (hh < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const to = (v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpHue(a, b, t) {
    let d = ((b - a + 540) % 360) - 180;
    return (a + d * t + 360) % 360;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /** Vibrant neon stops — avoid muddy yellow/olive blobs on dark UI */
  const NEON_HUES = Object.freeze([
    195, 210, 225, 260, 285, 310, 330, 350, 15, 35, 160, 175,
  ]);

  function randomStop(prevHue) {
    let h;
    if (prevHue == null) {
      h = NEON_HUES[Math.floor(Math.random() * NEON_HUES.length)];
      h = (h + rand(-12, 12) + 360) % 360;
    } else {
      // Jump to a complementary / distant neon, not a muddy neighbor
      const candidates = NEON_HUES.map((n) => {
        let d = Math.abs(n - prevHue) % 360;
        if (d > 180) d = 360 - d;
        return { n, d };
      }).filter((c) => c.d >= 55);
      const pick =
        candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] ||
        { n: (prevHue + 140) % 360 };
      h = (pick.n + rand(-10, 10) + 360) % 360;
    }
    return {
      h,
      s: rand(0.78, 0.98),
      l: rand(0.52, 0.64),
    };
  }

  function ensureSpawnCount(parent, template, count) {
    while (parent.children.length < count) {
      const clone = template.cloneNode(true);
      clone.classList.add("bfx-spawn-clone");
      parent.appendChild(clone);
    }
  }

  function layoutSpawn(el, i, count, randomSpawn) {
    let angle;
    let delay;
    let durJitter;
    if (randomSpawn) {
      angle = Math.random() * 360;
      delay = Math.random() * 1.6;
      durJitter = rand(0.75, 1.35);
    } else {
      const t = count > 0 ? i / count : 0;
      angle = t * 360;
      delay = (t * 1.4) % 1.4;
      durJitter = 0.85 + (i % 5) * 0.08;
    }

    el.style.setProperty("--r", `${angle.toFixed(2)}deg`);
    el.style.setProperty("--phase", `${angle.toFixed(2)}deg`);
    el.style.setProperty(
      "--tilt",
      `${(randomSpawn ? rand(-14, 14) : ((i % 7) - 3) * 3).toFixed(1)}deg`
    );
    el.style.setProperty("--delay", `${delay.toFixed(3)}s`);
    el.style.setProperty("--ddelay", `${delay.toFixed(3)}s`);
    el.style.setProperty("--pdelay", `${(delay * 0.85).toFixed(3)}s`);
    el.style.setProperty("--dur", `${(0.5 * durJitter).toFixed(2)}s`);
    el.style.setProperty("--odur", `${(3.6 * durJitter).toFixed(2)}s`);
    el.style.setProperty("--sdur", `${(2.6 * durJitter).toFixed(2)}s`);
    el.style.setProperty("--ddur", `${(1.8 * durJitter).toFixed(2)}s`);
    el.style.setProperty("--pdur", `${(4.2 * durJitter).toFixed(2)}s`);

    if (el.classList.contains("bfx-flame")) {
      const fw = randomSpawn ? rand(8, 14) : 9 + (i % 5);
      const fh = randomSpawn ? rand(12, 18) : 13 + (i % 5);
      el.style.setProperty("--fw", `${fw.toFixed(1)}%`);
      el.style.setProperty("--fh", `${fh.toFixed(1)}%`);
      el.style.setProperty("--dur", `${(0.52 * durJitter).toFixed(2)}s`);
    }
    if (el.classList.contains("bfx-crystal")) {
      el.style.setProperty(
        "--cw",
        `${(randomSpawn ? rand(4.5, 7) : 5 + (i % 3) * 0.5).toFixed(1)}%`
      );
      el.style.setProperty(
        "--ch",
        `${(randomSpawn ? rand(8, 13) : 9 + (i % 4)).toFixed(1)}%`
      );
      el.style.setProperty("--dur", `${(2.3 * durJitter).toFixed(2)}s`);
    }
    if (el.classList.contains("bfx-dino-orbit")) {
      el.style.setProperty("--dur", `${(5.2 * durJitter).toFixed(2)}s`);
    }
    if (el.classList.contains("bfx-bolt")) {
      el.style.setProperty("--dur", `${(2.4 * durJitter).toFixed(2)}s`);
    }
  }

  function applySolidColor(host, color) {
    const c = color.toLowerCase();
    host.style.setProperty("--fx-color", c);
    host.style.setProperty("--fx-color-b", c);
    host.style.setProperty("--fx-grad-angle", "0deg");
    // Radar / ring are siblings of the FX host — push color to shell/preview
    const shellEl = document.getElementById("shell");
    const preview = document.getElementById("preview-radar");
    for (const el of [shellEl, preview].filter(Boolean)) {
      el.style.setProperty("--fx-color", c);
      el.style.setProperty("--fx-color-b", c);
      el.style.setProperty("--fx-legend-a", c);
      el.style.setProperty("--fx-legend-b", c);
    }
  }

  function paintGradient(host, a, b, angle, opts) {
    const c1 = hslToHex(a.h, a.s, a.l);
    const c2 = hslToHex(b.h, b.s, b.l);
    host.style.setProperty("--fx-color", c1);
    host.style.setProperty("--fx-color-b", c2);
    host.style.setProperty("--fx-grad-angle", `${angle.toFixed(1)}deg`);
    const shellEl = document.getElementById("shell");
    const preview = document.getElementById("preview-radar");
    for (const el of [shellEl, preview].filter(Boolean)) {
      el.style.setProperty("--fx-color", c1);
      el.style.setProperty("--fx-color-b", c2);
      el.style.setProperty("--fx-grad-angle", `${angle.toFixed(1)}deg`);
      el.style.setProperty("--fx-legend-a", c1);
      el.style.setProperty("--fx-legend-b", c2);
    }
    if (opts) opts.color = c1;
  }

  function stopGradient(host) {
    const st = hostState.get(host);
    if (st?.gradRaf) {
      cancelAnimationFrame(st.gradRaf);
      st.gradRaf = null;
    }
    if (st) st.grad = null;
    host.classList.remove("fx-random-gradient");
    host.removeAttribute("data-fx-color-mode");
    // Keep solid effect color; clear legend-only vars when leaving cycle
    const shellEl = document.getElementById("shell");
    const preview = document.getElementById("preview-radar");
    for (const el of [shellEl, preview].filter(Boolean)) {
      if (!el.classList.contains("beat-legend-gradient")) {
        el.style.removeProperty("--fx-legend-a");
        el.style.removeProperty("--fx-legend-b");
      }
    }
  }

  function startGradient(host, opts) {
    const st = hostState.get(host) || { timer: null, gradRaf: null, opts, grad: null };
    if (st.gradRaf) {
      cancelAnimationFrame(st.gradRaf);
      st.gradRaf = null;
    }

    host.classList.add("fx-random-gradient");
    host.dataset.fxColorMode = "random";
    // Color cycling only — no wash overlay

    const fromA = randomStop();
    const fromB = randomStop(fromA.h);
    const toA = randomStop(fromA.h);
    const toB = randomStop(fromB.h);
    const speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    const grad = {
      fromA,
      fromB,
      toA,
      toB,
      t0: performance.now(),
      dur: Math.max(1800, 4200 / speed),
      angle: Math.random() * 360,
      angleVel: rand(12, 28) * (Math.random() > 0.5 ? 1 : -1) * speed,
    };
    st.grad = grad;
    st.opts = opts;
    hostState.set(host, st);
    paintGradient(host, fromA, fromB, grad.angle, opts);

    const tick = (now) => {
      const latest = hostState.get(host);
      if (!latest || !host.isConnected || !latest.grad) return;
      if (!latest.opts?.randomGradient || latest.opts.effect === "none") {
        stopGradient(host);
        return;
      }
      const g = latest.grad;
      const spd = clamp(latest.opts.speed ?? 1, 0.35, 2.5);
      g.dur = Math.max(1800, 4200 / spd);
      g.angleVel = Math.sign(g.angleVel || 1) * rand(12, 28) * spd * 0.02 + g.angleVel * 0.98;
      const u = easeInOut(clamp((now - g.t0) / g.dur, 0, 1));
      const a = {
        h: lerpHue(g.fromA.h, g.toA.h, u),
        s: lerp(g.fromA.s, g.toA.s, u),
        l: lerp(g.fromA.l, g.toA.l, u),
      };
      const b = {
        h: lerpHue(g.fromB.h, g.toB.h, u),
        s: lerp(g.fromB.s, g.toB.s, u),
        l: lerp(g.fromB.l, g.toB.l, u),
      };
      g.angle = (g.angle + g.angleVel * 0.016 * 60) % 360;
      paintGradient(host, a, b, g.angle, latest.opts);

      if (u >= 1) {
        g.fromA = g.toA;
        g.fromB = g.toB;
        g.toA = randomStop(g.fromA.h);
        g.toB = randomStop(g.fromB.h);
        g.t0 = now;
        g.dur = Math.max(1800, 4200 / spd) * rand(0.85, 1.25);
        g.angleVel = rand(12, 28) * (Math.random() > 0.5 ? 1 : -1) * spd;
      }
      latest.gradRaf = requestAnimationFrame(tick);
    };
    st.gradRaf = requestAnimationFrame(tick);
  }

  function syncGradient(host, opts) {
    const on =
      opts.effect &&
      opts.effect !== "none" &&
      (Boolean(opts.randomGradient) || Boolean(opts.legendGradient));
    const shellEl = document.getElementById("shell");
    const preview = document.getElementById("preview-radar");
    for (const el of [shellEl, preview].filter(Boolean)) {
      el.classList.toggle("beat-legend-gradient", Boolean(opts.legendGradient));
    }
    if (!on) {
      stopGradient(host);
      return;
    }
    const st = hostState.get(host);
    if (st?.gradRaf) {
      // keep running; opts already updated
      return;
    }
    startGradient(host, opts);
  }

  function layoutHost(host, opts) {
    const count = Math.round(clamp(opts.count ?? 8, 1, MAX_COUNT));
    const speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    const intensity = clamp(opts.intensity ?? 1, 0.25, 1);
    const size = clamp(opts.size ?? 1, 0.5, 1.8);
    const randomSpawn = opts.randomSpawn !== false;
    let color = String(opts.color || "").trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = "#5ec8ff";

    host.style.setProperty("--fx-speed", String(speed));
    host.style.setProperty("--fx-intensity", String(intensity));
    host.style.setProperty("--fx-scale", String(size));
    if (!opts.randomGradient && !opts.legendGradient) {
      applySolidColor(host, color);
    }
    host.style.opacity = String(intensity);

    const groups = new Map();
    host.querySelectorAll(SPAWN_SEL).forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    for (const [parent, kids] of groups.entries()) {
      if (!kids.length) continue;
      const template = kids[0];
      ensureSpawnCount(parent, template, count);
      const all = Array.from(parent.children).filter((el) =>
        el.matches(SPAWN_SEL)
      );
      all.forEach((el, i) => {
        layoutSpawn(el, i, count, randomSpawn);
        el.classList.toggle("bfx-spawn-off", i >= count);
      });
    }
  }

  function clearReshuffle(host) {
    const st = hostState.get(host);
    if (st?.timer) {
      clearTimeout(st.timer);
      st.timer = null;
    }
  }

  function syncDragon(host, opts, reseed) {
    if (typeof window.IsleBorderFxDragon?.sync !== "function") return;
    window.IsleBorderFxDragon.sync(host, { ...opts, _reseed: Boolean(reseed) });
  }

  function scheduleReshuffle(host, opts) {
    clearReshuffle(host);
    if (opts.randomSpawn === false) return;
    const speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    const wait = Math.max(700, (2600 / speed) * (0.7 + Math.random() * 0.8));
    const st = hostState.get(host) || {
      timer: null,
      gradRaf: null,
      opts,
      grad: null,
    };
    st.opts = opts;
    st.timer = setTimeout(() => {
      const latest = hostState.get(host);
      if (!latest || !host.isConnected) return;
      layoutHost(host, latest.opts);
      if (
        latest.opts.effect === "dragon" ||
        latest.opts.effect === "dinosaur"
      ) {
        syncDragon(host, latest.opts, true);
      }
      scheduleReshuffle(host, latest.opts);
    }, wait);
    hostState.set(host, st);
  }

  function apply(host, opts = {}) {
    if (!host) return;
    layoutHost(host, opts);
    const st = hostState.get(host) || {
      timer: null,
      gradRaf: null,
      opts,
      grad: null,
    };
    st.opts = opts;
    hostState.set(host, st);
    scheduleReshuffle(host, opts);
    syncGradient(host, opts);
    syncDragon(host, opts, false);
  }

  function fromSettings(s = {}) {
    const effect = s.borderEffect || "none";
    return {
      effect,
      count: s.borderEffectCount,
      speed: s.borderEffectSpeed,
      intensity: s.borderEffectIntensity,
      size: s.borderEffectSize,
      distance: s.borderEffectDistance,
      dinoSpecies: s.borderEffectDinoSpecies,
      orientation: s.borderEffectOrientation,
      color: s.borderEffectColor,
      randomSpawn: s.borderEffectRandomSpawn !== false,
      randomGradient: Boolean(s.borderEffectRandomGradient),
      legendGradient:
        effect === "beat" && Boolean(s.borderEffectBeatLegendGradient),
    };
  }

  window.IsleBorderFx = { apply, fromSettings, MAX_COUNT };
})();
