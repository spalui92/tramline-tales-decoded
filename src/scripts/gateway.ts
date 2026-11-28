// The home page hero: the deck of Howrah Bridge at night, seen from a car crossing it.
// One perspective scene in metres (x across the deck, y up, z ahead) drawn on two canvases:
// the back one sits behind the TRAMLINE title, the front one carries the girders nearer than
// the title, so they pass in front of it. The scene sets --hy (its horizon) on the hero, and
// the title, Tales and the quote are all placed from that, so they can never drift off the road.
// On arrival the lamps strike on down the bridge; with reduced motion it draws one still frame.
export function initGateway(hero: HTMLElement, motion: boolean) {
  const cvB = hero.querySelector<HTMLCanvasElement>('[data-scene="back"]');
  const cvF = hero.querySelector<HTMLCanvasElement>('[data-scene="front"]');
  if (!cvB || !cvF) return;
  const ctxB = cvB.getContext('2d')!, ctxF = cvF.getContext('2d')!;
  let ctx = ctxB;
  const Z_TITLE = 34; // TRAMLINE stands this far ahead: steel nearer than this passes in front of it
  const layer = (z) => (z < Z_TITLE ? ctxF : ctxB);

  // ---- the world, in metres: x across the deck, y up from the road, z ahead of the reader ----
  const CAM_Y = 2.2, Z_NEAR = 1.2, Z_FAR = 480;
  const PANEL = 14, TRUSS_H = 27, TRUSS_X = 12.5, ROAD_X = 9, PATH_X = 11.6;
  const LAMP_GAP = 28, FOG = 120, CRUISE = 11;
  const FOG_RGB = [60, 41, 29], STEEL_RGB = [17, 14, 13], LIT_RGB = [150, 92, 44];

  let W = 0, H = 0, dpr = 1, cx = 0, hy = 0, f = 1;
  let skyGrad, waterGrad, roadGrad, pathGrad, vignette, skyline, grain;
  let travel = 0, speed = 0, t0 = 0, last = 0, running = true, raf = 0;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const fogAt = (z) => 1 - Math.exp(-z / FOG);
  const sx = (x, z) => cx + (f * x) / z;
  const sy = (y, z) => hy - (f * (y - CAM_Y)) / z;

  // soft round glows, drawn once and stamped wherever a light is
  function sprite(r, g, b) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.18, `rgba(${r},${g},${b},0.55)`);
    gr.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c;
  }
  const GLOW = { sodium: sprite(255, 170, 84), ember: sprite(255, 84, 40), head: sprite(255, 240, 214), tail: sprite(255, 52, 36), haze: sprite(255, 150, 80) };
  const stamp = (img, x, y, w, h, a) => { if (a <= 0.003) return; ctx.globalAlpha = a; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); };

  function resize() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [cvB, cvF]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    ctx = ctxB;
    cx = W / 2; hy = Math.round(H * (W < 720 ? 0.55 : 0.5));
    f = Math.max(W * 0.62, H * 0.95);
    hero.style.setProperty('--hy', hy + 'px');

    skyGrad = ctx.createLinearGradient(0, 0, 0, hy);
    skyGrad.addColorStop(0, '#05060a'); skyGrad.addColorStop(0.55, '#0d0c13'); skyGrad.addColorStop(0.86, '#2a1d18'); skyGrad.addColorStop(1, rgb(FOG_RGB));
    waterGrad = ctx.createLinearGradient(0, hy, 0, H);
    waterGrad.addColorStop(0, '#2c1f18'); waterGrad.addColorStop(0.12, '#0d0e12'); waterGrad.addColorStop(1, '#040507');
    roadGrad = ctx.createLinearGradient(0, hy, 0, H);
    roadGrad.addColorStop(0, rgb(FOG_RGB)); roadGrad.addColorStop(0.18, '#1c1513'); roadGrad.addColorStop(0.55, '#0f0d0d'); roadGrad.addColorStop(1, '#0a0909');
    pathGrad = ctx.createLinearGradient(0, hy, 0, H);
    pathGrad.addColorStop(0, rgb(FOG_RGB)); pathGrad.addColorStop(0.2, '#221a16'); pathGrad.addColorStop(1, '#141210');
    vignette = ctx.createRadialGradient(cx, hy, Math.min(W, H) * 0.25, cx, hy, Math.hypot(W, H) * 0.62);
    vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
    buildSkyline(); buildGrain();
    if (!motion || !running) frame(performance.now(), true);
  }

  // the far city on the horizon, beyond both ends of the bridge: drawn once per size
  function buildSkyline() {
    skyline = document.createElement('canvas'); skyline.width = Math.round(W * dpr); skyline.height = Math.round(hy * dpr);
    const x = skyline.getContext('2d'); x.scale(dpr, dpr);
    const rand = rng(1943); const s = f / 900;
    for (let px = -10; px < W + 10;) {
      const w = (8 + rand() * 26) * s, h = (3 + Math.pow(rand(), 2.2) * 26) * s * (Math.abs(px - cx) < W * 0.08 ? 0.5 : 1);
      x.fillStyle = 'rgba(24,17,15,0.92)'; x.fillRect(px, hy - h, w + 0.5, h);
      for (let k = 0; k < (w * h) / 60; k++) {
        if (rand() < 0.55) continue;
        x.fillStyle = rand() < 0.8 ? 'rgba(255,186,110,0.55)' : 'rgba(236,228,210,0.45)';
        x.fillRect(px + rand() * (w - 1.2), hy - h + 1 + rand() * (h - 2), 1.1 * s + 0.3, 1.1 * s + 0.3);
      }
      px += w + rand() * 6 * s;
    }
    if (W > 520) { // the Howrah station clock tower, far off the left of the line
      const tx = cx - W * 0.31, th = 34 * s, tw = 9 * s;
      x.fillStyle = 'rgba(24,17,15,0.95)'; x.fillRect(tx, hy - th, tw, th); x.fillRect(tx - 18 * s, hy - th * 0.45, tw + 36 * s, th * 0.45);
      x.fillStyle = 'rgba(255,214,150,0.7)'; x.beginPath(); x.arc(tx + tw / 2, hy - th * 0.78, 2.2 * s, 0, 7); x.fill();
    }
  }
  function buildGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
    const img = x.createImageData(160, 160); const rand = rng(7);
    for (let i = 0; i < img.data.length; i += 4) { const v = rand() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); grain = ctx.createPattern(c, 'repeat');
  }

  // a straight 3D member, clipped at the reader's eye, width in metres
  function member(x1, y1, z1, x2, y2, z2, w, col, cap = 400) {
    if (z1 < Z_NEAR && z2 < Z_NEAR) return;
    if (z1 < Z_NEAR) { const t = (Z_NEAR - z1) / (z2 - z1); x1 += (x2 - x1) * t; y1 += (y2 - y1) * t; z1 = Z_NEAR; }
    else if (z2 < Z_NEAR) { const t = (Z_NEAR - z2) / (z1 - z2); x2 += (x1 - x2) * t; y2 += (y1 - y2) * t; z2 = Z_NEAR; }
    ctx.lineWidth = Math.min(cap, Math.max(0.6, (f * w) / ((z1 + z2) / 2)));
    ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(sx(x1, z1), sy(y1, z1)); ctx.lineTo(sx(x2, z2), sy(y2, z2)); ctx.stroke();
  }
  const quad = (pts) => { ctx.beginPath(); pts.forEach(([x, y, z], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, sx(x, z), sy(y, z))); ctx.closePath(); };

  // ---- the lamps: sodium lights on posts along both footways; they switch on in a wave down the bridge ----
  function lampsNow(t) {
    const out = [];
    for (const side of [-1, 1]) {
      const off = side < 0 ? 9 : 9 + LAMP_GAP / 2;
      for (let m = Math.ceil((travel + Z_NEAR - off) / LAMP_GAP); ; m++) {
        const z = m * LAMP_GAP + off - travel; if (z > Z_FAR) break;
        const on = 0.55 + z / 230, dt = t - on;
        let i = 0, warm = 0;
        if (dt > 0) { const flick = dt < 0.32 ? (hash(m * 13 + side * 7 + Math.floor(dt * 26)) > 0.42 ? 1 : 0.12) : 1; warm = smooth(0, 1.1, dt); i = flick * (0.3 + 0.7 * warm); }
        out.push({ side, z, i, warm });
      }
    }
    return out;
  }
  const lightAt = (lamps, z) => { let s = 0; for (const l of lamps) { const d = (z - l.z) / 9; s += l.i * Math.exp(-d * d); } return Math.min(1, s); };

  // ---- the traffic: headlights coming the other way on the right, tail lights pulling ahead on the left ----
  const cars = [
    { lane: 3.4, on: true, z: 260 }, { lane: 6.8, on: true, z: 470 },
    { lane: -3.4, on: false, z: 70 }, { lane: -6.8, on: false, z: 180 },
  ];
  function moveCars(dt) {
    for (const c of cars) {
      if (c.on) { c.z -= (speed + 13) * dt; if (c.z < 0.5) c.z = Z_FAR + 40 + Math.random() * 260; }
      else { c.z += (15 - speed) * dt; if (c.z > Z_FAR + 40) c.z = -12 - Math.random() * 30; }
    }
  }

  function frame(now, still) {
    const t = still ? 20 : (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (!still) { speed = CRUISE * smooth(0.4, 3.6, t); travel += speed * dt; moveCars(dt); }
    const lamps = lampsNow(t);
    const time = now / 1000;

    // two layers: the back canvas sits behind TRAMLINE, the front canvas in front of it
    ctxF.setTransform(1, 0, 0, 1, 0, 0); ctxF.clearRect(0, 0, cvF.width, cvF.height); ctxF.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxF.globalCompositeOperation = 'source-over'; ctxF.globalAlpha = 1;
    ctx = ctxB;
    // sky, the far city, and the Hooghly below the deck
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, hy);
    ctx.fillStyle = waterGrad; ctx.fillRect(0, hy, W, H - hy);
    ctx.drawImage(skyline, 0, 0, W, hy);
    ctx.globalCompositeOperation = 'lighter';
    stamp(GLOW.haze, cx, hy, W * 1.4, H * 0.85, 0.3);
    // city lights trembling on the river
    const rr = rng(5);
    for (let k = 0; k < 70; k++) {
      const x = rr() * W, d = rr(), y = hy + 3 + Math.pow(d, 1.6) * (H - hy) * 0.32;
      const wob = Math.sin(time * (1.2 + rr() * 2) + k) * 0.5 + 0.5;
      stamp(rr() < 0.8 ? GLOW.sodium : GLOW.head, x + Math.sin(time * 0.7 + k) * 2, y, (10 + d * 30) * (f / 900), 3 + d * 3, 0.12 + 0.25 * wob * (1 - d));
    }
    ctx.globalCompositeOperation = 'source-over';

    // the deck: footways, then the road with its four lanes and the old tram tracks down the middle
    ctx.fillStyle = pathGrad; quad([[-PATH_X, 0.25, Z_NEAR], [PATH_X, 0.25, Z_NEAR], [PATH_X, 0.25, Z_FAR], [-PATH_X, 0.25, Z_FAR]]); ctx.fill();
    ctx.fillStyle = roadGrad; quad([[-ROAD_X, 0, Z_NEAR], [ROAD_X, 0, Z_NEAR], [ROAD_X, 0, Z_FAR], [-ROAD_X, 0, Z_FAR]]); ctx.fill();

    ctx.save(); quad([[-ROAD_X, 0, Z_NEAR], [ROAD_X, 0, Z_NEAR], [ROAD_X, 0, Z_FAR], [-ROAD_X, 0, Z_FAR]]); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    stamp(GLOW.haze, cx, hy + (H - hy) * 0.18, W * 0.42, (H - hy) * 0.7, 0.16); // the city glow, mirrored on wet tarmac
    for (const l of lamps) { // lamp reflections: a sodium streak below each lamp, broken by the wet road
      if (l.i <= 0 || l.z < 3) continue;
      const x = sx(l.side * 8.2, l.z), y = sy(-8.8, l.z), fa = 1 - fogAt(l.z);
      const wob = 1 + Math.sin(time * 3 + l.z) * 0.08;
      stamp(GLOW.sodium, x, y, Math.min(140, (f * 1.5) / l.z), Math.min(H, (f * 7.5) / l.z) * wob, l.i * l.warm * 0.42 * fa);
    }
    for (const c of cars) {
      if (c.z < 2 || c.z > Z_FAR) continue;
      const fa = 1 - fogAt(c.z);
      for (const s of [-0.8, 0.8]) stamp(c.on ? GLOW.head : GLOW.tail, sx(c.lane + s, c.z), sy(-0.8, c.z), Math.min(90, (f * 0.9) / c.z), Math.min(400, (f * 3.2) / c.z), (c.on ? 0.35 : 0.28) * fa);
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // lane dashes roll toward the reader; the kerbs and tram rails catch the lamplight as it passes
    for (const lx of [-4.5, 4.5]) {
      for (let n = Math.ceil((travel + Z_NEAR) / 9); ; n++) {
        const z = n * 9 - travel; if (z > Z_FAR) break;
        const fa = 1 - fogAt(z), lit = lightAt(lamps, z);
        ctx.fillStyle = rgb(mix([150, 140, 125], FOG_RGB, fogAt(z)), 0.25 + 0.5 * lit * fa);
        quad([[lx - 0.08, 0, z], [lx + 0.08, 0, z], [lx + 0.08, 0, z + 3], [lx - 0.08, 0, z + 3]]); ctx.fill();
      }
    }
    const railCol = (z, lit) => rgb(mix(mix([70, 62, 54], [255, 196, 120], lit), FOG_RGB, fogAt(z)), 0.35 + 0.6 * lit);
    for (let n = Math.ceil((travel + Z_NEAR) / 4); ; n++) {
      const z = n * 4 - travel; if (z > Z_FAR) break;
      const lit = lightAt(lamps, z + 2) * (1 - fogAt(z) * 0.7);
      for (const rx of [-2.05, -0.62, 0.62, 2.05]) member(rx, 0.02, z, rx, 0.02, z + 4, 0.07, railCol(z, lit), 3);
      for (const kx of [-ROAD_X, ROAD_X]) member(kx, 0.25, z, kx, 0.25, z + 4, 0.12, rgb(mix([96, 86, 74], FOG_RGB, fogAt(z)), 0.4 + 0.5 * lit), 4);
    }

    // light pools under each lamp
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lamps) {
      if (l.i <= 0) continue;
      const za = Math.max(Z_NEAR + 0.2, l.z - 7), zb = l.z + 7;
      const top = sy(0, zb), bot = Math.min(H * 2, sy(0, za)), x = sx(l.side * 6.4, l.z);
      stamp(GLOW.sodium, x, (top + bot) / 2, Math.min(W * 2, (f * 15) / Math.max(l.z, 2)), (bot - top) * 1.15, l.i * l.warm * 0.34 * (1 - fogAt(l.z) * 0.8));
      stamp(GLOW.ember, x, (top + bot) / 2, Math.min(W * 2, (f * 12) / Math.max(l.z, 2)), (bot - top), l.i * (1 - l.warm) * 0.25);
    }
    ctx.globalCompositeOperation = 'source-over';

    // the tram's overhead wires, still strung along the bridge, faint in the haze
    for (let n = Math.ceil((travel + Z_NEAR) / 6); ; n++) {
      const z = n * 6 - travel; if (z > Z_FAR) break;
      const lit = lightAt(lamps, z + 3), a = (0.2 + 0.45 * lit) * (1 - fogAt(z) * 0.9);
      ctx = layer(z);
      for (const wx of [-1.33, 1.33]) member(wx, 6.4, z, wx, 6.4, z + 6, 0.025, rgb([236, 228, 210], a));
    }

    // the cantilever trusses: walls of riveted steel either side and the lattice overhead, far to near
    const first = Math.ceil((travel + Z_NEAR - PANEL) / PANEL), lastN = Math.floor((travel + Z_FAR) / PANEL);
    for (let n = lastN; n >= first; n--) {
      const z1 = n * PANEL - travel, z2 = z1 + PANEL, fz = fogAt(z1);
      const lit = lightAt(lamps, z1 + PANEL / 2);
      const glow = z1 < Z_TITLE ? 0.03 + lit * 0.12 : 0.12 + lit * 0.6;
      const steel = rgb(mix(mix(STEEL_RGB, LIT_RGB, glow), FOG_RGB, fz));
      const fine = rgb(mix(mix(STEEL_RGB, LIT_RGB, glow * 0.75), FOG_RGB, Math.min(1, fz * 1.08)), 0.9);
      const odd = ((n % 2) + 2) % 2;
      ctx = layer(z1);
      // span wire across the deck for the tram line
      member(-ROAD_X, 7.4, z1, ROAD_X, 7.4, z1, 0.03, rgb([236, 228, 210], 0.12 * (1 - fz)));
      // the lattice roof
      member(-TRUSS_X, TRUSS_H, z1, TRUSS_X, TRUSS_H, z1, 0.5, steel);
      member(-TRUSS_X, TRUSS_H, z1, TRUSS_X, TRUSS_H, z2, 0.22, fine);
      member(TRUSS_X, TRUSS_H, z1, -TRUSS_X, TRUSS_H, z2, 0.22, fine);
      for (const s of [-1, 1]) {
        const x = s * TRUSS_X;
        member(x, TRUSS_H - 6, z1, s * (TRUSS_X - 5.5), TRUSS_H, z1, 0.4, steel); // knee brace
        member(x, TRUSS_H, z1, x, TRUSS_H, z2, 0.9, steel);                       // top chord
        member(x, 0, z1, x, 0, z2, 0.9, steel);                                   // bottom chord
        member(x, TRUSS_H * 0.52, z1, x, TRUSS_H * 0.52, z2, 0.25, fine);          // mid strut
        member(s * PATH_X, 1.15, z1, s * PATH_X, 1.15, z2, 0.06, fine);            // footway railing
        member(x, 0, z1, x, TRUSS_H, z1, 0.62, steel);                            // vertical
        if (odd) member(x, 0, z1, x, TRUSS_H, z2, 0.42, steel); else member(x, TRUSS_H, z1, x, 0, z2, 0.42, steel);
      }
    }

    // lamp posts and heads
    for (let k = lamps.length - 1; k >= 0; k--) {
      const l = lamps[k]; const fz = fogAt(l.z); ctx = layer(l.z);
      member(l.side * 10.6, 0.25, l.z, l.side * 10.6, 8.7, l.z, 0.16, rgb(mix([18, 15, 14], FOG_RGB, fz)));
      member(l.side * 10.6, 8.7, l.z, l.side * 8.2, 9.0, l.z, 0.12, rgb(mix([18, 15, 14], FOG_RGB, fz)));
    }

    // headlights and tail lights, with their long-exposure trails
    ctx = ctxB; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const c of cars) {
      if (c.z < Z_NEAR || c.z > Z_FAR) continue;
      const fa = 1 - fogAt(c.z);
      for (const s of [-0.8, 0.8]) {
        const x = c.lane + s, zt = c.on ? c.z + 45 : Math.max(Z_NEAR, c.z - 26);
        const g = ctx.createLinearGradient(sx(x, c.z), sy(0.75, c.z), sx(x, zt), sy(0.75, zt));
        const col = c.on ? '255,232,200' : '255,60,40';
        g.addColorStop(0, `rgba(${col},${0.5 * fa})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = Math.max(0.8, Math.min(14, (f * 0.2) / c.z));
        ctx.beginPath(); ctx.moveTo(sx(x, c.z), sy(0.75, c.z)); ctx.lineTo(sx(x, zt), sy(0.75, zt)); ctx.stroke();
        const r = Math.max(4, Math.min(120, (f * (c.on ? 1.3 : 0.9)) / c.z));
        stamp(c.on ? GLOW.head : GLOW.tail, sx(x, c.z), sy(0.75, c.z), r, r, (c.on ? 0.95 : 0.85) * fa);
      }
    }
    ctx.lineCap = 'butt';

    // arrival: the night is black until the lamps start coming on (drawn in front, so it hides the title too)
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx = ctxF; ctx.globalCompositeOperation = 'source-over';
    const dark = 1 - smooth(0.35, 2.4, t);
    if (dark > 0) { ctx.globalAlpha = dark * 0.94; ctx.fillStyle = '#030305'; ctx.fillRect(0, 0, W, H); }

    // the lamp heads burn through everything, ember red as they strike, sodium orange once warm
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lamps) {
      if (l.i <= 0) continue;
      const x = sx(l.side * 8.2, l.z), y = sy(8.85, l.z), fa = 1 - fogAt(l.z) * 0.75;
      const r = Math.max(5, Math.min(220, (f * 3.2) / l.z));
      stamp(GLOW.sodium, x, y, r, r, l.i * l.warm * fa);
      stamp(GLOW.ember, x, y, r * 0.8, r * 0.8, l.i * (1 - l.warm) * fa);
      stamp(GLOW.head, x, y, r * 0.22, r * 0.22, l.i * l.warm * 0.9 * fa);
    }

    // finish: vignette and a little film grain
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
    ctx.translate(still ? 0 : (Math.random() * 160) | 0, still ? 0 : (Math.random() * 160) | 0);
    ctx.fillStyle = grain; ctx.fillRect(-160, -160, W + 320, H + 320); ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now) { if (!running) { raf = 0; return; } frame(now, false); raf = requestAnimationFrame(loop); }
  function play() { if (!raf && running && motion) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  function arrive() {
    hero.classList.remove('go'); void hero.offsetWidth; hero.classList.add('go');
    travel = 0; speed = 0; t0 = performance.now(); last = t0;
    cars[0].z = 260; cars[1].z = 470; cars[2].z = 70; cars[3].z = 180;
    if (!motion) frame(t0, true); else play();
  }

  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([e]) => { running = e.isIntersecting && !document.hidden; play(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; play(); });

  resize();
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(arrive);
}
