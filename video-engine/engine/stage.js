/* Deterministic stage. window.init(cfg) -> total seconds; window.draw(t); window.qa(t) -> { cropped, subtitle }.
   Every frame is a pure function of t: same input -> identical pixels. Depends on CharLib, Rig, SceneLib, LookLib, PropLib.
   scene = where/when (palette, backdrop); style = look = how it is drawn (pen, post-processing, stepped timing). */
(function () {
  const { SCENES } = window.SceneLib, { LOOKS, makePen, post } = window.LookLib, { CHARACTERS } = window.CharLib, { PROPS } = window.PropLib;
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';
  const BASE_Y = 40, MAX_SUB_LINES = 3;
  let cfg, P, L, c, W, H, shots = [], total = 0, story, layerIdx = 0;

  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function track(keys, t) {
    if (keys === undefined) return 0; if (typeof keys === 'number') return keys;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1))); }
    return keys[keys.length - 1][1];
  }
  const camAt = (keys, t) => { const o = [0, 1, 2, 3].map((k) => track(keys.map((r) => [r[0], r[1 + k]]), t)); return { cx: o[0], cy: o[1], w: o[2], h: o[3] }; };
  const step = (keys, t) => { if (typeof keys === 'string') return keys; let v = keys[0][1]; for (const [kt, kv] of keys) if (t >= kt) v = kv; return v; };
  /* Fit the camera box into the frame. When the frame is taller than the box (9:16), place the box lower (58% of height)
     so the spare space becomes sky instead of empty ground above the subtitles. QA uses the same transform. */
  const xform = (cam) => {
    const s = Math.min(W / cam.w, H / cam.h), spare = H - cam.h * s;
    const cyScreen = spare > H * 0.15 ? Math.min(H * 0.58, H - cam.h * s / 2) : H / 2;
    return { s, ox: W / 2 - cam.cx * s, oy: cyScreen - cam.cy * s };
  };
  function locate(t) { let i = 0; for (; i < shots.length - 1; i++) if (t < shots[i].start + shots[i].dur) break; return { shot: shots[i], lt: Math.min(Math.max(t - shots[i].start, 0), shots[i].dur) }; }
  function actors(shot, lt) {
    return Object.entries(shot.actors).map(([id, a]) => ({ id, character: a.character || id, x: track(a.x, lt), pose: a.pose ? step(a.pose, lt) : 'idle', facing: a.facing || 1 }));
  }

  /* ---------- background ---------- */
  function sky(t, horizon, cam, s) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.skyTop); g.addColorStop(1, P.skyBot); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (P.sky === 'night' || P.particles === 'stars') for (let i = 0; i < 90; i++) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); c.fillStyle = '#fff'; c.fillRect(hash(i) * W, hash(i + 99) * horizon * 0.85, 2.5, 2.5); }
    c.globalAlpha = 1;
    if (P.sunOn) { const r = Math.min(W, H) * 0.09, sy = P.sky === 'sunset' ? horizon - r * 1.6 : Math.max(H * 0.08, horizon - H * 0.38); c.beginPath(); c.arc(W * 0.78, sy, r, 0, 7); c.fillStyle = P.sun; c.fill(); }
    if (P.sky !== 'night') for (let i = 0; i < 5; i++) { const x = ((i * 520 - cam.cx * 0.1 + t * 12) % 2600 + 2600) % 2600 - 300; const cs = s * (0.8 + (i % 3) * 0.25); cloud(x * s * 0.45, horizon - (H * 0.12 + (i % 3) * H * 0.07) - 40, cs); }
  }
  function cloud(x, y, s) { c.fillStyle = P.cloud; c.globalAlpha = 0.9; for (const [dx, dy, r] of [[0, 0, 34], [36, -12, 42], [78, 0, 32], [38, 10, 36]]) { c.beginPath(); c.arc(x + dx * s * 0.8, y + dy * s * 0.8, r * s * 0.8, 0, 7); c.fill(); } c.globalAlpha = 1; }
  function layer(par, col, hh, horizon, cam, s, fn) {
    const pts = []; for (let x = 0; x <= W + 20; x += 10) { const wx = x / s + cam.cx * par; pts.push([x, horizon - fn(wx) * hh * s]); }
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (const [x, y] of pts) c.lineTo(x, y); c.lineTo(W, H); c.fill();
    if (L.edge) { // chalk / neon: outline the skyline of each backdrop layer
      const e = L.edge(layerIdx); c.save(); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.strokeStyle = e; c.lineWidth = Math.max(1.5, 2.5 * s); if (L.mode === 'neon') { c.shadowColor = e; c.shadowBlur = 12; } c.stroke(); c.restore();
    }
    layerIdx++;
  }
  const tri = (wx, p) => { const k = ((wx / p) % 1 + 1) % 1; return 1 - Math.abs(k * 2 - 1); };
  function backdrop(t, horizon, cam, s) {
    const b = P.backdrop;
    if (b === 'hills') { layer(0.25, P.hill1, 190, horizon, cam, s, (x) => (Math.sin(x * 0.004) * 0.5 + 0.5) * 0.6 + 0.2); layer(0.5, P.hill2, 120, horizon, cam, s, (x) => (Math.sin(x * 0.006 + 2) * 0.5 + 0.5) * 0.6 + 0.2); }
    if (b === 'mountains') {
      layer(0.2, P.hill1, 330, horizon, cam, s, (x) => 0.3 + 0.7 * tri(x, 700) * (0.7 + 0.3 * Math.sin(x * 0.01)));
      if (P.snowcap) layer(0.2, '#ffffff', 330, horizon, cam, s, (x) => { const v = 0.3 + 0.7 * tri(x, 700) * (0.7 + 0.3 * Math.sin(x * 0.01)); return v > 0.78 ? v : 0; });
      layer(0.45, P.hill2, 160, horizon, cam, s, (x) => 0.2 + 0.8 * tri(x + 300, 520));
    }
    if (b === 'dunes') { layer(0.25, P.hill1, 150, horizon, cam, s, (x) => Math.pow(Math.sin(x * 0.003) * 0.5 + 0.5, 1.5) * 0.8 + 0.1); layer(0.5, P.hill2, 90, horizon, cam, s, (x) => Math.pow(Math.sin(x * 0.005 + 1) * 0.5 + 0.5, 1.5) * 0.8 + 0.1); }
    if (b === 'sea') {
      c.fillStyle = P.hill1; c.fillRect(0, horizon - 90 * s, W, H); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(2, 3 * s);
      for (let r = 0; r < 4; r++) { const y = horizon - (75 - r * 18) * s; c.beginPath(); for (let x = 0; x <= W; x += 8) { const wx = x / s + cam.cx * 0.3; c.lineTo(x, y + Math.sin(wx * 0.03 + t * 2 + r) * 3 * s); } c.stroke(); }
    }
    if (b === 'city') {
      for (const [par, col, hmax, seed] of [[0.2, P.hill1, 320, 1], [0.45, P.hill2, 220, 7]]) {
        const bw = 90; const off = cam.cx * par; const first = Math.floor((-W / 2) / s / bw + off / bw) - 2;
        for (let i = first; i < first + Math.ceil(W / s / bw) + 5; i++) {
          const hh = (0.35 + 0.65 * hash(i * 13 + seed)) * hmax;
          const sx = (i * bw - off) * s + W / 2; c.fillStyle = col; c.fillRect(sx, horizon - hh * s, (bw - 8) * s, hh * s + 2);
          c.fillStyle = 'rgba(255,240,180,.55)'; for (let wy = 20; wy < hh - 20; wy += 34) for (let wx = 12; wx < bw - 24; wx += 26) if (hash(i * 31 + wy + wx + seed) > 0.45) c.fillRect(sx + wx * s, horizon - (hh - wy) * s, 10 * s, 14 * s);
        }
      }
    }
    if (b === 'forest') {
      for (const [par, col, sz] of [[0.25, P.hill1, 1], [0.5, P.hill2, 1.4]]) {
        const sp = 70 * sz, off = cam.cx * par, first = Math.floor((off - W / 2 / s) / sp) - 2;
        c.fillStyle = col; for (let i = first; i < first + W / s / sp + 5; i++) { const sx = (i * sp - off) * s + W / 2, hh = (120 + 60 * hash(i + sz)) * sz * s; c.beginPath(); c.moveTo(sx - 34 * sz * s, horizon + 2); c.lineTo(sx, horizon - hh); c.lineTo(sx + 34 * sz * s, horizon + 2); c.fill(); }
      }
    }
  }
  function particles(t) {
    const k = P.particles; if (!k || k === 'stars') return;
    for (let i = 0; i < 60; i++) {
      const x = hash(i) * W, sp = 0.05 + hash(i + 7) * 0.08;
      if (k === 'snow') { const y = ((hash(i + 3) + t * sp) % 1) * H; c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x + Math.sin(t + i) * 10, y, 2 + hash(i + 5) * 3, 0, 7); c.fill(); }
      if (k === 'leaves' && i < 25) { const y = ((hash(i + 3) + t * sp) % 1) * H; c.save(); c.translate(x + Math.sin(t * 1.5 + i) * 20, y); c.rotate(t * 2 + i); c.fillStyle = i % 2 ? P.accent : '#d9822b'; c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, 7); c.fill(); c.restore(); }
      if (k === 'bubbles' && i < 25) { const y = H - ((hash(i + 3) + t * sp) % 1) * H; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6 + hash(i + 9) * 10, 0, 7); c.stroke(); }
    }
  }

  /* ---------- text ---------- */
  function wrapThai(text, maxW) {
    const seg = new Intl.Segmenter('th-TH', { granularity: 'word' }); const lines = []; let cur = '';
    for (const { segment: w } of seg.segment(text)) { if (c.measureText(cur + w).width > maxW && cur) { lines.push(cur.trim()); cur = w; } else cur += w; }
    if (cur.trim()) lines.push(cur.trim()); return lines;
  }
  function subtitleLayout(shot) {
    if (!shot.text) return null;
    const fs = Math.round(Math.min(W, H) * (W > H ? 0.06 : 0.052)); c.font = `bold ${fs}px ${FONT}`;
    const lines = wrapThai(shot.text, W * 0.82), lh = fs * 1.5, widest = Math.max(...lines.map((l) => c.measureText(l).width));
    const bw = Math.min(W * 0.9, widest + fs * 1.4), bh = lines.length * lh + fs * 0.7, by = H - (W > H ? H * 0.06 : H * 0.14) - bh;
    return { fs, lines, lh, bw, bh, by, overflow: lines.length > MAX_SUB_LINES || widest > W * 0.9 || by < H * 0.4 };
  }
  function drawSubtitle(shot, lt) {
    const L = subtitleLayout(shot); if (!L) return;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha = Math.max(0, Math.min(1, lt / 0.25, (shot.dur - lt) / 0.2));
    c.fillStyle = P.sub; c.beginPath(); c.roundRect(W / 2 - L.bw / 2, L.by, L.bw, L.bh, L.fs * 0.45); c.fill();
    c.fillStyle = P.subText; L.lines.forEach((l, k) => c.fillText(l, W / 2, L.by + L.fs * 0.35 + L.lh * (k + 0.5)));
    c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }
  function drawTitle(shot, lt) {
    if (!shot.title) return;
    const fs = Math.round(Math.min(W, H) * 0.11); c.font = `bold ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    while (c.measureText(shot.title).width > W * 0.9 && fs > 10) { c.font = `bold ${Math.round(fs * W * 0.9 / c.measureText(shot.title).width)}px ${FONT}`; break; }
    const k = ease(Math.min(1, lt / 0.6)), y = H * 0.16 - (1 - k) * 30;
    c.globalAlpha = k; c.lineWidth = fs * 0.14; c.strokeStyle = P.line; c.lineJoin = 'round'; c.strokeText(shot.title, W / 2, y); c.fillStyle = '#fff'; c.fillText(shot.title, W / 2, y);
    c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }

  /* ---------- public API ---------- */
  window.init = function (config) {
    cfg = config; story = cfg.story; W = cfg.W; H = cfg.H;
    L = LOOKS[cfg.style || story.style] || LOOKS.pastel;
    const scene = SCENES[cfg.scene || story.scene] || SCENES.meadow; P = L.palette ? L.palette(scene) : scene;
    const cv = document.getElementById('c'); cv.width = W; cv.height = H; c = cv.getContext('2d');
    let s = 0; shots = story.shots.map((sh, i) => { const o = { ...sh, dur: (cfg.durs && cfg.durs[i]) || sh.dur, start: s }; s += o.dur; return o; }); total = s;
    return total;
  };
  window.draw = function (tReal) {
    const t = L.stepFps ? Math.floor(tReal * L.stepFps) / L.stepFps : tReal; // paper/pixel/chalk animate "on twos"
    const { shot, lt } = locate(t), cam = camAt(shot.cam, lt), { s, ox, oy } = xform(cam);
    layerIdx = 0; sky(t, oy, cam, s); backdrop(t, oy, cam, s);
    c.save(); c.translate(ox, oy); c.scale(s, s);
    const x0 = -ox / s - 50, x1 = (W - ox) / s + 50, y1 = (H - oy) / s + 50;
    c.fillStyle = P.grass; c.fillRect(x0, 0, x1 - x0, y1);
    if (story.track !== false) { c.fillStyle = P.track; c.fillRect(x0, 22, x1 - x0, 92); c.fillStyle = P.trackDash; for (let x = Math.floor(x0 / 80) * 80; x < x1; x += 80) c.fillRect(x, 66, 40, 6); }
    const pen = makePen(c, P, L, t);
    for (const p of story.props || []) PROPS[p.type](c, p, P, pen);
    for (const a of actors(shot, lt)) { c.save(); c.translate(a.x, BASE_Y + (CHARACTERS[a.character].template === 'shell' ? 14 : 0)); window.Rig.draw(c, a.character, a.pose, t, P, { facing: a.facing, look: L }); c.restore(); }
    c.restore();
    particles(t); post(c, L, W, H, t); // post-process the picture, then draw text crisp on top
    const real = locate(tReal); drawTitle(real.shot, real.lt); drawSubtitle(real.shot, real.lt);
    const fade = Math.max(1 - tReal / 0.4, 1 - (total - tReal) / 0.4, 0); if (fade > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; c.fillRect(0, 0, W, H); }
  };
  window.qa = function (t) {
    const { shot, lt } = locate(t), cam = camAt(shot.cam, lt), { s, ox, oy } = xform(cam), cropped = [], m = 0.01;
    for (const a of actors(shot, lt)) {
      const ch = CHARACTERS[a.character], [bl, bt, br, bb] = ch.bbox, yb = BASE_Y + (ch.template === 'shell' ? 14 : 0);
      const lx = a.facing === -1 ? -br : bl, rx = a.facing === -1 ? -bl : br;
      const L = ox + (a.x + lx) * s, R = ox + (a.x + rx) * s, T = oy + (yb + bt) * s, B = oy + (yb + bb) * s;
      if (L < -W * m || R > W * (1 + m) || T < -H * m || B > H * (1 + m)) cropped.push({ id: a.id, L: Math.round(L), R: Math.round(R), T: Math.round(T), B: Math.round(B) });
    }
    const L = subtitleLayout(shot);
    return { cropped, subtitle: L ? { lines: L.lines.length, overflow: L.overflow } : null };
  };
  window.total = () => total;
})();
