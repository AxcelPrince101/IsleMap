/**
 * Procedural WebGL rim runners — side-profile dragon & dinosaur with run cycles.
 */
(function () {
  const MAX_CRITTERS = 6;
  const EFFECTS = new Set(["dragon", "dinosaur"]);

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
    uniform float uIntensity;
    varying vec3 vN;
    void main() {
      vec3 N = normalize(vN);
      vec3 L = normalize(vec3(0.25, 0.75, 0.7));
      vec3 H = normalize(L + vec3(0.0, 0.15, 1.0));
      float nd = max(0.22, dot(N, L));
      float spec = pow(max(0.0, dot(N, H)), 28.0) * 0.35;
      float rim = pow(1.0 - max(0.0, N.z), 1.8) * 0.4;
      vec3 base = uColor * uShade;
      vec3 col = base * (0.4 + 0.6 * nd) + vec3(spec) + base * rim;
      gl_FragColor = vec4(col, clamp(uIntensity, 0.35, 1.0));
    }
  `;

  /** @type {WeakMap<Element, any>} */
  const hosts = new WeakMap();

  function clamp(n, lo, hi) {
    const x = Number(n);
    if (!Number.isFinite(x)) return lo;
    return Math.min(hi, Math.max(lo, x));
  }

  function hexToRgb(hex) {
    const h = String(hex || "#7dff4a").replace("#", "");
    if (h.length !== 6) return [0.49, 1, 0.29];
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
  function scale(m, x, y, z) {
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

  function makeProgram(gl) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    return p;
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

  /**
   * Part in creature local space:
   * +X = forward (run), +Y = up, +Z = toward camera (thickness)
   * shade: RGB multipliers for two-tone look
   */
  function P(sx, sy, sz, tx, ty, tz, rx, ry, rz, shade) {
    return {
      sx,
      sy,
      sz,
      tx,
      ty,
      tz,
      rx: rx || 0,
      ry: ry || 0,
      rz: rz || 0,
      shade: shade || [1, 1, 1],
    };
  }

  function lean(t) {
    return Math.sin(t) * 0.12;
  }

  const ORIENTATIONS = new Set([
    "auto",
    "profile",
    "side",
    "fly",
    "top",
    "topRev",
  ]);

  function resolveOrientation(mode, effect, speciesId) {
    const m = ORIENTATIONS.has(mode) ? mode : "auto";
    if (m !== "auto") return m;
    if (effect === "dragon") return "fly";
    if (speciesId === "pteranodon") return "fly";
    if (speciesId === "deinosuchus") return "side";
    return "profile";
  }

  /**
   * Place a critter on the rim with the chosen viewing orientation.
   * Local model: +X forward, +Y up, +Z toward “thickness” / wingspan.
   */
  function placeOnRim(x, y, ang, sizeScale, orientation, flapPhase) {
    let root = ident();
    root = translate(root, x, y, 0);
    root = rotateZ(root, -ang);

    if (orientation === "fly") {
      // Lift off the rim and lay wings into the screen plane so soar reads clearly
      const bank = Math.sin(flapPhase || 0) * 0.12;
      root = translate(root, 0, 0.12, 0.28);
      root = rotateX(root, -Math.PI / 2 + 0.18);
      root = rotateZ(root, bank);
      root = rotateY(root, 0.15);
    } else if (orientation === "side") {
      // Stronger camera-facing turn so the full silhouette is obvious
      root = translate(root, 0, 0.04, 0.12);
      root = rotateY(root, 0.85);
      root = rotateX(root, -0.2);
    } else if (orientation === "top") {
      // Overhead: look down the creature’s back
      root = translate(root, 0, 0.06, 0.1);
      root = rotateX(root, -Math.PI / 2);
    } else if (orientation === "topRev") {
      // Flipped overhead (reverse roll)
      root = translate(root, 0, 0.06, 0.1);
      root = rotateX(root, Math.PI / 2);
      root = rotateZ(root, Math.PI);
    } else {
      // profile — feet on rim, head outward, slight 3D yaw
      root = translate(root, 0, 0.02, 0);
      root = rotateY(root, 0.35);
    }

    root = scale(root, sizeScale, sizeScale, sizeScale * 0.85);
    return root;
  }

  /** Side-profile western dragon — readable silhouette */
  function poseDragon(t) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const s2 = Math.sin(t * 2);
    const bob = Math.abs(s) * 0.05;
    const bodyLean = -0.08 + lean(t) * 0.35;
    const fThigh = 0.55 * s;
    const fShin = -0.75 * Math.max(0, s) - 0.15;
    const bThigh = -0.55 * s;
    const bShin = -0.75 * Math.max(0, -s) - 0.1;
    const wing = 0.55 + c * 0.75;
    const jaw = 0.15 + Math.max(0, -s) * 0.35;
    const belly = [1.2, 1.15, 0.85];
    const dark = [0.72, 0.78, 0.7];
    const wingC = [0.85, 0.7, 1.05];

    return [
      // torso
      P(0.72, 0.34, 0.28, 0.02, 0.34 + bob, 0, bodyLean, 0, 0, dark),
      P(0.5, 0.22, 0.24, 0.08, 0.24 + bob, 0, bodyLean + 0.05, 0, 0, belly),
      // chest / shoulders
      P(0.4, 0.36, 0.32, 0.38, 0.4 + bob, 0, bodyLean - 0.05, 0, 0, dark),
      // neck
      P(0.34, 0.18, 0.18, 0.68, 0.52 + bob, 0, 0.45 + s * 0.08, 0, 0, dark),
      // head + snout
      P(0.28, 0.22, 0.22, 0.92, 0.62 + bob, 0, 0.1, 0, 0, dark),
      P(0.26, 0.14, 0.16, 1.12, 0.58 + bob, 0, 0.05, 0, 0, belly),
      // jaw
      P(0.22, 0.08, 0.14, 1.08, 0.48 + bob, 0, jaw, 0, 0, [0.9, 0.85, 0.75]),
      // crest / horns
      P(0.08, 0.2, 0.08, 0.86, 0.78 + bob, 0.06, -0.35, 0.2, 0.15, wingC),
      P(0.08, 0.2, 0.08, 0.86, 0.78 + bob, -0.06, -0.35, -0.2, -0.15, wingC),
      // eye
      P(0.06, 0.06, 0.06, 1.0, 0.66 + bob, 0.1, 0, 0, 0, [1.6, 1.6, 0.5]),
      // wings (membrane plates)
      P(0.18, 0.55, 0.04, 0.2, 0.55 + bob, 0.18, 0.1, 0.35, -wing, wingC),
      P(0.14, 0.42, 0.03, 0.08, 0.7 + bob, 0.22, -0.2, 0.2, -wing * 0.7, wingC),
      P(0.18, 0.55, 0.04, 0.2, 0.55 + bob, -0.18, 0.1, -0.35, wing, wingC),
      P(0.14, 0.42, 0.03, 0.08, 0.7 + bob, -0.22, -0.2, -0.2, wing * 0.7, wingC),
      // front legs
      P(0.14, 0.28, 0.12, 0.42, 0.16 + bob * 0.4, 0.1, fThigh, 0, 0.05, dark),
      P(0.12, 0.24, 0.1, 0.48 + s * 0.06, 0.0, 0.1, fShin, 0, 0, dark),
      P(0.18, 0.07, 0.14, 0.56 + s * 0.08, -0.1, 0.1, 0.1, 0, 0, belly),
      P(0.14, 0.28, 0.12, 0.42, 0.16 + bob * 0.4, -0.1, -fThigh * 0.3, 0, -0.05, dark),
      P(0.12, 0.22, 0.1, 0.46, 0.02, -0.1, -0.2, 0, 0, dark),
      // hind legs (powerful)
      P(0.18, 0.34, 0.16, -0.12, 0.18 + bob * 0.3, 0.12, bThigh, 0, 0.05, dark),
      P(0.14, 0.28, 0.12, -0.02 - s * 0.06, -0.02, 0.12, bShin, 0, 0, dark),
      P(0.22, 0.08, 0.16, 0.08 - s * 0.08, -0.12, 0.12, 0.05, 0, 0, belly),
      P(0.18, 0.34, 0.16, -0.12, 0.18 + bob * 0.3, -0.12, -bThigh * 0.35, 0, -0.05, dark),
      // tail
      P(0.32, 0.16, 0.16, -0.42, 0.32 + bob, 0, 0.1 + s2 * 0.12, 0, s * 0.15, dark),
      P(0.28, 0.12, 0.12, -0.7, 0.36 + bob + s2 * 0.04, 0, 0.15 + s2 * 0.15, 0, s * 0.25, dark),
      P(0.22, 0.09, 0.09, -0.94, 0.42 + bob + s2 * 0.06, 0, 0.2 + s2 * 0.18, 0, s * 0.35, wingC),
      P(0.12, 0.2, 0.04, -1.08, 0.5 + bob, 0.05, 0.1, 0.4, s * 0.2, wingC),
      P(0.12, 0.2, 0.04, -1.08, 0.5 + bob, -0.05, 0.1, -0.4, s * 0.2, wingC),
    ];
  }

  function ensure(host) {
    let st = hosts.get(host);
    if (st) return st;

    const wrap = document.createElement("div");
    wrap.className = "bfx-dragon";
    const canvas = document.createElement("canvas");
    canvas.className = "bfx-dragon-canvas";
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      depth: true,
    });
    if (!gl) {
      wrap.remove();
      return null;
    }

    const prog = makeProgram(gl);
    const mesh = boxMesh();
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.norm, gl.STATIC_DRAW);

    st = {
      host,
      wrap,
      canvas,
      gl,
      prog,
      mesh,
      posBuf,
      normBuf,
      locs: {
        aPos: gl.getAttribLocation(prog, "aPos"),
        aNorm: gl.getAttribLocation(prog, "aNorm"),
        uMVP: gl.getUniformLocation(prog, "uMVP"),
        uN: gl.getUniformLocation(prog, "uN"),
        uColor: gl.getUniformLocation(prog, "uColor"),
        uShade: gl.getUniformLocation(prog, "uShade"),
        uIntensity: gl.getUniformLocation(prog, "uIntensity"),
      },
      opts: {},
      phases: [],
      active: false,
      raf: 0,
      t0: performance.now(),
      ro: null,
      _seedKey: "",
    };
    hosts.set(host, st);
    st.ro = new ResizeObserver(() => resize(st));
    st.ro.observe(host);
    resize(st);
    return st;
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

  function drawBox(st, model, color, shade, intensity, proj) {
    const { gl, locs, mesh } = st;
    const mvp = mul(proj, model);
    gl.uniformMatrix4fv(locs.uMVP, false, mvp);
    gl.uniformMatrix3fv(locs.uN, false, normalMat(model));
    gl.uniform3fv(locs.uColor, color);
    gl.uniform3fv(locs.uShade, shade);
    gl.uniform1f(locs.uIntensity, intensity);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  function frame(st, now) {
    st.raf = 0;
    if (!st.active) return;
    const { gl, prog, posBuf, normBuf, locs, opts } = st;
    resize(st);

    const speed = clamp(opts.speed ?? 1, 0.35, 2.5);
    const size = clamp(opts.size ?? 1, 0.5, 1.8);
    const intensity = clamp(opts.intensity ?? 1, 0.25, 1);
    const count = Math.round(clamp(opts.count ?? 2, 1, MAX_CRITTERS));
    const color = hexToRgb(opts.color);
    const effect = opts.effect === "dinosaur" ? "dinosaur" : "dragon";
    const speciesApi = window.IsleBorderFxDinoSpecies;
    const speciesPref =
      speciesApi?.normalizeSpecies(opts.dinoSpecies) || "triceratops";
    const elapsed = ((now - st.t0) / 1000) * speed;

    while (st.phases.length < count) {
      st.phases.push(
        opts.randomSpawn !== false
          ? Math.random() * Math.PI * 2
          : (st.phases.length / Math.max(1, count)) * Math.PI * 2
      );
    }
    st.phases.length = count;
    if (!st.speciesIds || st.speciesIds.length !== count) {
      st.speciesIds = [];
      for (let i = 0; i < count; i++) {
        st.speciesIds.push(
          speciesPref === "mix" && speciesApi
            ? speciesApi.pickMix(i, st.t0 | 0)
            : speciesPref
        );
      }
    }

    const aspect = st.canvas.width / Math.max(1, st.canvas.height);
    // Screen-space ortho: creatures sit on the rim in profile
    const viewH = 2.35;
    const viewW = viewH * aspect;
    const proj = ortho(-viewW / 2, viewW / 2, -viewH / 2, viewH / 2, -5, 5);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(locs.aPos);
    gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.enableVertexAttribArray(locs.aNorm);
    gl.vertexAttribPointer(locs.aNorm, 3, gl.FLOAT, false, 0, 0);

    // 0 = on rim; negative = inside; positive = outside (−30…30)
    const dist = clamp(opts.distance ?? 5, -30, 30);
    const radius = clamp(1.0 + dist * 0.008, 0.72, 1.28);
    const lap = elapsed * 0.7;
    const run = elapsed * 9.5;

    for (let i = 0; i < count; i++) {
      const ang = st.phases[i] + lap;
      // Rim position in XY (Y up on screen)
      const x = Math.sin(ang) * radius;
      const y = Math.cos(ang) * radius;
      const speciesId =
        effect === "dinosaur"
          ? st.speciesIds[i] || speciesPref
          : "dragon";
      const baseScale =
        effect === "dinosaur"
          ? (speciesApi?.scaleFor(speciesId) || 0.19) * size
          : 0.18 * size;
      const orientation = resolveOrientation(
        opts.orientation,
        effect,
        speciesId
      );
      const root = placeOnRim(
        x,
        y,
        ang,
        baseScale,
        orientation,
        run + i * 1.3
      );

      const pose =
        effect === "dinosaur" && speciesApi
          ? speciesApi.poseFor(speciesId, run + i * 1.9)
          : poseDragon(run + i * 1.7);

      for (const p of pose) {
        let m = root;
        // Local model: +X forward. After rotateZ(-ang), +X is tangent.
        m = translate(m, p.tx, p.ty, p.tz);
        m = rotateZ(m, p.rz);
        m = rotateY(m, p.ry);
        m = rotateX(m, p.rx);
        m = scale(m, p.sx, p.sy, p.sz);
        drawBox(st, m, color, p.shade, intensity, proj);
      }
    }

    st.raf = requestAnimationFrame((t) => frame(st, t));
  }

  function stop(st) {
    st.active = false;
    if (st.raf) {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    }
    if (st.wrap) st.wrap.hidden = true;
    if (st.gl) {
      st.gl.clearColor(0, 0, 0, 0);
      st.gl.clear(st.gl.COLOR_BUFFER_BIT | st.gl.DEPTH_BUFFER_BIT);
    }
  }

  function start(st) {
    st.wrap.hidden = false;
    if (st.active) return;
    st.active = true;
    st.t0 = performance.now();
    st.raf = requestAnimationFrame((t) => frame(st, t));
  }

  function reseedPhases(st, opts) {
    const count = Math.round(clamp(opts.count ?? 2, 1, MAX_CRITTERS));
    st.phases = [];
    for (let i = 0; i < count; i++) {
      st.phases.push(
        opts.randomSpawn !== false
          ? Math.random() * Math.PI * 2
          : (i / Math.max(1, count)) * Math.PI * 2
      );
    }
    st._seedKey = `${opts.effect}|${opts.dinoSpecies}|${count}|${
      opts.randomSpawn !== false
    }`;
    st.speciesIds = null;
  }

  function sync(host, opts = {}) {
    if (!host) return;
    const effect = String(opts.effect || "none");
    if (!EFFECTS.has(effect)) {
      const st = hosts.get(host);
      if (st) stop(st);
      return;
    }
    const st = ensure(host);
    if (!st) return;
    const count = Math.round(clamp(opts.count ?? 2, 1, MAX_CRITTERS));
    const seedKey = `${effect}|${opts.dinoSpecies}|${count}|${
      opts.randomSpawn !== false
    }`;
    const needSeed =
      opts._reseed || !st.phases.length || st._seedKey !== seedKey;
    st.opts = opts;
    if (needSeed) reseedPhases(st, opts);
    start(st);
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

  window.IsleBorderFxDragon = {
    sync,
    fromSettings,
    MAX_DRAGONS: MAX_CRITTERS,
    EFFECTS: [...EFFECTS],
  };
})();
