/**
 * Procedural rim-FX audio (Web Audio). No asset files required.
 */
(function () {
  let ctx = null;
  let master = null;
  let bus = null;
  let timer = null;
  let state = {
    effect: "none",
    enabled: false,
    volume: 0.3,
    speed: 1,
    intensity: 1,
    duck: 1,
  };

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    master.connect(ctx.destination);
    return ctx;
  }

  async function resume() {
    const c = ensureCtx();
    if (!c) return null;
    if (c.state === "suspended") {
      try {
        await c.resume();
      } catch (_) {}
    }
    return c;
  }

  function stopTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function noiseBuffer(seconds) {
    const c = ensureCtx();
    const len = Math.max(1, Math.floor(c.sampleRate * seconds));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function envGain(start, attack, hold, release, peak) {
    const g = ctx.createGain();
    const t0 = start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t0 + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
    return g;
  }

  function playNoiseBurst(opts = {}) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + (opts.when || 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(opts.dur || 0.25);
    const filter = c.createBiquadFilter();
    filter.type = opts.filterType || "bandpass";
    filter.frequency.value = opts.freq || 1200;
    filter.Q.value = opts.q || 1.2;
    const g = envGain(
      now,
      opts.attack ?? 0.005,
      opts.hold ?? 0.02,
      opts.release ?? 0.12,
      opts.gain ?? 0.2
    );
    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(now);
    src.stop(now + (opts.dur || 0.25) + 0.05);
  }

  function playTone(opts = {}) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + (opts.when || 0);
    const osc = c.createOscillator();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq || 440, now);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.freqEnd),
        now + (opts.dur || 0.2)
      );
    }
    const g = envGain(
      now,
      opts.attack ?? 0.01,
      opts.hold ?? 0.04,
      opts.release ?? 0.15,
      opts.gain ?? 0.12
    );
    osc.connect(g);
    g.connect(bus);
    osc.start(now);
    osc.stop(now + (opts.dur || 0.2) + 0.05);
  }

  function scheduleNext(fn, baseMs) {
    stopTimer();
    const speed = clamp(state.speed, 0.35, 2.5);
    const wait = Math.max(40, (baseMs / speed) * (0.55 + Math.random() * 0.9));
    timer = setTimeout(() => {
      if (!state.enabled || state.effect === "none") return;
      try {
        fn();
      } catch (_) {}
      scheduleNext(fn, baseMs);
    }, wait);
  }

  const PATTERNS = {
    lightning() {
      playNoiseBurst({
        dur: 0.18,
        freq: 1800 + Math.random() * 2200,
        q: 0.7,
        gain: 0.28 * state.intensity,
        release: 0.2,
      });
      if (Math.random() > 0.45) {
        playNoiseBurst({
          when: 0.04 + Math.random() * 0.08,
          dur: 0.1,
          freq: 900 + Math.random() * 900,
          gain: 0.16 * state.intensity,
        });
      }
      scheduleNext(PATTERNS.lightning, 900);
    },
    fire() {
      playNoiseBurst({
        dur: 0.35,
        filterType: "lowpass",
        freq: 280 + Math.random() * 420,
        q: 0.6,
        gain: 0.14 * state.intensity,
        attack: 0.02,
        hold: 0.08,
        release: 0.22,
      });
      if (Math.random() > 0.5) {
        playNoiseBurst({
          dur: 0.12,
          freq: 1600 + Math.random() * 1200,
          q: 2,
          gain: 0.08 * state.intensity,
        });
      }
      scheduleNext(PATTERNS.fire, 220);
    },
    frost() {
      playNoiseBurst({
        dur: 0.4,
        filterType: "highpass",
        freq: 2400 + Math.random() * 1800,
        q: 0.8,
        gain: 0.1 * state.intensity,
        attack: 0.04,
        release: 0.3,
      });
      playTone({
        type: "triangle",
        freq: 1400 + Math.random() * 900,
        freqEnd: 900 + Math.random() * 400,
        dur: 0.35,
        gain: 0.05 * state.intensity,
        attack: 0.03,
        release: 0.25,
      });
      scheduleNext(PATTERNS.frost, 480);
    },
    plasma() {
      playTone({
        type: "sawtooth",
        freq: 90 + Math.random() * 40,
        dur: 0.28,
        gain: 0.05 * state.intensity,
        attack: 0.04,
        hold: 0.1,
        release: 0.14,
      });
      playNoiseBurst({
        dur: 0.22,
        filterType: "bandpass",
        freq: 600 + Math.random() * 500,
        q: 4,
        gain: 0.08 * state.intensity,
      });
      scheduleNext(PATTERNS.plasma, 320);
    },
    dino() {
      playTone({
        type: "triangle",
        freq: 120 + Math.random() * 40,
        freqEnd: 70,
        dur: 0.12,
        gain: 0.1 * state.intensity,
        attack: 0.005,
        release: 0.08,
      });
      if (Math.random() > 0.65) {
        playTone({
          type: "square",
          freq: 420 + Math.random() * 80,
          freqEnd: 280,
          dur: 0.08,
          gain: 0.035 * state.intensity,
        });
      }
      scheduleNext(PATTERNS.dino, 380);
    },
    dinosaur() {
      playTone({
        type: "triangle",
        freq: 95 + Math.random() * 30,
        freqEnd: 55,
        dur: 0.14,
        gain: 0.11 * state.intensity,
        attack: 0.005,
        release: 0.1,
      });
      playNoiseBurst({
        dur: 0.1,
        filterType: "lowpass",
        freq: 220,
        gain: 0.07 * state.intensity,
      });
      scheduleNext(PATTERNS.dinosaur, 340);
    },
    dragon() {
      playTone({
        type: "sawtooth",
        freq: 85 + Math.random() * 25,
        freqEnd: 45,
        dur: 0.28,
        gain: 0.12 * state.intensity,
        attack: 0.02,
        hold: 0.06,
        release: 0.18,
      });
      playNoiseBurst({
        dur: 0.2,
        filterType: "bandpass",
        freq: 320 + Math.random() * 180,
        q: 1.2,
        gain: 0.08 * state.intensity,
      });
      if (Math.random() > 0.7) {
        playTone({
          type: "triangle",
          freq: 520 + Math.random() * 120,
          freqEnd: 180,
          dur: 0.16,
          gain: 0.05 * state.intensity,
        });
      }
      scheduleNext(PATTERNS.dragon, 520);
    },
    orbit() {
      playTone({
        type: "sine",
        freq: 660 + Math.random() * 220,
        dur: 0.09,
        gain: 0.07 * state.intensity,
        attack: 0.005,
        release: 0.07,
      });
      scheduleNext(PATTERNS.orbit, 420);
    },
    pulse() {
      playTone({
        type: "sine",
        freq: 70,
        freqEnd: 42,
        dur: 0.22,
        gain: 0.16 * state.intensity,
        attack: 0.01,
        hold: 0.04,
        release: 0.16,
      });
      playNoiseBurst({
        dur: 0.16,
        filterType: "lowpass",
        freq: 180,
        gain: 0.1 * state.intensity,
      });
      scheduleNext(PATTERNS.pulse, 700);
    },
    spark() {
      playNoiseBurst({
        dur: 0.06,
        freq: 3200 + Math.random() * 2400,
        q: 3,
        gain: 0.14 * state.intensity,
        attack: 0.001,
        hold: 0.01,
        release: 0.05,
      });
      scheduleNext(PATTERNS.spark, 160);
    },
    toxic() {
      playTone({
        type: "sine",
        freq: 180 + Math.random() * 60,
        freqEnd: 90,
        dur: 0.18,
        gain: 0.08 * state.intensity,
        attack: 0.02,
        release: 0.12,
      });
      playNoiseBurst({
        dur: 0.14,
        filterType: "bandpass",
        freq: 400 + Math.random() * 200,
        q: 1.5,
        gain: 0.07 * state.intensity,
      });
      scheduleNext(PATTERNS.toxic, 360);
    },
    smoke() {
      playNoiseBurst({
        dur: 0.55,
        filterType: "lowpass",
        freq: 160 + Math.random() * 120,
        q: 0.5,
        gain: 0.09 * state.intensity,
        attack: 0.08,
        hold: 0.12,
        release: 0.35,
      });
      scheduleNext(PATTERNS.smoke, 520);
    },
  };

  function applyMasterGain() {
    if (!master || !ctx) return;
    const on = state.enabled && state.effect !== "none" && PATTERNS[state.effect];
    const target = on
      ? clamp(state.volume, 0, 1) * clamp(state.duck, 0, 1) * 0.85
      : 0;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(target, now, 0.05);
  }

  function startPattern() {
    stopTimer();
    const fn = PATTERNS[state.effect];
    if (!state.enabled || !fn) {
      applyMasterGain();
      return;
    }
    applyMasterGain();
    fn();
  }

  async function sync(opts = {}) {
    state.effect = String(opts.effect || "none");
    state.enabled = Boolean(opts.enabled);
    state.volume = clamp(opts.volume ?? 0.3, 0, 1);
    state.speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    state.intensity = clamp(opts.intensity ?? 1, 0.25, 1);
    state.duck = clamp(opts.duck ?? 1, 0, 1);

    if (!state.enabled || state.effect === "none" || !PATTERNS[state.effect]) {
      stopTimer();
      applyMasterGain();
      return;
    }

    await resume();
    startPattern();
  }

  function fromSettings(s = {}, extra = {}) {
    return {
      effect: s.borderEffect || "none",
      enabled: Boolean(s.borderEffectSound),
      volume: s.borderEffectSoundVolume,
      speed: s.borderEffectSpeed,
      intensity: s.borderEffectIntensity,
      duck: extra.duck ?? 1,
    };
  }

  function unlock() {
    resume();
  }

  window.IsleBorderFxAudio = { sync, fromSettings, unlock };
})();
