/**
 * Desktop-audio beat pulse for border FX (`borderEffect: "beat"`).
 * Also accepts an attached MediaStream (e.g. while screen recording).
 *
 * Uses adaptive gain + onset punch so loud / full-volume audio still
 * keeps pulsing instead of freezing at max.
 */
(function () {
  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AnalyserNode | null} */
  let analyser = null;
  /** @type {MediaStream | null} */
  let ownedStream = null;
  /** @type {number | null} */
  let raf = null;
  let wantBeat = false;
  let attached = false;
  let starting = false;
  /** Pause self-capture while screen recording needs the desktop capturer */
  let suspendedForRecording = false;
  /** Bumps to cancel in-flight tiny desktop captures */
  let captureGen = 0;
  /** @type {WeakSet<Element>} */
  const hosts = new WeakSet();

  let env = 0;
  let display = 0;
  let agcGain = 1.6;
  let peakHold = 0.2;
  /** @type {Float32Array | null} */
  let prevSpectrum = null;

  /** Dedicated paint loop so scanline stays alive even without analyser ticks */
  let visualRaf = null;
  let lastVisualLevel = 0;
  let lastVisualPulse = 0;
  /** @type {Uint8Array | null} */
  let lastFreq = null;

  /** @type {object} */
  let opts = {
    intensity: 1,
    speed: 1,
    size: 1,
    color: "#5ec8ff",
    sensitivity: 1,
    punch: 1,
    smooth: 0.45,
    bass: 0.7,
    motion: 1,
    rings: 5,
    style: "scanline",
    barSize: 45,
    barLength: 40,
    barDistance: 0,
    barSpacing: 35,
    barRotation: 1,
    randomGradient: false,
  };

  function resolveBarColors(parent) {
    const root =
      parent?.closest?.("#shell, #preview-radar") ||
      document.getElementById("shell") ||
      document.getElementById("preview-radar") ||
      parent;
    let a = String(opts.color || "#5ec8ff").trim();
    let b = a;
    if (root) {
      const cs = getComputedStyle(root);
      const ca = cs.getPropertyValue("--fx-color").trim();
      const cb = cs.getPropertyValue("--fx-color-b").trim();
      if (ca) a = ca;
      if (cb) b = cb;
      else b = a;
    }
    if (opts.randomGradient) {
      return [a, b, a, "#ffffff"];
    }
    // Soft radial falloff from the solid effect color
    return [a, a, "#ffffff"];
  }

  function shell() {
    return document.getElementById("shell");
  }

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function getSourceApi() {
    return (
      window.isleOverlay?.getRecordingSource ||
      window.isleDashboard?.getRecordingSource ||
      null
    );
  }

  function pushTuneVars() {
    const motion = clamp(opts.motion ?? 1, 0.25, 2);
    const punch = clamp(opts.punch ?? 1, 0.2, 3);
    const size = clamp(opts.size ?? 1, 0.5, 1.8);
    const intensity = clamp(opts.intensity ?? 1, 0.25, 1);
    const root = shell();
    const preview = document.getElementById("preview-radar");
    for (const el of [root, preview].filter(Boolean)) {
      el.style.setProperty("--fx-beat-motion", motion.toFixed(3));
      el.style.setProperty("--fx-beat-punch", punch.toFixed(3));
      el.style.setProperty("--fx-beat-size", size.toFixed(3));
      el.style.setProperty("--fx-beat-intensity", intensity.toFixed(3));
    }
    document.querySelectorAll(".bfx-beat").forEach((el) => {
      el.style.setProperty("--fx-beat-motion", motion.toFixed(3));
      el.style.setProperty("--fx-beat-punch", punch.toFixed(3));
      el.style.setProperty("--fx-beat-size", size.toFixed(3));
      el.style.setProperty("--fx-beat-intensity", intensity.toFixed(3));
    });
  }

  function beatStyle() {
    return opts.style === "rings" ? "rings" : "scanline";
  }

  /** Mount spectrum on the radar itself so it can’t sit under clipped FX layers */
  function spectrumParents() {
    return [
      document.getElementById("radar"),
      document.getElementById("preview-radar"),
    ].filter(Boolean);
  }

  function ensureSpectrumCanvas(parent) {
    let canvas = parent.querySelector(":scope > canvas.bfx-beat-spectrum");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "bfx-beat-spectrum";
      canvas.setAttribute("aria-hidden", "true");
      parent.appendChild(canvas);
    }
    return canvas;
  }

  function applyBeatLook(host, style, ringCount) {
    const scanline = style === "scanline";
    host.classList.toggle("bfx-beat--scanline", scanline);
    host.classList.toggle("bfx-beat--rings", !scanline);
    host.setAttribute("data-beat-look", style);
    host.dataset.rings = String(ringCount);
    const rings = Array.from(host.querySelectorAll(":scope > i"));
    while (rings.length < 8) {
      const iEl = document.createElement("i");
      host.appendChild(iEl);
      rings.push(iEl);
    }
    rings.forEach((el, i) => {
      el.style.setProperty("--i", String(i));
      const off = scanline || i >= ringCount;
      el.hidden = off;
      el.classList.toggle("is-off", off);
    });
  }

  function ensureRings(count) {
    const n = Math.round(clamp(count ?? 5, 2, 8));
    const style = beatStyle();
    document.querySelectorAll(".bfx-beat").forEach((host) => {
      applyBeatLook(host, style, n);
    });
    spectrumParents().forEach((parent) => {
      const canvas = ensureSpectrumCanvas(parent);
      if (style === "scanline") {
        canvas.removeAttribute("hidden");
      } else {
        window.IsleBorderFxSpectrum?.clear?.(canvas);
        canvas.setAttribute("hidden", "");
      }
    });
  }

  function stopVisualLoop() {
    if (visualRaf) {
      cancelAnimationFrame(visualRaf);
      visualRaf = null;
    }
  }

  function startVisualLoop() {
    if (visualRaf) return;
    const tick = () => {
      visualRaf = null;
      if (!wantBeat || beatStyle() !== "scanline") return;
      drawSpectrumHosts(lastVisualLevel, lastVisualPulse);
      visualRaf = requestAnimationFrame(tick);
    };
    visualRaf = requestAnimationFrame(tick);
  }

  function drawSpectrumHosts(level, pulse) {
    const spec = window.IsleBorderFxSpectrum;
    if (!spec?.draw) return;
    if (beatStyle() !== "scanline") {
      spectrumParents().forEach((p) => {
        const c = p.querySelector(":scope > canvas.bfx-beat-spectrum");
        if (c) spec.clear(c);
      });
      return;
    }
    spectrumParents().forEach((parent) => {
      const canvas = ensureSpectrumCanvas(parent);
      const rect = parent.getBoundingClientRect();
      const tune = {
        intensity: opts.intensity,
        motion: opts.motion,
        size: opts.size,
        punch: opts.punch,
        detail: opts.rings,
        level,
        pulse,
        barSize: opts.barSize,
        barLength: opts.barLength,
        barDistance: opts.barDistance,
        barSpacing: opts.barSpacing,
        barRotation: opts.barRotation,
        barColor: resolveBarColors(parent),
        rotateGraph: true,
      };
      spec.draw(
        canvas,
        {
          width: rect.width || parent.clientWidth || 240,
          height: rect.height || parent.clientHeight || 240,
        },
        tune,
        lastFreq
      );
    });
  }

  function applyLevel(level, pulse) {
    const intensity = clamp(opts.intensity ?? 1, 0.25, 1);
    const motion = clamp(opts.motion ?? 1, 0.25, 2);
    const punchAmt = clamp(opts.punch ?? 1, 0.2, 3);
    // Settings scale the visual response so sliders clearly change the look
    const shaped = Math.min(0.95, level * (0.55 + motion * 0.55));
    const punchVis = Math.min(1, pulse * (0.45 + punchAmt * 0.55) * (0.7 + motion * 0.3));
    const combined = Math.min(1, shaped * 0.5 + punchVis * 0.75);

    const root = shell();
    const preview = document.getElementById("preview-radar");
    const targets = [root, preview].filter(Boolean);
    for (const el of targets) {
      el.style.setProperty("--rec-audio-level", combined.toFixed(3));
      el.style.setProperty("--fx-beat-level", combined.toFixed(3));
      el.style.setProperty("--fx-beat-pulse", punchVis.toFixed(3));
      el.classList.toggle("is-audio-hot", combined > 0.12 || punchVis > 0.18);
      if (wantBeat || attached) el.classList.add("has-desktop-audio");
    }
    document.querySelectorAll(".bfx-beat").forEach((el) => {
      el.style.setProperty("--fx-beat-level", combined.toFixed(3));
      el.style.setProperty("--fx-beat-pulse", punchVis.toFixed(3));
    });
    document.querySelectorAll("#radar-border-fx, #preview-border-fx").forEach((fx) => {
      if (!wantBeat && !attached) return;
      fx.style.setProperty("--fx-audio-pulse", combined.toFixed(3));
      if (!wantBeat) return;
      fx.style.removeProperty("filter");
      fx.style.opacity = String(Math.min(1, Math.max(0.55, intensity)));
    });
    lastVisualLevel = combined;
    lastVisualPulse = punchVis;
    if (beatStyle() === "scanline") {
      startVisualLoop();
    } else {
      stopVisualLoop();
      drawSpectrumHosts(combined, punchVis);
    }
  }

  function clearLevel() {
    const root = shell();
    const preview = document.getElementById("preview-radar");
    for (const el of [root, preview].filter(Boolean)) {
      el.classList.remove("has-desktop-audio", "is-audio-hot");
      el.style.removeProperty("--rec-audio-level");
      el.style.removeProperty("--fx-beat-level");
      el.style.removeProperty("--fx-beat-pulse");
      el.style.removeProperty("--fx-beat-motion");
      el.style.removeProperty("--fx-beat-punch");
      el.style.removeProperty("--fx-beat-size");
      el.style.removeProperty("--fx-beat-intensity");
    }
    document.querySelectorAll(".bfx-beat").forEach((el) => {
      el.style.removeProperty("--fx-beat-level");
      el.style.removeProperty("--fx-beat-pulse");
    });
    document.querySelectorAll("#radar-border-fx, #preview-border-fx").forEach((fx) => {
      fx.style.removeProperty("--fx-audio-pulse");
      fx.style.removeProperty("filter");
    });
    stopVisualLoop();
    document.querySelectorAll("canvas.bfx-beat-spectrum").forEach((c) => {
      window.IsleBorderFxSpectrum?.clear?.(c);
    });
    window.IsleBorderFxSpectrum?.reset?.();
    lastFreq = null;
    lastVisualLevel = 0;
    lastVisualPulse = 0;
    env = 0;
    display = 0;
    peakHold = 0.2;
    agcGain = 1.6;
    prevSpectrum = null;
  }

  function stopAnalyser() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    try {
      audioCtx?.close?.();
    } catch {
      // ignore
    }
    audioCtx = null;
    analyser = null;
    prevSpectrum = null;
  }

  function stopOwnedStream() {
    try {
      ownedStream?.getTracks?.().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
    ownedStream = null;
  }

  /** Close analyser first so MediaStreamSource releases the capturer. */
  function teardownCapture() {
    stopAnalyser();
    stopOwnedStream();
  }

  function startAnalyser(mediaStream) {
    stopAnalyser();
    const track = mediaStream?.getAudioTracks?.()?.[0];
    if (!track) return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      audioCtx = new AC();
      const src = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      src.connect(analyser);
      const freq = new Uint8Array(analyser.frequencyBinCount);
      const wave = new Uint8Array(analyser.fftSize);
      prevSpectrum = new Float32Array(Math.min(48, freq.length));

      const tick = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(wave);

        const sensitivity = clamp(opts.sensitivity ?? 1, 0.3, 3);
        const punch = clamp(opts.punch ?? 1, 0.2, 3);
        const smoothAmt = clamp(opts.smooth ?? 0.45, 0.05, 0.9);
        const bassW = clamp(opts.bass ?? 0.7, 0, 1);

        // Waveform RMS + peak
        let sumSq = 0;
        let peak = 0;
        for (let i = 0; i < wave.length; i++) {
          const v = (wave[i] - 128) / 128;
          sumSq += v * v;
          const a = Math.abs(v);
          if (a > peak) peak = a;
        }
        const rms = Math.sqrt(sumSq / wave.length);

        // Bass / mid energy
        const bassBins = Math.min(16, freq.length);
        let bass = 0;
        for (let i = 0; i < bassBins; i++) {
          bass += freq[i] * (1.25 - i * 0.04);
        }
        bass /= bassBins * 255;
        let mid = 0;
        const mid0 = Math.floor(freq.length * 0.12);
        const mid1 = Math.floor(freq.length * 0.35);
        for (let i = mid0; i < mid1; i++) mid += freq[i];
        mid /= Math.max(1, mid1 - mid0) * 255;

        const raw =
          rms * 0.55 +
          peak * 0.35 +
          bass * (0.35 + bassW * 0.55) +
          mid * (0.25 * (1 - bassW * 0.4));

        // Adaptive peak hold — normalize so loud tracks still have dynamics
        peakHold = Math.max(peakHold * 0.992, raw, 0.06);
        const normalized = clamp(raw / peakHold, 0, 1);

        // AGC toward a mid working level so full volume doesn't pin the meter
        const target = 0.42;
        agcGain += (target - normalized * agcGain) * 0.035;
        agcGain = clamp(agcGain, 0.45, 6);
        const driven = clamp(normalized * agcGain * sensitivity, 0, 1);

        // Soft-knee compressor — leave headroom for pulse motion
        let compressed = driven;
        if (compressed > 0.55) {
          const over = compressed - 0.55;
          compressed = 0.55 + over / (1 + over * 3.2);
        }

        // Spectral flux onset (beats still fire when sustained loud)
        let flux = 0;
        const nSpec = prevSpectrum.length;
        for (let i = 0; i < nSpec; i++) {
          const cur = freq[i] / 255;
          const d = cur - prevSpectrum[i];
          if (d > 0) flux += d * (i < 12 ? 1.4 : 0.7);
          prevSpectrum[i] = cur * 0.65 + prevSpectrum[i] * 0.35;
        }
        flux = clamp(flux / (nSpec * 0.35), 0, 1);

        const attack = 0.45 + (1 - smoothAmt) * 0.4;
        const release = 0.08 + smoothAmt * 0.22;
        const rise = compressed > env ? attack : release;
        env = env * (1 - rise) + compressed * rise;

        const onset = Math.max(0, compressed - env * 0.92, flux * 0.85);
        const pulse = clamp(onset * (1.1 + punch * 1.4), 0, 1);

        // Display follows energy but always mixes punch so it never “sticks”
        const dispRise = pulse > display ? 0.62 : 0.12 + smoothAmt * 0.18;
        display = display * (1 - dispRise) + (env * 0.5 + pulse * 0.85) * dispRise;

        if (beatStyle() === "scanline") {
          lastFreq = freq;
        }
        applyLevel(display, pulse);
        raf = requestAnimationFrame(tick);
      };

      const kick = () => {
        raf = requestAnimationFrame(tick);
      };
      if (audioCtx.state === "suspended") {
        void audioCtx.resume().then(kick).catch(kick);
      } else {
        kick();
      }
      return true;
    } catch (err) {
      console.warn("[border-fx-beat] analyser", err);
      stopAnalyser();
      return false;
    }
  }

  async function acquireDesktopAudio() {
    const getSource = getSourceApi();
    if (!getSource) return null;
    const src = await getSource();
    if (!src?.ok || !src.id) return null;
    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: src.id,
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: src.id,
          maxWidth: 16,
          maxHeight: 16,
          maxFrameRate: 1,
        },
      },
    };
    // @ts-ignore Electron desktop capture
    const media = await navigator.mediaDevices.getUserMedia(constraints);
    // Desktop audio requires a video track in the request, but keeping that
    // 16×16/1fps track alive poisons Chromium's capturer — later "full res"
    // recordings encode as 16×10 soup. Stop video immediately; keep audio.
    try {
      media.getVideoTracks?.().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
    return media;
  }

  async function ensureSelfCapture() {
    if (!wantBeat || attached || starting || suspendedForRecording) return;
    if (ownedStream && analyser) return;
    starting = true;
    const gen = ++captureGen;
    try {
      teardownCapture();
      const media = await acquireDesktopAudio();
      if (
        gen !== captureGen ||
        !media ||
        !wantBeat ||
        attached ||
        suspendedForRecording
      ) {
        try {
          media?.getTracks?.().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        return;
      }
      ownedStream = media;
      if (!startAnalyser(ownedStream)) {
        teardownCapture();
      }
    } catch (err) {
      console.warn("[border-fx-beat] desktop audio unavailable", err);
      teardownCapture();
      if (wantBeat) applyLevel(0.08, 0.05);
    } finally {
      starting = false;
    }
  }

  /**
   * Free the desktop capturer so recording can grab full-resolution video.
   * Returns a promise that resolves after tracks report ended (or timeout).
   */
  async function releaseForRecording() {
    suspendedForRecording = true;
    captureGen += 1;
    const tracks = ownedStream?.getTracks?.()?.slice?.() || [];
    teardownCapture();
    // Keep a soft idle so the rim doesn't look dead mid-arm
    if (wantBeat) applyLevel(0.06, 0.02);
    if (!tracks.length) {
      await new Promise((r) => setTimeout(r, 80));
      return;
    }
    await Promise.race([
      Promise.all(
        tracks.map(
          (t) =>
            new Promise((resolve) => {
              if (t.readyState === "ended") {
                resolve();
                return;
              }
              const done = () => {
                t.removeEventListener?.("ended", done);
                resolve();
              };
              t.addEventListener?.("ended", done);
              setTimeout(done, 400);
            })
        )
      ),
      new Promise((r) => setTimeout(r, 450)),
    ]);
    // Extra beat for Chromium to drop the shared capturer pipeline
    await new Promise((r) => setTimeout(r, 150));
  }

  function resumeAfterRecording() {
    suspendedForRecording = false;
    if (wantBeat && !attached) void ensureSelfCapture();
  }

  function sync(host, settings = {}) {
    if (host) hosts.add(host);
    const effect = String(settings.borderEffect || settings.effect || "none");
    wantBeat = effect === "beat";
    opts = {
      intensity: settings.borderEffectIntensity ?? settings.intensity ?? 1,
      speed: settings.borderEffectSpeed ?? settings.speed ?? 1,
      size: settings.borderEffectSize ?? settings.size ?? 1,
      color: settings.borderEffectColor || settings.color || "#5ec8ff",
      sensitivity:
        settings.borderEffectBeatSensitivity ?? settings.sensitivity ?? 1,
      punch: settings.borderEffectBeatPunch ?? settings.punch ?? 1,
      smooth: settings.borderEffectBeatSmooth ?? settings.smooth ?? 0.45,
      bass: settings.borderEffectBeatBass ?? settings.bass ?? 0.7,
      motion: settings.borderEffectBeatMotion ?? settings.motion ?? 1,
      rings: settings.borderEffectBeatRings ?? settings.rings ?? 5,
      style:
        String(
          settings.borderEffectBeatStyle || settings.beatStyle || "scanline"
        ) === "rings"
          ? "rings"
          : "scanline",
      barSize: settings.borderEffectBeatBarSize ?? settings.barSize ?? 45,
      barLength: settings.borderEffectBeatBarLength ?? settings.barLength ?? 40,
      barDistance:
        settings.borderEffectBeatBarDistance ?? settings.barDistance ?? 0,
      barSpacing:
        settings.borderEffectBeatBarSpacing ??
        settings.borderEffectBeatBarGap ??
        settings.barSpacing ??
        settings.barGap ??
        35,
      barRotation:
        settings.borderEffectBeatBarRotation ?? settings.barRotation ?? 1,
      randomGradient: Boolean(
        settings.borderEffectRandomGradient ?? settings.randomGradient
      ),
    };
    pushTuneVars();
    ensureRings(opts.rings);
    const style = beatStyle();
    for (const el of [shell(), document.getElementById("preview-radar")].filter(
      Boolean
    )) {
      el.dataset.beatStyle = style;
      el.setAttribute("data-beat-style", style);
    }
    if (host) {
      host.style.setProperty("--fx-beat-level", host.style.getPropertyValue("--fx-beat-level") || "0");
      host.style.setProperty("--fx-beat-pulse", host.style.getPropertyValue("--fx-beat-pulse") || "0");
    }
    if (wantBeat) {
      if (style === "scanline") {
        lastVisualLevel = Math.max(lastVisualLevel, 0.15);
        startVisualLoop();
      } else {
        stopVisualLoop();
        drawSpectrumHosts(0, 0);
      }
      if (!attached && !suspendedForRecording) void ensureSelfCapture();
    } else if (!attached) {
      teardownCapture();
      clearLevel();
    }
  }

  function attachStream(mediaStream) {
    attached = true;
    suspendedForRecording = true;
    captureGen += 1;
    teardownCapture();
    pushTuneVars();
    ensureRings(opts.rings);
    if (!startAnalyser(mediaStream)) {
      attached = false;
      suspendedForRecording = false;
      if (wantBeat) void ensureSelfCapture();
    }
  }

  function detachStream() {
    if (!attached && !suspendedForRecording) return;
    attached = false;
    stopAnalyser();
    suspendedForRecording = false;
    if (wantBeat) {
      void ensureSelfCapture();
    } else {
      clearLevel();
    }
  }

  function fromSettings(s = {}) {
    return {
      borderEffect: s.borderEffect || "none",
      borderEffectIntensity: s.borderEffectIntensity,
      borderEffectSpeed: s.borderEffectSpeed,
      borderEffectSize: s.borderEffectSize,
      borderEffectColor: s.borderEffectColor,
      borderEffectBeatSensitivity: s.borderEffectBeatSensitivity,
      borderEffectBeatPunch: s.borderEffectBeatPunch,
      borderEffectBeatSmooth: s.borderEffectBeatSmooth,
      borderEffectBeatBass: s.borderEffectBeatBass,
      borderEffectBeatMotion: s.borderEffectBeatMotion,
      borderEffectBeatRings: s.borderEffectBeatRings,
      borderEffectBeatStyle: s.borderEffectBeatStyle,
      borderEffectBeatBarSize: s.borderEffectBeatBarSize,
      borderEffectBeatBarLength: s.borderEffectBeatBarLength,
      borderEffectBeatBarDistance: s.borderEffectBeatBarDistance,
      borderEffectBeatBarSpacing: s.borderEffectBeatBarSpacing,
      borderEffectBeatBarRotation: s.borderEffectBeatBarRotation,
      borderEffectRandomGradient: s.borderEffectRandomGradient,
    };
  }

  window.IsleBorderFxBeat = {
    sync,
    attachStream,
    detachStream,
    releaseForRecording,
    resumeAfterRecording,
    fromSettings,
  };
})();