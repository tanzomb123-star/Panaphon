/* Deterministic code-drawn stage. window.init(cfg) then window.draw(t) / window.qa(t).
   Every frame is a pure function of time t -> no flicker, no drift, same character look in every shot. */
(function () {
  const STYLES = {
    storybook: { skyTop: '#8fd3ff', skyBot: '#e9f8ff', sun: '#ffd84a', hill1: '#9fd68a', hill2: '#7cc072', grass: '#5fae56', track: '#e8c98f', trackDash: '#fff6df', line: '#3a2b24', cloud: '#ffffff', rabbit: '#f6f0ea', rabbitInner: '#ffb3c1', shell: '#4f9a4a', shellLine: '#2f6b2d', skin: '#9ccc65', sub: 'rgba(20,20,30,.72)', subText: '#ffffff', accent: '#ff7043' },
    sunset: { skyTop: '#ff9a62', skyBot: '#ffe2a8', sun: '#fff1b8', hill1: '#b86f6f', hill2: '#8a4f63', grass: '#5d7f4d', track: '#d9a977', trackDash: '#ffe9c7', line: '#3b2230', cloud: '#ffd2b0', rabbit: '#f3e7e0', rabbitInner: '#ff9db0', shell: '#6a8d3f', shellLine: '#3d5a24', skin: '#b5c96a', sub: 'rgba(40,10,30,.75)', subText: '#fff3e0', accent: '#ffb300' },
    night: { skyTop: '#0b1033', skyBot: '#3b3f87', sun: '#f4f1d0', hill1: '#2c3a6b', hill2: '#1f2a52', grass: '#27496d', track: '#51648c', trackDash: '#aab8dd', line: '#10132b', cloud: '#5a62a6', rabbit: '#e9e6f5', rabbitInner: '#f2a6c8', shell: '#3a7d6b', shellLine: '#21493f', skin: '#7fb59a', sub: 'rgba(0,0,0,.65)', subText: '#ffffff', accent: '#7c9dff' }
  };
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';
  const BASE_Y = 40; // feet line in world units
  let cfg, P, c, W, H, shots = [], total = 0;

  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  function track(keys, t) {
    if (!keys) return 0;
    if (typeof keys === 'number') return keys;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1))); }
    return keys[keys.length - 1][1];
  }
  function camAt(keys, t) {
    const o = [0, 1, 2, 3].map((k) => track(keys.map((r) => [r[0], r[1 + k]]), t));
    return { cx: o[0], cy: o[1], w: o[2], h: o[3] };
  }
  function step(keys, t) { let v = keys[0][1]; for (const [kt, kv] of keys) if (t >= kt) v = kv; return v; }

  function ell(x, y, rx, ry, rot, fill, stroke = true) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); } c.restore();
  }
  function eye(x, y, big) { ell(x, y, big ? 10 : 7, big ? 11 : 8, 0, '#fff'); ell(x + 2, y, big ? 3 : 4.5, big ? 3 : 4.5, 0, P.line, false); }

  function drawRabbit(t, pose) {
    const run = pose === 'run', hop = pose === 'hop' || run, sleep = pose === 'sleep', shock = pose === 'shock';
    const ph = t * (run ? 9 : 5);
    const lift = hop ? Math.abs(Math.sin(ph)) * (run ? 38 : 55) : shock ? Math.abs(Math.sin(t * 20)) * 4 : 0;
    ell(0, 4, 60 - lift * 0.4, 9, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -lift);
    if (sleep) {
      ell(-8, -32, 64, 32, 0, P.rabbit); ell(-60, -34, 17, 17, 0, '#fff'); // body + tail
      ell(30, -52, 38, 11, -0.15, P.rabbit); ell(30, -52, 28, 6, -0.15, P.rabbitInner, false); // ear flat back
      ell(52, -28, 30, 27, 0, P.rabbit); ell(80, -24, 5, 4, 0, '#ff8aa5'); // head + nose
      c.beginPath(); c.arc(60, -32, 6, 0.1, Math.PI - 0.1); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); // closed eye
      ell(10, -6, 24, 10, 0, P.rabbit); ell(40, -4, 20, 8, 0, P.rabbit); // feet
      c.fillStyle = P.line; c.font = `bold 34px ${FONT}`;
      for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - k; c.font = `bold ${22 + i * 8}px ${FONT}`; c.fillStyle = P.accent; c.fillText('Z', 70 + i * 16 + k * 20, -70 - k * 70 - i * 6); }
      c.globalAlpha = 1;
    } else {
      const sw = run ? Math.sin(ph) * 26 : hop ? Math.sin(ph) * 10 : 0;
      ell(-34 - sw, -14, 26, 11, hop ? 0.3 : 0, P.rabbit); // back foot
      ell(-52, -62, 17, 17, 0, '#fff'); // tail
      ell(0, -62, 52, 40, -0.1, P.rabbit); ell(10, -50, 30, 24, -0.1, '#fff', false); // body + belly
      ell(30 + sw * 0.8, -10, 22, 9, 0, P.rabbit); // front foot
      const ew = shock ? 0 : Math.sin(t * 6) * 0.08 - (run ? 0.5 : 0);
      c.save(); c.translate(40, -118); c.rotate(-0.15 + ew); ell(0, -34, 13, 38, 0, P.rabbit); ell(0, -34, 7, 30, 0, P.rabbitInner, false); c.restore();
      c.save(); c.translate(54, -120); c.rotate(0.12 + ew); ell(0, -34, 13, 38, 0, P.rabbit); ell(0, -34, 7, 30, 0, P.rabbitInner, false); c.restore();
      ell(50, -96, 31, 28, 0, P.rabbit);
      eye(60, -102, shock); ell(80, -94, 5, 4, 0, '#ff8aa5');
      c.beginPath(); if (shock) c.ellipse(70, -80, 6, 8, 0, 0, 7); else c.arc(68, -86, 8, 0.2, Math.PI - 0.5); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke();
      if (shock) { c.fillStyle = P.accent; c.font = `bold 46px ${FONT}`; c.fillText('!', 96, -150); }
      if (run) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-90 - i * 18, -80 + i * 22); c.lineTo(-130 - i * 18, -80 + i * 22); c.stroke(); } }
    }
    c.restore();
  }

  function drawTortoise(t, pose) {
    const walk = pose === 'walk' || pose === 'happy';
    const ph = t * 2.6, bob = walk ? Math.abs(Math.sin(ph)) * 3 : 0;
    ell(0, 4, 78, 10, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -bob);
    const l = walk ? Math.sin(ph) * 7 : 0;
    ell(-42 + l, -12, 16, 12, 0, P.skin); ell(34 - l, -12, 16, 12, 0, P.skin);
    ell(-20 - l, -10, 16, 12, 0, P.skin); ell(58 + l, -10, 16, 12, 0, P.skin);
    ell(-74, -26, 12, 8, 0.4, P.skin); // tail
    // head on neck
    ell(82, -44, 22, 14, 0.5, P.skin); ell(104, -62, 24, 21, 0, P.skin);
    eye(112, -68); c.beginPath(); c.arc(112, -56, 8, 0.2, Math.PI - 0.5); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke();
    if (pose === 'happy') { ell(98, -52, 6, 4, 0, '#ff9db0', false); }
    // shell
    c.beginPath(); c.moveTo(-72, -22); c.bezierCurveTo(-72, -108, 62, -108, 62, -22); c.closePath(); c.fillStyle = P.shell; c.fill(); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke();
    c.strokeStyle = P.shellLine; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-36, -92); c.lineTo(-14, -60); c.lineTo(-14, -26); c.moveTo(-14, -60); c.lineTo(22, -60); c.lineTo(32, -92); c.moveTo(22, -60); c.lineTo(40, -26); c.stroke();
    c.beginPath(); c.moveTo(-72, -22); c.lineTo(62, -22); c.lineWidth = 5; c.strokeStyle = P.line; c.stroke();
    c.restore();
  }

  function drawTree(x) {
    c.save(); c.translate(x, BASE_Y - 8);
    c.fillStyle = '#7a4e2d'; c.strokeStyle = P.line; c.lineWidth = 3; c.fillRect(-14, -150, 28, 150); c.strokeRect(-14, -150, 28, 150);
    for (const [dx, dy, r] of [[-50, -190, 62], [40, -200, 70], [-4, -250, 66]]) ell(dx, dy, r, r * 0.85, 0, P.hill2);
    c.restore();
  }
  function drawFinish(x) {
    c.save(); c.translate(x, 0);
    const n = 8, s = 18;
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#fff'; c.fillRect(j * s - s, 30 + i * s, s, s); }
    c.fillStyle = '#fff'; c.fillRect(-26, -150, 8, 180); c.fillRect(-26, -150, 90, 36); c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(-26, -150, 90, 36);
    c.fillStyle = P.accent; c.font = `bold 22px ${FONT}`; c.fillText('FINISH', -18, -124);
    c.restore();
  }

  function worldToScreen(cam) { const s = Math.min(W / cam.w, H / cam.h); return { s, ox: W / 2 - cam.cx * s, oy: H / 2 - cam.cy * s }; }

  function locate(t) {
    let i = 0; for (; i < shots.length - 1; i++) if (t < shots[i].start + shots[i].dur) break;
    return { i, lt: Math.min(Math.max(t - shots[i].start, 0), shots[i].dur), shot: shots[i] };
  }
  function actorState(shot, name, lt) {
    const a = shot.actors[name]; if (!a) return null;
    return { x: track(a.x, lt), pose: a.pose ? step(a.pose, lt) : 'idle' };
  }

  function wrapThai(text, maxW) {
    const seg = new Intl.Segmenter('th-TH', { granularity: 'word' });
    const words = [...seg.segment(text)].map((s) => s.segment); const lines = []; let cur = '';
    for (const w of words) { if (c.measureText(cur + w).width > maxW && cur) { lines.push(cur.trim()); cur = w; } else cur += w; }
    if (cur.trim()) lines.push(cur.trim()); return lines;
  }
  function drawSubtitle(shot, lt) {
    if (!shot.text) return;
    const fs = Math.round(Math.min(W, H) * (W > H ? 0.06 : 0.052));
    c.font = `bold ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = wrapThai(shot.text, W * 0.82), lh = fs * 1.5, bw = Math.min(W * 0.9, Math.max(...lines.map((l) => c.measureText(l).width)) + fs * 1.4);
    const bh = lines.length * lh + fs * 0.7, by = H - (W > H ? H * 0.06 : H * 0.14) - bh;
    c.globalAlpha = Math.min(1, lt / 0.25) * Math.min(1, (shot.dur - lt) / 0.2 + 0.0001);
    c.fillStyle = P.sub; c.beginPath(); c.roundRect(W / 2 - bw / 2, by, bw, bh, fs * 0.45); c.fill();
    c.fillStyle = P.subText; lines.forEach((l, k) => c.fillText(l, W / 2, by + fs * 0.35 + lh * (k + 0.5)));
    c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }
  function drawTitle(shot, lt) {
    if (!shot.title) return;
    const fs = Math.round(Math.min(W, H) * 0.11);
    c.font = `bold ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const k = ease(Math.min(1, lt / 0.6)), y = H * 0.16 - (1 - k) * 30;
    c.globalAlpha = k; c.lineWidth = fs * 0.14; c.strokeStyle = P.line; c.lineJoin = 'round'; c.strokeText(shot.title, W / 2, y); c.fillStyle = '#fff'; c.fillText(shot.title, W / 2, y);
    c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }

  window.init = function (config) {
    cfg = config; P = STYLES[cfg.style] || STYLES.storybook; W = cfg.W; H = cfg.H;
    const cv = document.getElementById('c'); cv.width = W; cv.height = H; c = cv.getContext('2d');
    let s = 0; shots = cfg.story.shots.map((sh, i) => { const o = { ...sh, dur: cfg.durs[i] || sh.dur, start: s }; s += o.dur; return o; }); total = s;
    return total;
  };

  window.draw = function (t) {
    const { shot, lt } = locate(t); const cam = camAt(shot.cam, lt); const { s, ox, oy } = worldToScreen(cam);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.skyTop); g.addColorStop(1, P.skyBot); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const horizon = oy + 0 * s;
    ell0(W * 0.78, Math.max(H * 0.08, horizon - H * 0.38), Math.min(W, H) * 0.09, P.sun);
    for (let i = 0; i < 5; i++) { const x = ((i * 520 - cam.cx * 0.1 + t * 12) % 2600 + 2600) % 2600 - 300; const cs = s * (0.8 + (i % 3) * 0.25); const y = horizon - (H * 0.12 + (i % 3) * H * 0.07) - 40; cloud(x * s * 0.45, y, cs); }
    for (const [par, col, hh] of [[0.25, P.hill1, 190], [0.5, P.hill2, 120]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) { const wx = x / s + cam.cx * par; c.lineTo(x, horizon - (Math.sin(wx * 0.004) * 0.5 + 0.5) * hh * s * 0.6 - hh * s * 0.2); }
      c.lineTo(W, H); c.fill();
    }
    c.save(); c.translate(ox, oy); c.scale(s, s);
    const x0 = (0 - ox) / s - 50, x1 = (W - ox) / s + 50, y1 = (H - oy) / s + 50;
    c.fillStyle = P.grass; c.fillRect(x0, 0, x1 - x0, y1);
    c.fillStyle = P.track; c.fillRect(x0, 22, x1 - x0, 92);
    c.fillStyle = P.trackDash; for (let x = Math.floor(x0 / 80) * 80; x < x1; x += 80) c.fillRect(x, 66, 40, 6);
    c.fillStyle = '#fff'; c.fillRect(140, 22, 8, 92); // start line
    drawFinish(cfg.story.finishX || 2300); drawTree(cfg.story.treeX || 1500);
    const order = Object.keys(shot.actors);
    for (const name of order) {
      const st = actorState(shot, name, lt); c.save(); c.translate(st.x, BASE_Y + (name === 'tortoise' ? 14 : 0));
      (name === 'rabbit' ? drawRabbit : drawTortoise)(t, st.pose); c.restore();
    }
    c.restore();
    drawTitle(shot, lt); drawSubtitle(shot, lt);
    const fade = Math.max(1 - t / 0.4, 1 - (total - t) / 0.4, 0); if (fade > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; c.fillRect(0, 0, W, H); }
  };
  function ell0(x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = col; c.fill(); }
  function cloud(x, y, s) { c.fillStyle = P.cloud; c.globalAlpha = 0.9; for (const [dx, dy, r] of [[0, 0, 34], [36, -12, 42], [78, 0, 32], [38, 10, 36]]) { c.beginPath(); c.arc(x + dx * s * 0.8, y + dy * s * 0.8, r * s * 0.8, 0, 7); c.fill(); } c.globalAlpha = 1; }

  // QA: list actors whose bounding box leaves the frame at time t (the "no cropped characters" rule)
  window.qa = function (t) {
    const { shot, lt } = locate(t); const cam = camAt(shot.cam, lt); const { s, ox, oy } = worldToScreen(cam); const bad = [], m = 0.01;
    for (const name of Object.keys(shot.actors)) {
      const st = actorState(shot, name, lt), L = ox + (st.x - 95) * s, R = ox + (st.x + 125) * s, T = oy + (BASE_Y - 235) * s, B = oy + (BASE_Y + 15) * s;
      if (L < -W * m || R > W * (1 + m) || T < -H * m || B > H * (1 + m)) bad.push({ name, L: Math.round(L), R: Math.round(R), T: Math.round(T), B: Math.round(B) });
    }
    return bad;
  };
  window.total = () => total;
})();
