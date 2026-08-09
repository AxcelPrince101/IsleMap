/**
 * Screen recording via desktopCapturer + MediaRecorder (overlay renderer).
 * Commands come from main-process hotkeys / dashboard.
 */
window.IsleRecording = (() => {
  /** @type {MediaRecorder | null} */
  let recorder = null;
  /** @type {MediaStream | null} */
  let stream = null;
  /** @type {Blob[]} */
  let chunks = [];
  /** @type {"idle" | "recording" | "paused" | "encoding"} */
  let state = "idle";
  let startedAt = 0;
  let accumulatedMs = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let tickTimer = null;
  let busy = false;
  /** @type {(msg: string) => void} */
  let toastFn = () => {};

  function toast(msg) {
    try {
      toastFn(String(msg || ""));
    } catch {
      // ignore
    }
  }

  const shell = () => document.getElementById("shell");
  const timerEl = () => document.getElementById("recording-timer");

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    if (h > 0) return `${h}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  }

  function elapsedMs() {
    if (state === "recording") {
      return accumulatedMs + (Date.now() - startedAt);
    }
    return accumulatedMs;
  }

  function publishState(extra = {}) {
    const payload = {
      state,
      elapsedMs: elapsedMs(),
      ...extra,
    };
    try {
      window.isleOverlay?.reportRecordingState?.(payload);
    } catch {
      // optional
    }
    return payload;
  }

  function updateUi() {
    const root = shell();
    const timer = timerEl();
    if (root) {
      root.classList.toggle("is-recording", state === "recording");
      root.classList.toggle("is-recording-paused", state === "paused");
      root.classList.remove("is-encoding");
      root.dataset.recording = state;
    }
    if (timer) {
      const show = state === "recording" || state === "paused";
      timer.hidden = !show;
      timer.setAttribute("aria-hidden", show ? "false" : "true");
      timer.dataset.state = state;
      timer.textContent = formatTime(elapsedMs());
    }
    publishState();
  }

  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AnalyserNode | null} */
  let audioAnalyser = null;
  /** @type {number | null} */
  let audioRaf = null;
  let audioSmooth = 0;

  function stopAudioPulse() {
    if (window.IsleBorderFxBeat?.detachStream) {
      window.IsleBorderFxBeat.detachStream();
      return;
    }
    if (audioRaf) {
      cancelAnimationFrame(audioRaf);
      audioRaf = null;
    }
    try {
      audioCtx?.close?.();
    } catch {
      // ignore
    }
    audioCtx = null;
    audioAnalyser = null;
    audioSmooth = 0;
    const root = shell();
    if (root) {
      root.classList.remove("has-desktop-audio", "is-audio-hot");
      root.style.removeProperty("--rec-audio-level");
    }
    const fx = document.getElementById("radar-border-fx");
    if (fx) {
      fx.style.removeProperty("--fx-audio-pulse");
      fx.style.removeProperty("filter");
    }
  }

  function startAudioPulse(mediaStream) {
    if (window.IsleBorderFxBeat?.attachStream) {
      window.IsleBorderFxBeat.attachStream(mediaStream);
      shell()?.classList.add("has-desktop-audio");
      return;
    }
    // Fallback if beat module missing
    stopAudioPulse();
    const track = mediaStream?.getAudioTracks?.()?.[0];
    if (!track) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      audioCtx = new AC();
      const src = audioCtx.createMediaStreamSource(mediaStream);
      audioAnalyser = audioCtx.createAnalyser();
      audioAnalyser.fftSize = 256;
      audioAnalyser.smoothingTimeConstant = 0.45;
      src.connect(audioAnalyser);
      const data = new Uint8Array(audioAnalyser.frequencyBinCount);
      const root = shell();
      root?.classList.add("has-desktop-audio");
      const tick = () => {
        if (!audioAnalyser) return;
        audioAnalyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < Math.min(12, data.length); i++) sum += data[i];
        const level = Math.min(1, sum / (12 * 255));
        audioSmooth = audioSmooth * 0.6 + level * 0.4;
        root?.style.setProperty("--rec-audio-level", audioSmooth.toFixed(3));
        root?.classList.toggle("is-audio-hot", audioSmooth > 0.12);
        audioRaf = requestAnimationFrame(tick);
      };
      if (audioCtx.state === "suspended") {
        void audioCtx.resume().then(() => {
          audioRaf = requestAnimationFrame(tick);
        });
      } else {
        audioRaf = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.warn("[recording] audio pulse", err);
      stopAudioPulse();
    }
  }

  function stopTicker() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function startTicker() {
    stopTicker();
    tickTimer = setInterval(() => {
      const timer = timerEl();
      if (timer && (state === "recording" || state === "paused")) {
        timer.textContent = formatTime(elapsedMs());
      }
      if (state === "recording") publishState();
    }, 250);
  }

  function pickMime(withAudio) {
    // WebM only — Chromium MediaRecorder "mp4" is often fragmented / missing moov.
    const candidates = withAudio
      ? [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
        ]
      : [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
        ];
    for (const type of candidates) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported?.(type)
      ) {
        return type;
      }
    }
    return "video/webm";
  }

  /** Target bitrate for near-lossless HD/UHD screen capture (bits/sec). */
  function targetVideoBitrate(width, height, fps = 30) {
    const w = Math.max(640, Number(width) || 1920);
    const h = Math.max(360, Number(height) || 1080);
    const f = Math.max(24, Math.min(60, Number(fps) || 30));
    // ~0.22 bits/pixel/frame keeps fine UI text sharp on 1440p/4K desks
    const estimated = Math.round(w * h * f * 0.22);
    return Math.min(50_000_000, Math.max(16_000_000, estimated));
  }

  function desktopAudioConstraints(sourceId) {
    return {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: sourceId,
      },
    };
  }

  function videoConstraints(sourceId, width, height, exact) {
    if (exact) {
      return {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          minWidth: width,
          maxWidth: width,
          minHeight: height,
          maxHeight: height,
          minFrameRate: 30,
          maxFrameRate: 60,
        },
      };
    }
    return {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: sourceId,
        maxWidth: width,
        maxHeight: height,
        maxFrameRate: 60,
      },
    };
  }

  /**
   * getSettings() can lie (report 2560×1600 while frames are still 16×10).
   * Probe real decoded frame size via a hidden video element.
   */
  async function probeVideoSize(media, timeoutMs = 1200) {
    const track = media?.getVideoTracks?.()?.[0];
    if (!track) return { width: 0, height: 0 };
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(video);
    try {
      video.srcObject = media;
      await video.play().catch(() => {});
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const w = video.videoWidth | 0;
        const h = video.videoHeight | 0;
        if (w >= 2 && h >= 2) return { width: w, height: h };
        await new Promise((r) => setTimeout(r, 40));
      }
      return {
        width: video.videoWidth | 0,
        height: video.videoHeight | 0,
      };
    } finally {
      try {
        video.pause();
        video.srcObject = null;
        video.remove();
      } catch {
        // ignore
      }
    }
  }

  async function acquireStream() {
    if (!window.isleOverlay?.getRecordingSource) {
      throw new Error("Recording bridge missing");
    }
    // Audio-beat used a tiny 16×16 desktop stream — release it first or
    // Chromium may encode that low-res track (looks pixelated).
    try {
      await window.IsleBorderFxBeat?.releaseForRecording?.();
    } catch {
      // optional
    }

    const src = await window.isleOverlay.getRecordingSource();
    if (!src?.ok || !src.id) {
      throw new Error(src?.message || "No screen source");
    }
    const width = Math.max(1280, Number(src.width) || 1920);
    const height = Math.max(720, Number(src.height) || 1080);

    let wantAudio = true;
    try {
      const s = await window.isleOverlay.getSettings?.();
      wantAudio = s?.recordingDesktopAudio !== false;
    } catch {
      wantAudio = true;
    }

    const tryGet = async (withAudio, exact) => {
      const constraints = {
        audio: withAudio ? desktopAudioConstraints(src.id) : false,
        video: videoConstraints(src.id, width, height, exact),
      };
      // @ts-ignore Electron desktop capture constraints
      const media = await navigator.mediaDevices.getUserMedia(constraints);
      media.__isleCaptureSize = { width, height };
      media.__isleCaptureAudio = Boolean(
        withAudio && media.getAudioTracks?.().length
      );
      return media;
    };

    const assertUsableVideo = async (media) => {
      const track = media?.getVideoTracks?.()?.[0];
      let settings = {};
      try {
        settings = track?.getSettings?.() || {};
      } catch {
        settings = {};
      }
      const probed = await probeVideoSize(media);
      media.__isleProbedSize = probed;
      console.log("[recording:debug] probe", { settings, probed });
      // Never trust getSettings alone — after Audio Beat's 16×16 capture it
      // often reports full display size while frames are still tiny.
      if (!probed.width || !probed.height) {
        try {
          media.getTracks?.().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        throw new Error("Could not verify capture resolution");
      }
      if (probed.width < 640) {
        try {
          media.getTracks?.().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        throw new Error(
          `Capture resolution too low (${probed.width}×${probed.height})`
        );
      }
      media.__isleCaptureSize = {
        width: probed.width,
        height: probed.height,
      };
      return media;
    };

    const attempt = async () => {
      try {
        return await assertUsableVideo(await tryGet(wantAudio, true));
      } catch (err1) {
        try {
          return await assertUsableVideo(await tryGet(wantAudio, false));
        } catch (err2) {
          if (!wantAudio) throw err2;
          console.warn(
            "[recording] desktop audio unavailable, falling back to silent",
            err2
          );
          toast("Desktop audio unavailable — recording video only");
          try {
            return await assertUsableVideo(await tryGet(false, true));
          } catch {
            return await assertUsableVideo(await tryGet(false, false));
          }
        }
      }
    };

    // Prefer exact size + audio; if capturer still poisoned, release & retry
    try {
      return await attempt();
    } catch (first) {
      console.warn("[recording] capture retry after release", first?.message || first);
      try {
        await window.IsleBorderFxBeat?.releaseForRecording?.();
      } catch {
        // optional
      }
      await new Promise((r) => setTimeout(r, 400));
      return await attempt();
    }
  }

  function cleanupStream() {
    stopAudioPulse();
    try {
      stream?.getTracks?.().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    stream = null;
    recorder = null;
    chunks = [];
    try {
      window.IsleBorderFxBeat?.resumeAfterRecording?.();
    } catch {
      // optional
    }
  }

  function describeTrack(track) {
    if (!track) return null;
    let settings = {};
    try {
      settings = track.getSettings?.() || {};
    } catch {
      settings = {};
    }
    return {
      label: track.label || "",
      readyState: track.readyState,
      muted: track.muted,
      enabled: track.enabled,
      settings: {
        width: settings.width || null,
        height: settings.height || null,
        frameRate: settings.frameRate || null,
        deviceId: settings.deviceId || null,
        displaySurface: settings.displaySurface || null,
      },
    };
  }

  async function start() {
    if (busy || state !== "idle") {
      return { ok: false, reason: state === "idle" ? "busy" : state };
    }
    busy = true;
    try {
      stream = await acquireStream();
      chunks = [];
      const hasAudio = Boolean(stream.__isleCaptureAudio);
      const mimeType = pickMime(hasAudio);
      const size = stream.__isleCaptureSize || { width: 1920, height: 1080 };
      const videoTrack = stream.getVideoTracks?.()[0] || null;
      const audioTrack = stream.getAudioTracks?.()[0] || null;
      const trackInfo = describeTrack(videoTrack);
      const audioInfo = describeTrack(audioTrack);
      const probed = stream.__isleProbedSize || {};
      const actualW = probed.width || size.width || trackInfo?.settings?.width || 1920;
      const actualH = probed.height || size.height || trackInfo?.settings?.height || 1080;
      const actualFps = Math.max(24, Number(trackInfo?.settings?.frameRate) || 30);
      const videoBitsPerSecond = targetVideoBitrate(
        actualW,
        actualH,
        actualFps
      );
      const audioBitsPerSecond = hasAudio ? 192_000 : 0;
      const captureDebug = {
        requestedSize: size,
        probedSize: probed.width
          ? { width: probed.width, height: probed.height }
          : null,
        mimeType,
        hasAudio,
        videoBitsPerSecond,
        audioBitsPerSecond: hasAudio ? audioBitsPerSecond : null,
        bitrateMbps: Math.round((videoBitsPerSecond / 1e6) * 10) / 10,
        track: trackInfo,
        audioTrack: audioInfo,
        supportedMimeSample: [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9",
          "video/webm",
        ].map((t) => ({
          type: t,
          ok: Boolean(MediaRecorder.isTypeSupported?.(t)),
          used: t === mimeType,
        })),
      };
      stream.__isleCaptureDebug = captureDebug;
      console.log("[recording:debug] start", captureDebug);
      publishState({ debug: { stage: "start", ...captureDebug } });

      const recorderOpts = {
        mimeType,
        videoBitsPerSecond,
      };
      if (hasAudio) {
        recorderOpts.audioBitsPerSecond = audioBitsPerSecond;
        recorderOpts.bitsPerSecond = videoBitsPerSecond + audioBitsPerSecond;
      } else {
        recorderOpts.bitsPerSecond = videoBitsPerSecond;
      }
      recorder = new MediaRecorder(stream, recorderOpts);
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onerror = (ev) => {
        const err = ev?.error || ev;
        console.warn("[recording] error", err);
        publishState({
          debug: {
            stage: "recorder-error",
            message: err?.message || String(err),
            name: err?.name || null,
          },
        });
      };
      recorder.start(1000);
      accumulatedMs = 0;
      startedAt = Date.now();
      state = "recording";
      startTicker();
      updateUi();
      if (hasAudio) startAudioPulse(stream);
      toast(
        hasAudio ? "Recording started (with desktop audio)" : "Recording started"
      );
      return { ok: true, state, debug: captureDebug };
    } catch (err) {
      cleanupStream();
      state = "idle";
      updateUi();
      const message = err?.message || String(err);
      console.warn("[recording:debug] start-failed", message);
      publishState({
        debug: { stage: "start-failed", message },
      });
      toast(`Record failed: ${message}`);
      try {
        window.IsleBorderFxBeat?.resumeAfterRecording?.();
      } catch {
        // optional
      }
      return { ok: false, reason: "error", message };
    } finally {
      busy = false;
    }
  }

  function pause() {
    if (state !== "recording" || !recorder) {
      return { ok: false, reason: state };
    }
    try {
      if (recorder.state === "recording") recorder.pause();
    } catch (err) {
      return { ok: false, reason: "error", message: err?.message || String(err) };
    }
    accumulatedMs += Date.now() - startedAt;
    state = "paused";
    updateUi();
    toast("Recording paused");
    return { ok: true, state };
  }

  function play() {
    if (state !== "paused" || !recorder) {
      return { ok: false, reason: state };
    }
    try {
      if (recorder.state === "paused") recorder.resume();
    } catch (err) {
      return { ok: false, reason: "error", message: err?.message || String(err) };
    }
    startedAt = Date.now();
    state = "recording";
    updateUi();
    toast("Recording resumed");
    return { ok: true, state };
  }

  function stop() {
    if (state === "idle" || !recorder) {
      return Promise.resolve({ ok: false, reason: "idle" });
    }
    if (busy) return Promise.resolve({ ok: false, reason: "busy" });
    busy = true;

    if (state === "recording") {
      accumulatedMs += Date.now() - startedAt;
    }
    const finalMs = accumulatedMs;
    stopTicker();

    return new Promise((resolve) => {
      const rec = recorder;
      const finish = async () => {
        try {
          const mimeType = rec?.mimeType || "video/webm";
          const captureDebug = stream?.__isleCaptureDebug || null;
          const chunkSizes = chunks.map((c) => c.size);
          const blob = new Blob(chunks, { type: mimeType });
          const buffer = blob.size
            ? new Uint8Array(await blob.arrayBuffer())
            : null;
          const headHex = buffer
            ? Array.from(buffer.slice(0, 16))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
            : null;
          const stopDebug = {
            stage: "stop",
            mimeType,
            chunkCount: chunks.length,
            chunkSizes: chunkSizes.slice(0, 40),
            blobBytes: blob.size,
            headHex,
            elapsedMs: finalMs,
            capture: captureDebug,
          };
          console.log("[recording:debug] stop", stopDebug);
          // Release capture so a new recording can start while encode runs
          stopAudioPulse();
          try {
            stream?.getTracks?.().forEach((t) => t.stop());
          } catch {
            // ignore
          }
          stream = null;
          recorder = null;
          chunks = [];
          accumulatedMs = 0;
          startedAt = 0;
          state = "idle";
          busy = false;
          updateUi();

          if (!buffer || !buffer.length) {
            toast("Recording empty");
            publishState({
              state: "idle",
              debug: { ...stopDebug, ok: false, reason: "empty-blob" },
            });
            resolve({ ok: false, reason: "empty", debug: stopDebug });
            return;
          }

          toast("Encoding in background…");
          publishState({
            state: "idle",
            encodeQueued: true,
            debug: stopDebug,
          });
          resolve({ ok: true, queued: true, elapsedMs: finalMs });

          void window.isleOverlay
            .saveRecording(buffer, {
              mimeType,
              debug: stopDebug,
            })
            .then((saved) => {
              if (saved?.ok) {
                toast(
                  saved.warning === "mp4-convert-failed"
                    ? "Saved WebM (MP4 convert failed — see debug)"
                    : saved.format === "mp4"
                      ? "Recording saved (MP4)"
                      : "Recording saved"
                );
                publishState({
                  saved: saved.name,
                  path: saved.path,
                  debug: saved.debug || stopDebug,
                });
              } else {
                toast(saved?.message || "Could not save recording");
                publishState({
                  debug: saved?.debug || {
                    ...stopDebug,
                    ok: false,
                    reason: "save-failed",
                    message: saved?.message,
                  },
                });
              }
            })
            .catch((err) => {
              toast(err?.message || "Encode failed");
              publishState({
                debug: {
                  stage: "save-exception",
                  message: err?.message || String(err),
                },
              });
            });
        } catch (err) {
          cleanupStream();
          state = "idle";
          busy = false;
          updateUi();
          publishState({
            debug: {
              stage: "stop-exception",
              message: err?.message || String(err),
            },
          });
          resolve({
            ok: false,
            reason: "error",
            message: err?.message || String(err),
          });
        }
      };

      rec.onstop = () => {
        void finish();
      };
      try {
        if (rec.state === "inactive") {
          void finish();
        } else {
          rec.stop();
        }
      } catch {
        void finish();
      }
    });
  }

  async function command(action) {
    const a = String(action || "").toLowerCase();
    if (a === "start") return start();
    if (a === "pause") return pause();
    if (a === "play" || a === "resume") return play();
    if (a === "stop") return stop();
    if (a === "toggle-record") {
      if (state === "idle") return start();
      if (state === "recording" || state === "paused") return stop();
      return { ok: false, reason: state };
    }
    if (a === "toggle-pause") {
      if (state === "recording") return pause();
      if (state === "paused") return play();
      return { ok: false, reason: "idle" };
    }
    return { ok: false, reason: "unknown" };
  }

  function getState() {
    return { state, elapsedMs: elapsedMs() };
  }

  function init(opts = {}) {
    if (typeof opts.toast === "function") toastFn = opts.toast;
    updateUi();
    if (typeof window.isleOverlay?.onRecordingCommand === "function") {
      window.isleOverlay.onRecordingCommand((action) => {
        void command(action);
      });
    }
  }

  return {
    init,
    command,
    start,
    pause,
    play,
    stop,
    getState,
  };
})();
