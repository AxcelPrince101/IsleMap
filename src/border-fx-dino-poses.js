/**
 * Isle-inspired procedural dino silhouettes for rim runners.
 * Side-profile parts: +X forward, +Y up, +Z toward camera.
 */
(function () {
  const SPECIES = Object.freeze([
    { id: "mix", label: "Mixed pack (Isle)" },
    { id: "omniraptor", label: "Omniraptor" },
    { id: "triceratops", label: "Triceratops" },
    { id: "stegosaurus", label: "Stegosaurus" },
    { id: "carnotaurus", label: "Carnotaurus" },
    { id: "dilophosaurus", label: "Dilophosaurus" },
    { id: "tyrannosaurus", label: "Tyrannosaurus" },
    { id: "ceratosaurus", label: "Ceratosaurus" },
    { id: "deinosuchus", label: "Deinosuchus" },
    { id: "gallimimus", label: "Gallimimus" },
    { id: "pachycephalosaurus", label: "Pachycephalosaurus" },
    { id: "maiasaura", label: "Maiasaura" },
    { id: "diabloceratops", label: "Diabloceratops" },
    { id: "hypsilophodon", label: "Hypsilophodon" },
    { id: "tenontosaurus", label: "Tenontosaurus" },
    { id: "pteranodon", label: "Pteranodon" },
  ]);

  const MIXABLE = SPECIES.map((s) => s.id).filter((id) => id !== "mix");

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

  const belly = [1.25, 1.15, 0.8];
  const dark = [0.7, 0.82, 0.68];
  const accent = [1.05, 0.75, 0.55];
  const horn = [1.15, 1.05, 0.7];
  const plate = [0.85, 0.95, 1.1];

  function bipedGait(t, power) {
    const p = power || 1;
    const s = Math.sin(t);
    const c = Math.cos(t);
    return {
      s,
      c,
      s2: Math.sin(t * 2),
      bob: Math.abs(s) * 0.06 * p,
      thigh: s * 0.85 * p,
      shin: -Math.max(0.12, s) * 1.05 * p - 0.22,
      thighB: -s * 0.85 * p,
      shinB: -Math.max(0.12, -s) * 1.05 * p - 0.22,
      jaw: 0.1 + Math.max(0, c) * 0.18,
      lean: 0.16 + s * 0.05,
    };
  }

  function quadGait(t) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    return {
      s,
      c,
      s2: Math.sin(t * 2),
      bob: Math.abs(s) * 0.035,
      fl: s * 0.55,
      fr: -s * 0.55,
      bl: -s * 0.5,
      br: s * 0.5,
    };
  }

  function poseOmniraptor(t) {
    const g = bipedGait(t, 1);
    return [
      P(0.55, 0.32, 0.26, 0.0, 0.42 + g.bob, 0, g.lean, 0, 0, dark),
      P(0.42, 0.2, 0.22, 0.06, 0.32 + g.bob, 0, g.lean + 0.05, 0, 0, belly),
      P(0.4, 0.3, 0.24, 0.38, 0.48 + g.bob, 0, g.lean - 0.05, 0, 0, dark),
      P(0.22, 0.16, 0.16, 0.62, 0.62 + g.bob, 0, -0.35 + g.s * 0.05, 0, 0, dark),
      P(0.2, 0.14, 0.14, 0.78, 0.72 + g.bob, 0, 0.25, 0, 0, dark),
      P(0.34, 0.24, 0.2, 1.0, 0.78 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.3, 0.14, 0.14, 1.22, 0.74 + g.bob, 0, 0.02, 0, 0, belly),
      P(0.26, 0.08, 0.12, 1.16, 0.64 + g.bob, 0, g.jaw, 0, 0, horn),
      P(0.07, 0.07, 0.07, 1.08, 0.84 + g.bob, 0.1, 0, 0, 0, [1.7, 1.5, 0.35]),
      P(0.16, 0.08, 0.08, 0.42, 0.38 + g.bob, 0.12, 0.9 + g.s * 0.2, 0.3, 0, dark),
      P(0.18, 0.36, 0.14, -0.02, 0.22 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.14, 0.3, 0.12, 0.1 + g.s * 0.1, 0.0, 0.1, g.shin, 0, 0, dark),
      P(0.24, 0.08, 0.14, 0.22 + g.s * 0.12, -0.12, 0.1, 0.15, 0, 0, belly),
      P(0.08, 0.12, 0.06, 0.32 + g.s * 0.12, -0.08, 0.12, 0.5, 0, 0, accent),
      P(0.18, 0.36, 0.14, -0.02, 0.22 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.14, 0.3, 0.12, 0.1 - g.s * 0.1, 0.0, -0.1, g.shinB, 0, 0, dark),
      P(0.24, 0.08, 0.14, 0.22 - g.s * 0.12, -0.12, -0.1, 0.15, 0, 0, belly),
      P(0.36, 0.16, 0.14, -0.4, 0.48 + g.bob, 0, -0.15 + g.s2 * 0.08, 0, g.s * 0.12, dark),
      P(0.32, 0.12, 0.11, -0.72, 0.52 + g.bob, 0, -0.05 + g.s2 * 0.1, 0, g.s * 0.2, dark),
      P(0.26, 0.09, 0.08, -1.0, 0.56 + g.bob, 0, 0.05 + g.s2 * 0.12, 0, g.s * 0.28, accent),
    ];
  }

  function poseTriceratops(t) {
    const g = quadGait(t);
    return [
      P(0.85, 0.42, 0.4, 0.05, 0.38 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.55, 0.28, 0.34, 0.1, 0.28 + g.bob, 0, 0.08, 0, 0, belly),
      P(0.45, 0.4, 0.38, 0.55, 0.42 + g.bob, 0, -0.05, 0, 0, dark),
      // frill
      P(0.12, 0.55, 0.55, 0.72, 0.7 + g.bob, 0, -0.15, 0, 0, plate),
      P(0.08, 0.2, 0.12, 0.7, 0.98 + g.bob, 0.18, -0.2, 0.2, 0, horn),
      P(0.08, 0.2, 0.12, 0.7, 0.98 + g.bob, -0.18, -0.2, -0.2, 0, horn),
      // horns
      P(0.1, 0.1, 0.42, 0.95, 0.62 + g.bob, 0.12, 0.55, 0.15, 0, horn),
      P(0.1, 0.1, 0.42, 0.95, 0.62 + g.bob, -0.12, 0.55, -0.15, 0, horn),
      P(0.1, 0.1, 0.28, 1.05, 0.48 + g.bob, 0, 0.85, 0, 0, horn),
      // head / beak
      P(0.36, 0.28, 0.3, 0.88, 0.48 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.22, 0.16, 0.2, 1.12, 0.4 + g.bob, 0, 0.2, 0, 0, belly),
      P(0.06, 0.06, 0.06, 0.92, 0.56 + g.bob, 0.14, 0, 0, 0, [1.6, 1.4, 0.4]),
      // legs
      P(0.18, 0.32, 0.16, 0.48, 0.14 + g.bob * 0.4, 0.14, g.fl, 0, 0.05, dark),
      P(0.16, 0.26, 0.14, 0.55 + g.s * 0.05, -0.04, 0.14, -0.15, 0, 0, dark),
      P(0.2, 0.08, 0.16, 0.62, -0.14, 0.14, 0, 0, 0, belly),
      P(0.18, 0.32, 0.16, 0.48, 0.14 + g.bob * 0.4, -0.14, g.fr, 0, -0.05, dark),
      P(0.16, 0.26, 0.14, 0.55 - g.s * 0.05, -0.04, -0.14, -0.15, 0, 0, dark),
      P(0.2, 0.08, 0.16, 0.62, -0.14, -0.14, 0, 0, 0, belly),
      P(0.2, 0.34, 0.18, -0.2, 0.16 + g.bob * 0.3, 0.16, g.bl, 0, 0.05, dark),
      P(0.18, 0.28, 0.16, -0.12 - g.s * 0.04, -0.02, 0.16, -0.1, 0, 0, dark),
      P(0.22, 0.08, 0.18, -0.04, -0.14, 0.16, 0, 0, 0, belly),
      P(0.2, 0.34, 0.18, -0.2, 0.16 + g.bob * 0.3, -0.16, g.br, 0, -0.05, dark),
      P(0.18, 0.28, 0.16, -0.12 + g.s * 0.04, -0.02, -0.16, -0.1, 0, 0, dark),
      P(0.22, 0.08, 0.18, -0.04, -0.14, -0.16, 0, 0, 0, belly),
      // short tail
      P(0.28, 0.18, 0.16, -0.5, 0.36 + g.bob, 0, 0.1 + g.s2 * 0.08, 0, g.s * 0.1, dark),
      P(0.2, 0.12, 0.12, -0.72, 0.38 + g.bob, 0, 0.15, 0, g.s * 0.15, dark),
    ];
  }

  function poseStegosaurus(t) {
    const g = quadGait(t * 0.9);
    const parts = [
      P(0.95, 0.36, 0.34, 0.0, 0.34 + g.bob, 0, 0.02, 0, 0, dark),
      P(0.6, 0.22, 0.28, 0.05, 0.24 + g.bob, 0, 0.05, 0, 0, belly),
      P(0.4, 0.3, 0.28, 0.55, 0.36 + g.bob, 0, -0.08, 0, 0, dark),
      P(0.28, 0.22, 0.2, 0.82, 0.4 + g.bob, 0, 0.15, 0, 0, dark),
      P(0.2, 0.14, 0.14, 1.0, 0.36 + g.bob, 0, 0.25, 0, 0, belly),
      P(0.05, 0.05, 0.05, 0.9, 0.46 + g.bob, 0.1, 0, 0, 0, [1.5, 1.3, 0.4]),
    ];
    // back plates
    const plateXs = [-0.35, -0.15, 0.05, 0.25, 0.42];
    plateXs.forEach((x, i) => {
      const h = 0.28 + (i % 2) * 0.1;
      parts.push(
        P(0.08, h, 0.22, x, 0.55 + g.bob + h * 0.15, 0.02, -0.05, 0.1, 0, plate)
      );
      parts.push(
        P(0.08, h * 0.85, 0.2, x + 0.06, 0.52 + g.bob, -0.02, -0.05, -0.1, 0, plate)
      );
    });
    // thagomizer
    parts.push(
      P(0.35, 0.14, 0.14, -0.55, 0.3 + g.bob, 0, 0.05 + g.s2 * 0.1, 0, g.s * 0.12, dark),
      P(0.28, 0.1, 0.1, -0.82, 0.28 + g.bob, 0, 0.08, 0, g.s * 0.18, dark),
      P(0.06, 0.06, 0.28, -0.95, 0.34 + g.bob, 0.1, 0.4, 0.3, 0, horn),
      P(0.06, 0.06, 0.28, -0.95, 0.34 + g.bob, -0.1, 0.4, -0.3, 0, horn),
      P(0.06, 0.06, 0.24, -1.05, 0.3 + g.bob, 0.08, 0.55, 0.2, 0, horn),
      P(0.06, 0.06, 0.24, -1.05, 0.3 + g.bob, -0.08, 0.55, -0.2, 0, horn)
    );
    // legs
    [
      [0.45, 0.14, g.fl],
      [0.45, -0.14, g.fr],
      [-0.25, 0.16, g.bl],
      [-0.25, -0.16, g.br],
    ].forEach(([x, z, swing]) => {
      parts.push(
        P(0.16, 0.3, 0.14, x, 0.12 + g.bob * 0.3, z, swing, 0, z > 0 ? 0.04 : -0.04, dark),
        P(0.14, 0.24, 0.12, x + 0.06, -0.04, z, -0.12, 0, 0, dark),
        P(0.18, 0.07, 0.14, x + 0.12, -0.14, z, 0, 0, 0, belly)
      );
    });
    return parts;
  }

  function poseCarnotaurus(t) {
    const g = bipedGait(t, 1.05);
    return [
      P(0.6, 0.36, 0.3, 0.0, 0.44 + g.bob, 0, g.lean, 0, 0, dark),
      P(0.45, 0.22, 0.24, 0.08, 0.32 + g.bob, 0, g.lean + 0.05, 0, 0, belly),
      P(0.48, 0.38, 0.32, 0.42, 0.5 + g.bob, 0, g.lean - 0.04, 0, 0, dark),
      P(0.2, 0.18, 0.18, 0.7, 0.62 + g.bob, 0, 0.2, 0, 0, dark),
      P(0.4, 0.3, 0.26, 0.95, 0.7 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.32, 0.16, 0.18, 1.2, 0.64 + g.bob, 0, 0.08, 0, 0, belly),
      P(0.28, 0.1, 0.16, 1.14, 0.54 + g.bob, 0, g.jaw, 0, 0, horn),
      // brow horns
      P(0.08, 0.16, 0.1, 0.9, 0.9 + g.bob, 0.12, -0.5, 0.25, 0, horn),
      P(0.08, 0.16, 0.1, 0.9, 0.9 + g.bob, -0.12, -0.5, -0.25, 0, horn),
      P(0.07, 0.07, 0.07, 1.02, 0.78 + g.bob, 0.12, 0, 0, 0, [1.7, 1.4, 0.35]),
      // tiny arms
      P(0.1, 0.08, 0.08, 0.48, 0.36 + g.bob, 0.14, 1.1, 0.4, 0, dark),
      P(0.1, 0.08, 0.08, 0.48, 0.36 + g.bob, -0.14, 1.1, -0.4, 0, dark),
      P(0.2, 0.4, 0.16, -0.02, 0.2 + g.bob * 0.3, 0.12, g.thigh, 0, 0.04, dark),
      P(0.16, 0.32, 0.14, 0.12 + g.s * 0.1, -0.02, 0.12, g.shin, 0, 0, dark),
      P(0.26, 0.08, 0.16, 0.26 + g.s * 0.12, -0.14, 0.12, 0.1, 0, 0, belly),
      P(0.2, 0.4, 0.16, -0.02, 0.2 + g.bob * 0.3, -0.12, g.thighB, 0, -0.04, dark),
      P(0.16, 0.32, 0.14, 0.12 - g.s * 0.1, -0.02, -0.12, g.shinB, 0, 0, dark),
      P(0.26, 0.08, 0.16, 0.26 - g.s * 0.12, -0.14, -0.12, 0.1, 0, 0, belly),
      P(0.4, 0.16, 0.14, -0.45, 0.46 + g.bob, 0, -0.1 + g.s2 * 0.08, 0, g.s * 0.12, dark),
      P(0.34, 0.12, 0.1, -0.78, 0.5 + g.bob, 0, 0.05 + g.s2 * 0.1, 0, g.s * 0.22, dark),
      P(0.24, 0.08, 0.08, -1.05, 0.52 + g.bob, 0, 0.1, 0, g.s * 0.3, accent),
    ];
  }

  function poseDilophosaurus(t) {
    const g = bipedGait(t, 0.95);
    return [
      P(0.5, 0.28, 0.22, 0.0, 0.4 + g.bob, 0, g.lean, 0, 0, dark),
      P(0.38, 0.18, 0.18, 0.05, 0.3 + g.bob, 0, g.lean + 0.04, 0, 0, belly),
      P(0.36, 0.26, 0.2, 0.38, 0.46 + g.bob, 0, g.lean - 0.04, 0, 0, dark),
      P(0.28, 0.14, 0.14, 0.65, 0.58 + g.bob, 0, 0.15, 0, 0, dark),
      P(0.32, 0.22, 0.18, 0.92, 0.68 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.28, 0.12, 0.12, 1.14, 0.64 + g.bob, 0, 0.05, 0, 0, belly),
      P(0.22, 0.07, 0.1, 1.08, 0.54 + g.bob, 0, g.jaw, 0, 0, horn),
      // twin crests
      P(0.22, 0.2, 0.04, 0.95, 0.88 + g.bob, 0.08, -0.25, 0.15, 0, accent),
      P(0.22, 0.2, 0.04, 0.95, 0.88 + g.bob, -0.08, -0.25, -0.15, 0, accent),
      P(0.06, 0.06, 0.06, 1.0, 0.74 + g.bob, 0.1, 0, 0, 0, [1.6, 1.5, 0.4]),
      P(0.14, 0.1, 0.08, 0.42, 0.34 + g.bob, 0.12, 0.9, 0.25, 0, dark),
      P(0.16, 0.34, 0.12, -0.02, 0.2 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.13, 0.28, 0.1, 0.1 + g.s * 0.08, 0.0, 0.1, g.shin, 0, 0, dark),
      P(0.2, 0.07, 0.12, 0.2 + g.s * 0.1, -0.12, 0.1, 0.12, 0, 0, belly),
      P(0.16, 0.34, 0.12, -0.02, 0.2 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.13, 0.28, 0.1, 0.1 - g.s * 0.08, 0.0, -0.1, g.shinB, 0, 0, dark),
      P(0.2, 0.07, 0.12, 0.2 - g.s * 0.1, -0.12, -0.1, 0.12, 0, 0, belly),
      P(0.34, 0.12, 0.1, -0.4, 0.42 + g.bob, 0, -0.1 + g.s2 * 0.08, 0, g.s * 0.14, dark),
      P(0.3, 0.09, 0.08, -0.7, 0.46 + g.bob, 0, 0.05, 0, g.s * 0.22, dark),
      P(0.22, 0.07, 0.06, -0.95, 0.48 + g.bob, 0, 0.1, 0, g.s * 0.3, accent),
    ];
  }

  function poseTyrannosaurus(t) {
    const g = bipedGait(t, 1.1);
    return [
      P(0.7, 0.4, 0.34, 0.0, 0.48 + g.bob, 0, g.lean * 0.7, 0, 0, dark),
      P(0.5, 0.24, 0.28, 0.08, 0.34 + g.bob, 0, g.lean * 0.7 + 0.04, 0, 0, belly),
      P(0.55, 0.42, 0.36, 0.45, 0.55 + g.bob, 0, g.lean * 0.5, 0, 0, dark),
      P(0.28, 0.24, 0.24, 0.78, 0.72 + g.bob, 0, 0.25, 0, 0, dark),
      // massive head
      P(0.55, 0.38, 0.34, 1.1, 0.82 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.4, 0.2, 0.22, 1.4, 0.74 + g.bob, 0, 0.05, 0, 0, belly),
      P(0.38, 0.12, 0.2, 1.32, 0.6 + g.bob, 0, g.jaw + 0.05, 0, 0, horn),
      P(0.08, 0.08, 0.08, 1.2, 0.92 + g.bob, 0.14, 0, 0, 0, [1.7, 1.4, 0.3]),
      // comically small arms
      P(0.12, 0.08, 0.08, 0.5, 0.4 + g.bob, 0.16, 1.2, 0.35, 0, dark),
      P(0.1, 0.06, 0.06, 0.58, 0.34 + g.bob, 0.18, 1.4, 0.2, 0, belly),
      P(0.12, 0.08, 0.08, 0.5, 0.4 + g.bob, -0.16, 1.2, -0.35, 0, dark),
      P(0.22, 0.42, 0.18, -0.05, 0.22 + g.bob * 0.3, 0.12, g.thigh, 0, 0.04, dark),
      P(0.18, 0.34, 0.16, 0.12 + g.s * 0.1, -0.02, 0.12, g.shin, 0, 0, dark),
      P(0.28, 0.09, 0.18, 0.28 + g.s * 0.12, -0.15, 0.12, 0.1, 0, 0, belly),
      P(0.22, 0.42, 0.18, -0.05, 0.22 + g.bob * 0.3, -0.12, g.thighB, 0, -0.04, dark),
      P(0.18, 0.34, 0.16, 0.12 - g.s * 0.1, -0.02, -0.12, g.shinB, 0, 0, dark),
      P(0.28, 0.09, 0.18, 0.28 - g.s * 0.12, -0.15, -0.12, 0.1, 0, 0, belly),
      P(0.45, 0.18, 0.16, -0.5, 0.5 + g.bob, 0, -0.12 + g.s2 * 0.06, 0, g.s * 0.1, dark),
      P(0.38, 0.14, 0.12, -0.88, 0.54 + g.bob, 0, 0.02, 0, g.s * 0.18, dark),
      P(0.28, 0.1, 0.1, -1.18, 0.56 + g.bob, 0, 0.08, 0, g.s * 0.26, accent),
    ];
  }

  function poseCeratosaurus(t) {
    const g = bipedGait(t, 1);
    return [
      ...poseOmniraptor(t).slice(0, 8),
      // nose horn + brow ridges instead of generic crest
      P(0.08, 0.18, 0.08, 1.15, 0.86 + g.bob, 0, -0.2, 0, 0, horn),
      P(0.1, 0.08, 0.08, 1.0, 0.9 + g.bob, 0.1, -0.35, 0.2, 0, accent),
      P(0.1, 0.08, 0.08, 1.0, 0.9 + g.bob, -0.1, -0.35, -0.2, 0, accent),
      P(0.07, 0.07, 0.07, 1.08, 0.84 + g.bob, 0.1, 0, 0, 0, [1.7, 1.5, 0.35]),
      P(0.16, 0.08, 0.08, 0.42, 0.38 + g.bob, 0.12, 0.9 + g.s * 0.2, 0.3, 0, dark),
      P(0.18, 0.36, 0.14, -0.02, 0.22 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.14, 0.3, 0.12, 0.1 + g.s * 0.1, 0.0, 0.1, g.shin, 0, 0, dark),
      P(0.24, 0.08, 0.14, 0.22 + g.s * 0.12, -0.12, 0.1, 0.15, 0, 0, belly),
      P(0.18, 0.36, 0.14, -0.02, 0.22 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.14, 0.3, 0.12, 0.1 - g.s * 0.1, 0.0, -0.1, g.shinB, 0, 0, dark),
      P(0.24, 0.08, 0.14, 0.22 - g.s * 0.12, -0.12, -0.1, 0.15, 0, 0, belly),
      P(0.36, 0.16, 0.14, -0.4, 0.48 + g.bob, 0, -0.15 + g.s2 * 0.08, 0, g.s * 0.12, dark),
      P(0.32, 0.12, 0.11, -0.72, 0.52 + g.bob, 0, -0.05 + g.s2 * 0.1, 0, g.s * 0.2, dark),
      // osteoderm ridge on tail
      P(0.08, 0.1, 0.08, -0.55, 0.6 + g.bob, 0, 0, 0, 0, plate),
      P(0.08, 0.1, 0.08, -0.75, 0.62 + g.bob, 0, 0, 0, 0, plate),
      P(0.26, 0.09, 0.08, -1.0, 0.56 + g.bob, 0, 0.05 + g.s2 * 0.12, 0, g.s * 0.28, accent),
    ];
  }

  function poseDeinosuchus(t) {
    const g = quadGait(t * 0.85);
    return [
      P(1.1, 0.28, 0.32, 0.1, 0.22 + g.bob, 0, 0.02, 0, 0, dark),
      P(0.7, 0.16, 0.26, 0.15, 0.14 + g.bob, 0, 0.04, 0, 0, belly),
      // long snout
      P(0.7, 0.18, 0.2, 0.85, 0.26 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.55, 0.12, 0.14, 1.35, 0.22 + g.bob, 0, 0.05, 0, 0, belly),
      P(0.45, 0.08, 0.12, 1.25, 0.14 + g.bob, 0, 0.15 + Math.max(0, g.c) * 0.15, 0, 0, horn),
      P(0.05, 0.05, 0.05, 0.95, 0.32 + g.bob, 0.1, 0, 0, 0, [1.5, 1.3, 0.35]),
      // scute bumps
      P(0.12, 0.08, 0.12, 0.2, 0.38 + g.bob, 0, 0, 0, 0, plate),
      P(0.12, 0.08, 0.12, 0.0, 0.38 + g.bob, 0, 0, 0, 0, plate),
      P(0.12, 0.08, 0.12, -0.2, 0.36 + g.bob, 0, 0, 0, 0, plate),
      // sprawling legs
      P(0.14, 0.12, 0.28, 0.55, 0.1 + g.bob * 0.3, 0.22, 0.2, 0.6, g.fl * 0.5, dark),
      P(0.12, 0.08, 0.18, 0.7, 0.02, 0.32, 0.1, 0.3, 0, belly),
      P(0.14, 0.12, 0.28, 0.55, 0.1 + g.bob * 0.3, -0.22, 0.2, -0.6, g.fr * 0.5, dark),
      P(0.12, 0.08, 0.18, 0.7, 0.02, -0.32, 0.1, -0.3, 0, belly),
      P(0.14, 0.12, 0.28, -0.15, 0.1 + g.bob * 0.3, 0.22, 0.15, 0.55, g.bl * 0.5, dark),
      P(0.12, 0.08, 0.18, -0.02, 0.02, 0.32, 0.1, 0.25, 0, belly),
      P(0.14, 0.12, 0.28, -0.15, 0.1 + g.bob * 0.3, -0.22, 0.15, -0.55, g.br * 0.5, dark),
      P(0.12, 0.08, 0.18, -0.02, 0.02, -0.32, 0.1, -0.25, 0, belly),
      // long tail
      P(0.4, 0.16, 0.16, -0.55, 0.22 + g.bob, 0, 0.05 + g.s2 * 0.1, 0, g.s * 0.2, dark),
      P(0.36, 0.12, 0.12, -0.9, 0.2 + g.bob, 0, 0.08, 0, g.s * 0.3, dark),
      P(0.28, 0.09, 0.09, -1.2, 0.18 + g.bob, 0, 0.1, 0, g.s * 0.4, accent),
    ];
  }

  function poseGallimimus(t) {
    const g = bipedGait(t * 1.15, 0.85);
    return [
      P(0.4, 0.24, 0.18, 0.0, 0.5 + g.bob, 0, g.lean + 0.05, 0, 0, dark),
      P(0.3, 0.14, 0.14, 0.04, 0.4 + g.bob, 0, g.lean + 0.08, 0, 0, belly),
      // long neck
      P(0.14, 0.14, 0.12, 0.28, 0.7 + g.bob, 0, -0.5, 0, 0, dark),
      P(0.12, 0.12, 0.1, 0.42, 0.92 + g.bob, 0, -0.15, 0, 0, dark),
      P(0.12, 0.12, 0.1, 0.55, 1.08 + g.bob, 0, 0.25, 0, 0, dark),
      P(0.22, 0.16, 0.14, 0.72, 1.12 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.18, 0.1, 0.1, 0.88, 1.08 + g.bob, 0, 0.15, 0, 0, belly),
      P(0.05, 0.05, 0.05, 0.78, 1.18 + g.bob, 0.08, 0, 0, 0, [1.5, 1.4, 0.4]),
      // arms
      P(0.2, 0.08, 0.08, 0.2, 0.42 + g.bob, 0.12, 0.7 + g.s * 0.2, 0.3, 0, dark),
      P(0.2, 0.08, 0.08, 0.2, 0.42 + g.bob, -0.12, 0.7 - g.s * 0.2, -0.3, 0, dark),
      // long legs
      P(0.14, 0.42, 0.12, -0.02, 0.24 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.12, 0.38, 0.1, 0.1 + g.s * 0.12, -0.02, 0.1, g.shin, 0, 0, dark),
      P(0.2, 0.06, 0.12, 0.22 + g.s * 0.14, -0.16, 0.1, 0.15, 0, 0, belly),
      P(0.14, 0.42, 0.12, -0.02, 0.24 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.12, 0.38, 0.1, 0.1 - g.s * 0.12, -0.02, -0.1, g.shinB, 0, 0, dark),
      P(0.2, 0.06, 0.12, 0.22 - g.s * 0.14, -0.16, -0.1, 0.15, 0, 0, belly),
      P(0.4, 0.12, 0.1, -0.4, 0.52 + g.bob, 0, -0.05 + g.s2 * 0.08, 0, g.s * 0.15, dark),
      P(0.32, 0.09, 0.08, -0.72, 0.54 + g.bob, 0, 0.05, 0, g.s * 0.25, dark),
      P(0.22, 0.07, 0.06, -0.98, 0.54 + g.bob, 0, 0.08, 0, g.s * 0.32, accent),
    ];
  }

  function posePachycephalosaurus(t) {
    const g = bipedGait(t, 0.9);
    return [
      P(0.48, 0.3, 0.24, 0.0, 0.42 + g.bob, 0, g.lean, 0, 0, dark),
      P(0.36, 0.18, 0.2, 0.05, 0.32 + g.bob, 0, g.lean + 0.04, 0, 0, belly),
      P(0.36, 0.28, 0.22, 0.38, 0.48 + g.bob, 0, g.lean - 0.04, 0, 0, dark),
      P(0.22, 0.18, 0.16, 0.62, 0.6 + g.bob, 0, 0.15, 0, 0, dark),
      // dome skull
      P(0.32, 0.36, 0.28, 0.9, 0.78 + g.bob, 0, -0.15, 0, 0, plate),
      P(0.28, 0.2, 0.2, 0.95, 0.58 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.18, 0.12, 0.14, 1.12, 0.54 + g.bob, 0, 0.15, 0, 0, belly),
      P(0.06, 0.06, 0.06, 0.98, 0.7 + g.bob, 0.12, 0, 0, 0, [1.5, 1.3, 0.4]),
      // knobs
      P(0.08, 0.08, 0.08, 0.82, 0.92 + g.bob, 0.1, 0, 0, 0, horn),
      P(0.08, 0.08, 0.08, 0.82, 0.92 + g.bob, -0.1, 0, 0, 0, horn),
      P(0.14, 0.08, 0.08, 0.4, 0.36 + g.bob, 0.12, 0.85, 0.25, 0, dark),
      P(0.16, 0.34, 0.12, -0.02, 0.2 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.13, 0.28, 0.1, 0.1 + g.s * 0.08, 0.0, 0.1, g.shin, 0, 0, dark),
      P(0.2, 0.07, 0.12, 0.2 + g.s * 0.1, -0.12, 0.1, 0.12, 0, 0, belly),
      P(0.16, 0.34, 0.12, -0.02, 0.2 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.13, 0.28, 0.1, 0.1 - g.s * 0.08, 0.0, -0.1, g.shinB, 0, 0, dark),
      P(0.2, 0.07, 0.12, 0.2 - g.s * 0.1, -0.12, -0.1, 0.12, 0, 0, belly),
      P(0.34, 0.14, 0.12, -0.4, 0.46 + g.bob, 0, -0.1 + g.s2 * 0.08, 0, g.s * 0.12, dark),
      P(0.28, 0.1, 0.1, -0.7, 0.5 + g.bob, 0, 0.05, 0, g.s * 0.2, dark),
      P(0.2, 0.08, 0.08, -0.95, 0.52 + g.bob, 0, 0.1, 0, g.s * 0.28, accent),
    ];
  }

  function poseMaiasaura(t) {
    const g = quadGait(t);
    return [
      P(0.8, 0.36, 0.32, 0.05, 0.36 + g.bob, 0, 0.04, 0, 0, dark),
      P(0.5, 0.22, 0.26, 0.1, 0.26 + g.bob, 0, 0.06, 0, 0, belly),
      P(0.4, 0.34, 0.28, 0.55, 0.42 + g.bob, 0, -0.05, 0, 0, dark),
      P(0.28, 0.22, 0.2, 0.82, 0.52 + g.bob, 0, 0.1, 0, 0, dark),
      // duckbill + crest
      P(0.4, 0.22, 0.22, 1.05, 0.5 + g.bob, 0, 0.08, 0, 0, dark),
      P(0.35, 0.12, 0.16, 1.3, 0.44 + g.bob, 0, 0.1, 0, 0, belly),
      P(0.12, 0.22, 0.1, 1.0, 0.72 + g.bob, 0, -0.35, 0, 0, accent),
      P(0.05, 0.05, 0.05, 1.1, 0.58 + g.bob, 0.12, 0, 0, 0, [1.5, 1.3, 0.4]),
      P(0.16, 0.3, 0.14, 0.5, 0.14 + g.bob * 0.3, 0.14, g.fl, 0, 0.04, dark),
      P(0.14, 0.24, 0.12, 0.58, -0.02, 0.14, -0.12, 0, 0, dark),
      P(0.18, 0.07, 0.14, 0.66, -0.12, 0.14, 0, 0, 0, belly),
      P(0.16, 0.3, 0.14, 0.5, 0.14 + g.bob * 0.3, -0.14, g.fr, 0, -0.04, dark),
      P(0.14, 0.24, 0.12, 0.58, -0.02, -0.14, -0.12, 0, 0, dark),
      P(0.18, 0.07, 0.14, 0.66, -0.12, -0.14, 0, 0, 0, belly),
      P(0.18, 0.32, 0.16, -0.2, 0.16 + g.bob * 0.3, 0.15, g.bl, 0, 0.04, dark),
      P(0.16, 0.26, 0.14, -0.1, -0.02, 0.15, -0.1, 0, 0, dark),
      P(0.2, 0.08, 0.16, 0.0, -0.12, 0.15, 0, 0, 0, belly),
      P(0.18, 0.32, 0.16, -0.2, 0.16 + g.bob * 0.3, -0.15, g.br, 0, -0.04, dark),
      P(0.16, 0.26, 0.14, -0.1, -0.02, -0.15, -0.1, 0, 0, dark),
      P(0.2, 0.08, 0.16, 0.0, -0.12, -0.15, 0, 0, 0, belly),
      P(0.35, 0.16, 0.14, -0.5, 0.38 + g.bob, 0, 0.08 + g.s2 * 0.08, 0, g.s * 0.12, dark),
      P(0.28, 0.12, 0.1, -0.78, 0.4 + g.bob, 0, 0.12, 0, g.s * 0.2, dark),
      P(0.2, 0.09, 0.08, -1.0, 0.42 + g.bob, 0, 0.15, 0, g.s * 0.28, accent),
    ];
  }

  function poseDiabloceratops(t) {
    const base = poseTriceratops(t);
    const g = quadGait(t);
    // taller brow horns, smaller nose horn vibe
    return [
      ...base.filter((_, i) => i < 6 || i > 10),
      P(0.1, 0.12, 0.5, 0.9, 0.75 + g.bob, 0.14, 0.35, 0.2, 0, horn),
      P(0.1, 0.12, 0.5, 0.9, 0.75 + g.bob, -0.14, 0.35, -0.2, 0, horn),
      P(0.08, 0.08, 0.2, 1.02, 0.5 + g.bob, 0, 0.7, 0, 0, horn),
      P(0.36, 0.28, 0.3, 0.88, 0.48 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.22, 0.16, 0.2, 1.12, 0.4 + g.bob, 0, 0.2, 0, 0, belly),
    ];
  }

  function poseHypsilophodon(t) {
    const g = bipedGait(t * 1.25, 0.75);
    return [
      P(0.32, 0.2, 0.14, 0.0, 0.36 + g.bob, 0, g.lean + 0.05, 0, 0, dark),
      P(0.24, 0.12, 0.12, 0.04, 0.28 + g.bob, 0, g.lean + 0.08, 0, 0, belly),
      P(0.24, 0.18, 0.14, 0.28, 0.4 + g.bob, 0, g.lean, 0, 0, dark),
      P(0.14, 0.12, 0.1, 0.45, 0.5 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.18, 0.14, 0.12, 0.6, 0.56 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.14, 0.08, 0.08, 0.72, 0.52 + g.bob, 0, 0.1, 0, 0, belly),
      P(0.04, 0.04, 0.04, 0.64, 0.62 + g.bob, 0.08, 0, 0, 0, [1.5, 1.4, 0.4]),
      P(0.12, 0.06, 0.06, 0.28, 0.3 + g.bob, 0.1, 0.8, 0.25, 0, dark),
      P(0.12, 0.3, 0.1, -0.02, 0.16 + g.bob * 0.3, 0.08, g.thigh, 0, 0.03, dark),
      P(0.1, 0.26, 0.08, 0.08 + g.s * 0.08, -0.02, 0.08, g.shin, 0, 0, dark),
      P(0.14, 0.05, 0.1, 0.16 + g.s * 0.1, -0.12, 0.08, 0.12, 0, 0, belly),
      P(0.12, 0.3, 0.1, -0.02, 0.16 + g.bob * 0.3, -0.08, g.thighB, 0, -0.03, dark),
      P(0.1, 0.26, 0.08, 0.08 - g.s * 0.08, -0.02, -0.08, g.shinB, 0, 0, dark),
      P(0.14, 0.05, 0.1, 0.16 - g.s * 0.1, -0.12, -0.08, 0.12, 0, 0, belly),
      P(0.28, 0.1, 0.08, -0.3, 0.38 + g.bob, 0, -0.05 + g.s2 * 0.1, 0, g.s * 0.18, dark),
      P(0.22, 0.08, 0.06, -0.52, 0.4 + g.bob, 0, 0.05, 0, g.s * 0.28, accent),
    ];
  }

  function poseTenontosaurus(t) {
    const g = bipedGait(t * 0.95, 0.85);
    // often bipedal with long tail
    return [
      P(0.55, 0.32, 0.26, 0.0, 0.42 + g.bob, 0, g.lean * 0.6, 0, 0, dark),
      P(0.4, 0.2, 0.22, 0.06, 0.32 + g.bob, 0, g.lean * 0.6 + 0.04, 0, 0, belly),
      P(0.4, 0.3, 0.24, 0.4, 0.48 + g.bob, 0, g.lean * 0.4, 0, 0, dark),
      P(0.24, 0.2, 0.18, 0.68, 0.58 + g.bob, 0, 0.1, 0, 0, dark),
      P(0.3, 0.22, 0.2, 0.92, 0.62 + g.bob, 0, 0.05, 0, 0, dark),
      P(0.26, 0.12, 0.14, 1.14, 0.56 + g.bob, 0, 0.1, 0, 0, belly),
      P(0.05, 0.05, 0.05, 0.98, 0.7 + g.bob, 0.1, 0, 0, 0, [1.5, 1.3, 0.4]),
      P(0.16, 0.1, 0.08, 0.42, 0.36 + g.bob, 0.12, 0.7, 0.25, 0, dark),
      P(0.16, 0.34, 0.14, -0.02, 0.2 + g.bob * 0.3, 0.1, g.thigh, 0, 0.04, dark),
      P(0.14, 0.28, 0.12, 0.1 + g.s * 0.08, 0.0, 0.1, g.shin, 0, 0, dark),
      P(0.22, 0.07, 0.14, 0.22 + g.s * 0.1, -0.12, 0.1, 0.12, 0, 0, belly),
      P(0.16, 0.34, 0.14, -0.02, 0.2 + g.bob * 0.3, -0.1, g.thighB, 0, -0.04, dark),
      P(0.14, 0.28, 0.12, 0.1 - g.s * 0.08, 0.0, -0.1, g.shinB, 0, 0, dark),
      P(0.22, 0.07, 0.14, 0.22 - g.s * 0.1, -0.12, -0.1, 0.12, 0, 0, belly),
      // very long tail
      P(0.4, 0.14, 0.12, -0.45, 0.44 + g.bob, 0, -0.08 + g.s2 * 0.06, 0, g.s * 0.12, dark),
      P(0.38, 0.11, 0.1, -0.82, 0.46 + g.bob, 0, 0.0, 0, g.s * 0.2, dark),
      P(0.32, 0.09, 0.08, -1.15, 0.46 + g.bob, 0, 0.05, 0, g.s * 0.28, dark),
      P(0.24, 0.07, 0.06, -1.42, 0.46 + g.bob, 0, 0.08, 0, g.s * 0.35, accent),
    ];
  }

  function posePteranodon(t) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const bob = Math.sin(t * 0.5) * 0.04;
    const flap = 0.35 + c * 0.55;
    return [
      P(0.45, 0.16, 0.14, 0.1, 0.5 + bob, 0, 0.05, 0, 0, dark),
      P(0.28, 0.1, 0.1, 0.15, 0.44 + bob, 0, 0.08, 0, 0, belly),
      // crest + beak
      P(0.35, 0.12, 0.1, 0.55, 0.55 + bob, 0, 0.1, 0, 0, dark),
      P(0.4, 0.08, 0.08, 0.9, 0.52 + bob, 0, 0.05, 0, 0, belly),
      P(0.08, 0.28, 0.06, 0.45, 0.75 + bob, 0, -0.55, 0, 0, accent),
      P(0.04, 0.04, 0.04, 0.6, 0.6 + bob, 0.08, 0, 0, 0, [1.5, 1.3, 0.4]),
      // wings
      P(0.2, 0.08, 0.9, 0.15, 0.55 + bob, 0.35, 0.1, 0.15, -flap, plate),
      P(0.16, 0.06, 0.7, -0.05, 0.58 + bob, 0.55, 0.05, 0.1, -flap * 0.8, plate),
      P(0.2, 0.08, 0.9, 0.15, 0.55 + bob, -0.35, 0.1, -0.15, flap, plate),
      P(0.16, 0.06, 0.7, -0.05, 0.58 + bob, -0.55, 0.05, -0.1, flap * 0.8, plate),
      // legs tucked
      P(0.1, 0.16, 0.08, -0.05, 0.38 + bob, 0.08, 0.9 + s * 0.1, 0.2, 0, dark),
      P(0.1, 0.16, 0.08, -0.05, 0.38 + bob, -0.08, 0.9 - s * 0.1, -0.2, 0, dark),
      // short tail
      P(0.16, 0.08, 0.08, -0.25, 0.48 + bob, 0, 0.1, 0, s * 0.1, dark),
    ];
  }

  const POSES = {
    omniraptor: poseOmniraptor,
    triceratops: poseTriceratops,
    stegosaurus: poseStegosaurus,
    carnotaurus: poseCarnotaurus,
    dilophosaurus: poseDilophosaurus,
    tyrannosaurus: poseTyrannosaurus,
    ceratosaurus: poseCeratosaurus,
    deinosuchus: poseDeinosuchus,
    gallimimus: poseGallimimus,
    pachycephalosaurus: posePachycephalosaurus,
    maiasaura: poseMaiasaura,
    diabloceratops: poseDiabloceratops,
    hypsilophodon: poseHypsilophodon,
    tenontosaurus: poseTenontosaurus,
    pteranodon: posePteranodon,
  };

  const SCALES = {
    omniraptor: 0.2,
    triceratops: 0.18,
    stegosaurus: 0.17,
    carnotaurus: 0.2,
    dilophosaurus: 0.19,
    tyrannosaurus: 0.19,
    ceratosaurus: 0.2,
    deinosuchus: 0.16,
    gallimimus: 0.18,
    pachycephalosaurus: 0.19,
    maiasaura: 0.17,
    diabloceratops: 0.18,
    hypsilophodon: 0.16,
    tenontosaurus: 0.18,
    pteranodon: 0.17,
  };

  function normalizeSpecies(id) {
    const key = String(id || "triceratops");
    if (key === "mix") return "mix";
    return POSES[key] ? key : "triceratops";
  }

  function poseFor(species, t) {
    const id = normalizeSpecies(species);
    if (id === "mix") return poseOmniraptor(t);
    return (POSES[id] || poseOmniraptor)(t);
  }

  function scaleFor(species) {
    const id = normalizeSpecies(species);
    if (id === "mix") return 0.19;
    return SCALES[id] || 0.19;
  }

  function pickMix(index, salt) {
    const i = Math.abs((index * 7 + (salt | 0) * 3) % MIXABLE.length);
    return MIXABLE[i];
  }

  window.IsleBorderFxDinoSpecies = {
    SPECIES,
    MIXABLE,
    normalizeSpecies,
    poseFor,
    scaleFor,
    pickMix,
  };
})();
