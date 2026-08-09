/**
 * WebGL 3D dino player pin — uses IsleBorderFxDinoSpecies poses.
 */
(function () {
  const VS = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    uniform mat4 uMVP;
    uniform mat3 uN;
    varying vec3 vN;
    void main() {
      vN = normalize(uN * aNorm);
      gl_Position = uMVP * vec4(aPos, 1.0);
    }
  `;
  const FS = `
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uShade;
    uniform float uAlpha;
    varying vec3 vN;
    void main() {
      vec3 N = normalize(vN);
      vec3 L = normalize(vec3(0.3, 0.8, 0.65));
      float nd = max(0.25, dot(N, L));
      float rim = pow(1.0 - max(0.0, N.z), 1.6) * 0.35;
      vec3 base = uColor * uShade;
      vec3 col = base * (0.42 + 0.58 * nd) + base * rim;
      gl_FragColor = vec4(col, uAlpha);
    }
  `;

  /** @type {Map<Element, any>} */
  const instances = new Map();
  let raf = 0;
  let sharedProg = null;
  let sharedMesh = null;

  const ORIENTATIONS = new Set([
    "auto",
    "profile",
    "side",
    "fly",
    "top",
    "topRev",
  ]);

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function resolveOrientation(mode, speciesId) {
    const m = ORIENTATIONS.has(mode) ? mode : "auto";
    if (m !== "auto") return m;
    if (speciesId === "pteranodon") return "fly";
    if (speciesId === "deinosuchus") return "side";
    // Map pin default: top-down so the head can track facing
    return "top";
  }

  function hexToRgb(hex) {
    const h = String(hex || "#5ef0ff").replace("#", "");
    if (h.length !== 6) return [0.37, 0.94, 1];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function mat4() {
    return new Float32Array(16);
  }
  function ident(o) {
    const m = o || mat4();
    m.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return m;
  }
  function mul(a, b, o) {
    const r = o || mat4();
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4];
      const b1 = b[c * 4 + 1];
      const b2 = b[c * 4 + 2];
      const b3 = b[c * 4 + 3];
      r[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      r[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      r[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      r[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return r;
  }
  function translate(m, x, y, z) {
    const t = ident();
    t[12] = x;
    t[13] = y;
    t[14] = z;
    return mul(m, t);
  }
  function scaleMat(m, x, y, z) {
    const s = ident();
    s[0] = x;
    s[5] = y;
    s[10] = z;
    return mul(m, s);
  }
  function rotateX(m, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r = ident();
    r[5] = c;
    r[6] = s;
    r[9] = -s;
    r[10] = c;
    return mul(m, r);
  }
  function rotateY(m, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r = ident();
    r[0] = c;
    r[2] = -s;
    r[8] = s;
    r[10] = c;
    return mul(m, r);
  }
  function rotateZ(m, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r = ident();
    r[0] = c;
    r[1] = s;
    r[4] = -s;
    r[5] = c;
    return mul(m, r);
  }
  function ortho(l, r, b, t, n, f) {
    const o = mat4();
    o[0] = 2 / (r - l);
    o[5] = 2 / (t - b);
    o[10] = -2 / (f - n);
    o[12] = -(r + l) / (r - l);
    o[13] = -(t + b) / (t - b);
    o[14] = -(f + n) / (f - n);
    o[15] = 1;
    return o;
  }
  function normalMat(m) {
    const a00 = m[0];
    const a01 = m[1];
    const a02 = m[2];
    const a10 = m[4];
    const a11 = m[5];
    const a12 = m[6];
    const a20 = m[8];
    const a21 = m[9];
    const a22 = m[10];
    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    det = det || 1;
    return new Float32Array([
      b01 / det,
      (-a22 * a01 + a02 * a21) / det,
      (a12 * a01 - a02 * a11) / det,
      b11 / det,
      (a22 * a00 - a02 * a20) / det,
      (-a12 * a00 + a02 * a10) / det,
      b21 / det,
      (-a21 * a00 + a01 * a20) / det,
      (a11 * a00 - a01 * a10) / det,
    ]);
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }

  function boxMesh() {
    const p = [
      0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
      -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5,
      -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
    ];
    const n = [];
    const faces = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    for (const f of faces) for (let i = 0; i < 6; i++) n.push(f[0], f[1], f[2]);
    return { pos: new Float32Array(p), norm: new Float32Array(n), count: 36 };
  }

  function ensureGl(canvas) {
    return canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      depth: true,
      preserveDrawingBuffer: false,
    });
  }

  function ensureShared(gl) {
    if (!sharedMesh) sharedMesh = boxMesh();
    if (!sharedProg || sharedProg.gl !== gl) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      sharedProg = {
        gl,
        prog: p,
        aPos: gl.getAttribLocation(p, "aPos"),
        aNorm: gl.getAttribLocation(p, "aNorm"),
        uMVP: gl.getUniformLocation(p, "uMVP"),
        uN: gl.getUniformLocation(p, "uN"),
        uColor: gl.getUniformLocation(p, "uColor"),
        uShade: gl.getUniformLocation(p, "uShade"),
        uAlpha: gl.getUniformLocation(p, "uAlpha"),
        posBuf: gl.createBuffer(),
        normBuf: gl.createBuffer(),
      };
      gl.bindBuffer(gl.ARRAY_BUFFER, sharedProg.posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, sharedMesh.pos, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, sharedProg.normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, sharedMesh.norm, gl.STATIC_DRAW);
    }
    return sharedProg;
  }

  function resolveSpecies(id) {
    const api = window.IsleBorderFxDinoSpecies;
    if (!api) return "triceratops";
    const key = api.normalizeSpecies(id);
    return key === "mix" ? "triceratops" : key;
  }

  function resize(st) {
    const rect = st.host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (st.canvas.width !== w || st.canvas.height !== h) {
      st.canvas.width = w;
      st.canvas.height = h;
    }
    st.gl.viewport(0, 0, w, h);
  }

  function drawInstance(st, now) {
    const { gl, canvas, opts } = st;
    if (!gl || !canvas.isConnected) {
      unmount(st.host);
      return;
    }
    resize(st);
    const api = window.IsleBorderFxDinoSpecies;
    if (!api) return;
    const species = resolveSpecies(opts.species);
    const color = hexToRgb(opts.color);
    const alpha = clamp(opts.alpha ?? 1, 0.35, 1);
    const size = clamp(opts.size ?? 1, 0.5, 10);
    const speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    const animate = opts.animate !== false;
    const elapsed = ((now - st.t0) / 1000) * 7.5 * speed;
    const t = animate ? elapsed : 0.35;
    const pose = api.poseFor(species, t);
    const glow = clamp(opts.glow ?? 0.7, 0, 1);
    const orientation = resolveOrientation(opts.orientation, species);
    const isTop = orientation === "top" || orientation === "topRev";
    st.host.style.setProperty("--player-3d-glow", String(glow));
    st.host.style.setProperty("--player-3d-size", String(size));
    st.host.dataset.orient = orientation;

    const aspect = canvas.width / Math.max(1, canvas.height);
    // Tighter frustum so the pin fills the canvas (reads larger on the map)
    const viewH = isTop ? 1.55 : 1.85;
    const viewW = viewH * aspect;
    const proj = ortho(-viewW / 2, viewW / 2, -viewH / 2, viewH / 2, -5, 5);

    const sp = ensureShared(gl);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(sp.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, sp.posBuf);
    gl.enableVertexAttribArray(sp.aPos);
    gl.vertexAttribPointer(sp.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sp.normBuf);
    gl.enableVertexAttribArray(sp.aNorm);
    gl.vertexAttribPointer(sp.aNorm, 3, gl.FLOAT, false, 0, 0);

    // Centered pin. Top views face screen-up (+Y) so CSS heading uses baseRot 0.
    // Profile/side face +X; CSS -90° aims snout with FOV.
    let root = ident();
    const flap = animate ? Math.sin(t * 0.6) * 0.08 : 0;
    if (orientation === "fly") {
      root = rotateX(root, -Math.PI / 2 + 0.28);
      root = rotateZ(root, flap);
      root = rotateY(root, 0.1);
    } else if (orientation === "side") {
      root = rotateY(root, 0.95);
      root = rotateX(root, -0.18);
    } else if (orientation === "top") {
      // Look down; snout toward screen-up (+Y) = FOV / heading 0°
      root = rotateX(root, -Math.PI / 2);
      root = rotateZ(root, Math.PI / 2);
    } else if (orientation === "topRev") {
      root = rotateX(root, Math.PI / 2);
      root = rotateZ(root, -Math.PI / 2);
    } else {
      // profile — slight 3D yaw, kept centered
      root = rotateY(root, 0.4);
    }
    const fill = isTop ? 2.55 : 2.05;
    const s = (api.scaleFor(species) || 0.19) * fill * size;
    root = scaleMat(root, s, s, s * 0.92);

    for (const p of pose) {
      let m = root;
      m = translate(m, p.tx, p.ty, p.tz);
      m = rotateZ(m, p.rz);
      m = rotateY(m, p.ry);
      m = rotateX(m, p.rx);
      m = scaleMat(m, p.sx, p.sy, p.sz);
      const mvp = mul(proj, m);
      gl.uniformMatrix4fv(sp.uMVP, false, mvp);
      gl.uniformMatrix3fv(sp.uN, false, normalMat(m));
      gl.uniform3fv(sp.uColor, color);
      gl.uniform3fv(sp.uShade, p.shade || [1, 1, 1]);
      gl.uniform1f(sp.uAlpha, alpha);
      gl.drawArrays(gl.TRIANGLES, 0, sharedMesh.count);
    }
  }

  function loop(now) {
    raf = 0;
    if (!instances.size) return;
    for (const st of instances.values()) {
      try {
        drawInstance(st, now);
      } catch (_) {}
    }
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function mount(host, opts = {}) {
    if (!host) return null;
    unmount(host);

    let canvas = host.querySelector("canvas.player-dino3d-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "player-dino3d-canvas";
      host.appendChild(canvas);
    }
    const gl = ensureGl(canvas);
    if (!gl) return null;

    const st = {
      host,
      canvas,
      gl,
      opts: {
        species: opts.species || "triceratops",
        color: opts.color || "#5ef0ff",
        alpha: opts.alpha ?? 1,
        size: opts.size ?? 1,
        speed: opts.speed ?? 1,
        glow: opts.glow ?? 0.7,
        animate: opts.animate !== false,
        orientation: opts.orientation || "auto",
      },
      t0: performance.now(),
      ro: null,
    };
    instances.set(host, st);
    st.ro = new ResizeObserver(() => startLoop());
    st.ro.observe(host);
    startLoop();
    return st;
  }

  function unmount(host) {
    const st = instances.get(host);
    if (!st) return;
    st.ro?.disconnect();
    instances.delete(host);
    if (!instances.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function update(host, opts = {}) {
    const st = instances.get(host);
    if (!st) return mount(host, opts);
    st.opts = {
      species: opts.species || st.opts.species,
      color: opts.color || st.opts.color,
      alpha: opts.alpha ?? st.opts.alpha,
      size: opts.size ?? st.opts.size,
      speed: opts.speed ?? st.opts.speed,
      glow: opts.glow ?? st.opts.glow,
      animate:
        opts.animate !== undefined
          ? opts.animate !== false
          : st.opts.animate !== false,
      orientation: opts.orientation || st.opts.orientation || "auto",
    };
    startLoop();
  }

  function bindMarker(markerEl, opts = {}) {
    if (!markerEl) return;
    const host = markerEl.querySelector(".player-dino3d");
    if (!host) return;
    mount(host, opts);
  }

  window.IslePlayerIcon3d = {
    mount,
    unmount,
    update,
    bindMarker,
    resolveSpecies,
  };
})();
