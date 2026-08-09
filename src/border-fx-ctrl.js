/**
 * Apply border-effect tuning (spawn count / speed / intensity / size)
 * to an FX host (#radar-border-fx or #preview-border-fx).
 */
(function () {
  const MAX_COUNT = 66;
  const SPAWN_SEL =
    ".bfx-bolt, .bfx-flame, .bfx-crystal, .bfx-dino-orbit, .bfx-sat, .bfx-spark, .bfx-drip, .bfx-plume";

  /** @type {WeakMap<Element, { timer: any, opts: object }>} */
  const hostState = new WeakMap();

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
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
    host.style.setProperty("--fx-color", color.toLowerCase());
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
    const st = hostState.get(host) || { timer: null, opts };
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
    const st = hostState.get(host) || { timer: null, opts };
    st.opts = opts;
    hostState.set(host, st);
    scheduleReshuffle(host, opts);
    syncDragon(host, opts, false);
  }

  function fromSettings(s = {}) {
    return {
      effect: s.borderEffect || "none",
      count: s.borderEffectCount,
      speed: s.borderEffectSpeed,
      intensity: s.borderEffectIntensity,
      size: s.borderEffectSize,
      distance: s.borderEffectDistance,
      dinoSpecies: s.borderEffectDinoSpecies,
      orientation: s.borderEffectOrientation,
      color: s.borderEffectColor,
      randomSpawn: s.borderEffectRandomSpawn !== false,
    };
  }

  window.IsleBorderFx = { apply, fromSettings, MAX_COUNT };
})();
