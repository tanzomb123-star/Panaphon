/* Rig interpreter: draws any character from characters.js in any pose at time t, through a look's pen.
   Origin = feet centre, y up is negative, facing +x. opts: { facing: 1|-1, fx: bool, look } */
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const { CHARACTERS, POSE_DEFS } = node ? require('./characters.js') : root.CharLib;
  const { makePen } = node ? require('./looks.js') : root.LookLib;
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';

  const liftOf = (pd, t) => (pd.lift ? Math.abs(Math.sin(t * pd.lift.freq)) * pd.lift.amp : 0);
  const swingOf = (pd, t) => (pd.swing ? Math.sin(t * pd.swing.freq) * pd.swing.amp : 0);
  const qpts = (x0, y0, cx, cy, x1, y1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, d = k * k; return [a * x0 + b * cx + d * x1, a * y0 + b * cy + d * y1]; });
  const arc = (c, P, x, y, r, a0, a1, w = 3) => { c.beginPath(); c.arc(x, y, r, a0, a1); c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = P.line; c.stroke(); };

  /* shared face: eyes + mouth from pose.face; (ex, ey) = front eye, mouth below-right */
  function face(c, P, g, ex, ey, mx, my, f, t, chibi) {
    const eyes = chibi ? [ex - 18, ex] : [ex];
    for (const x of eyes) {
      if (f.eyes === 'open') { if (chibi) { g.E(x, ey, 4.5, 6, 0, P.line, false); g.E(x + 1.5, ey - 2, 1.6, 1.6, 0, '#ffffff', false); } else { g.E(x, ey, 7, 8, 0, '#fff'); g.E(x + 2, ey, 4.5, 4.5, 0, P.line, false); } }
      else if (f.eyes === 'wide') { g.E(x, ey, chibi ? 7.5 : 10, chibi ? 8.5 : 11, 0, '#fff'); g.E(x + 1, ey, 3, 3, 0, P.line, false); }
      else if (f.eyes === 'closed') arc(c, P, x, ey - 2, 6, 0.1, Math.PI - 0.1);
      else if (f.eyes === 'happy') arc(c, P, x, ey + 3, 6, Math.PI + 0.2, -0.2);
    }
    c.beginPath(); c.lineWidth = 3; c.strokeStyle = P.line; c.lineCap = 'round';
    if (f.mouth === 'smile') c.arc(mx, my - 6, 8, 0.2, Math.PI - 0.5);
    else if (f.mouth === 'grin') { c.arc(mx, my - 6, 10, 0.1, Math.PI - 0.3); c.closePath(); c.fillStyle = '#7a2e3a'; c.fill(); }
    else if (f.mouth === 'o') c.ellipse(mx, my, 6, 8, 0, 0, Math.PI * 2);
    else if (f.mouth === 'frown') c.arc(mx, my + 4, 8, Math.PI + 0.5, -0.2);
    else if (f.mouth === 'talk') { const o = 2 + Math.abs(Math.sin(t * 14)) * 6; c.ellipse(mx, my, 7, o, 0, 0, Math.PI * 2); c.fillStyle = '#7a2e3a'; c.fill(); }
    if (f.mouth !== 'none') c.stroke();
  }

  /* ================= animals ================= */
  function ears(g, ch, hx, hy, lean, t, lying, c) {
    const col = ch.colors, k = ch.features.ears;
    if (k === 'long') {
      if (lying) { g.E(hx - 22, hy - 24, 38, 11, -0.15, col.fur); g.E(hx - 22, hy - 24, 28, 6, -0.15, col.inner, false); return; }
      const w = Math.sin(t * 6) * 0.08 + lean;
      for (const [dx, r] of [[-10, -0.15], [4, 0.12]]) { c.save(); c.translate(hx + dx, hy - 22); c.rotate(r + w); g.E(0, -34, 13, 38, 0, col.fur); g.E(0, -34, 7, 30, 0, col.inner, false); c.restore(); }
    } else if (k === 'pointy') {
      const d = lean * 10;
      g.poly([[hx - 24, hy - 14], [hx - 14 - d, hy - 52], [hx, hy - 24]], col.fur); g.poly([[hx - 19, hy - 20], [hx - 14 - d, hy - 42], [hx - 6, hy - 25]], col.inner, false);
      g.poly([[hx + 4, hy - 26], [hx + 18 - d, hy - 56], [hx + 28, hy - 18]], col.fur); g.poly([[hx + 10, hy - 27], [hx + 18 - d, hy - 46], [hx + 23, hy - 22]], col.inner, false);
    } else if (k === 'round' || k === 'big') {
      const r = k === 'big' ? 21 : 13, ec = ch.features.patches ? col.accent : col.fur;
      g.E(hx - 18, hy - 24, r, r, 0, ec); g.E(hx + 16, hy - 27, r, r, 0, ec);
      if (!ch.features.patches) { g.E(hx - 18, hy - 24, r * 0.55, r * 0.55, 0, col.inner, false); g.E(hx + 16, hy - 27, r * 0.55, r * 0.55, 0, col.inner, false); }
    } else if (k === 'floppy') g.E(hx - 22, hy - 2, 11, 26, 0.35 + lean * 0.4, col.accent);
    else if (k === 'pig') { g.poly([[hx - 22, hy - 16], [hx - 18, hy - 42], [hx - 4, hy - 26]], col.fur); g.poly([[hx + 8, hy - 27], [hx + 20, hy - 46], [hx + 26, hy - 20]], col.fur); }
    else if (k === 'frog') { g.E(hx - 6, hy - 24, 14, 13, 0, col.fur); g.E(hx + 16, hy - 26, 14, 13, 0, col.fur); }
  }
  function tail(g, P, ch, x, y, t) {
    const col = ch.colors, k = ch.features.tail, w = Math.sin(t * 3) * 6;
    if (k === 'puff') g.E(x, y, 17, 17, 0, col.belly);
    else if (k === 'stub') g.E(x - 2, y - 8, 11, 8, -0.6, col.fur);
    else if (k === 'long') { const pts = qpts(x + 4, y + 2, x - 50, y + 10 + w, x - 40, y - 50 - w); g.line(pts, 9, P.line); g.line(pts, 5, col.fur); }
    else if (k === 'bushy') { g.E(x - 12, y - 16, 32, 15, -0.8 + w * 0.01, col.fur); g.E(x - 30, y - 36, 11, 9, -0.8, col.belly); }
    else if (k === 'curl') g.line(Array.from({ length: 9 }, (_, i) => [x - 6 + Math.cos(i * 0.6) * 8, y - 4 + Math.sin(i * 0.6) * 8]), 4, col.inner);
  }
  function critterHead(c, P, g, ch, hx, hy, pd, t, lying) {
    const col = ch.colors, F = ch.features;
    ears(g, ch, hx, hy, pd.earLean || 0, t, lying, c);
    g.E(hx, hy, 31, 28, 0, col.fur);
    if (F.stripes) { g.line([[hx - 6, hy - 27], [hx - 4, hy - 17]], 3, col.accent); g.line([[hx + 4, hy - 28], [hx + 4, hy - 18]], 3, col.accent); }
    if (F.patches) g.E(hx + 10, hy - 5, 12, 10, -0.4, col.accent, false);
    if (F.snout === 'muzzle') g.E(hx + 22, hy + 8, 16, 11, 0, col.belly);
    if (F.snout === 'pointed') g.poly([[hx + 10, hy - 2], [hx + 46, hy + 6], [hx + 10, hy + 18]], col.belly);
    if (F.snout === 'pig') { g.E(hx + 28, hy + 4, 10, 9, 0, col.inner); g.E(hx + 25, hy + 4, 2, 3, 0, P.line, false); g.E(hx + 31, hy + 4, 2, 3, 0, P.line, false); }
    else if (F.ears !== 'frog') g.E(F.snout === 'pointed' ? hx + 45 : hx + 30, hy + (F.snout === 'pointed' ? 6 : 2), 5, 4, 0, col.nose);
    const frog = F.ears === 'frog';
    face(c, P, g, frog ? hx + 16 : hx + 10, frog ? hy - 26 : hy - 6, hx + 18, hy + 12, pd.face, t, false);
    if (F.whiskers) for (const dy of [-2, 5]) g.line([[hx + 30, hy + 4], [hx + 52, hy + dy]], 2);
  }
  function critter(c, ch, pose, t, P, g) {
    const pd = POSE_DEFS[pose], col = ch.colors, legC = ch.features.darkLegs ? col.accent : col.fur;
    const lift = liftOf(pd, t), sw = swingOf(pd, t);
    g.E(0, 4, Math.max(20, 60 - lift * 0.4), 9, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -lift);
    let hx, hy;
    if (pd.layout === 'lying') {
      hx = 52; hy = -28;
      g.E(-8, -32, 64, 32, 0, col.fur); tail(g, P, ch, -64, -30, 0);
      g.E(10, -6, 24, 10, 0, legC); g.E(40, -4, 20, 8, 0, legC);
      critterHead(c, P, g, ch, hx, hy, pd, t, true);
    } else {
      hx = 50; hy = -96 + (pd.headDrop || 0);
      g.E(-34 - sw, -14, 26, 11, Math.abs(sw) > 8 ? 0.3 : 0, legC);
      tail(g, P, ch, -52, -62, t);
      g.E(0, -62, 52, 40, -0.1, col.fur); g.E(10, -50, 30, 24, -0.1, col.belly, false);
      if (ch.features.stripes) for (const x of [-30, -14]) g.line([[x, -98], [x + 4, -84]], 4, col.accent);
      g.E(30 + sw * 0.8, -10, 22, 9, 0, legC);
      critterHead(c, P, g, ch, hx, hy, pd, t, false);
    }
    c.restore();
    return { hx, hy: hy - lift };
  }
  function shell(c, ch, pose, t, P, g) {
    const pd = POSE_DEFS[pose], col = ch.colors, lying = pd.layout === 'lying';
    const walk = pose === 'walk' || pose === 'run' || pose === 'happy';
    const ph = t * (pose === 'run' ? 6 : 2.6), lift = liftOf(pd, t) * 0.3 + (walk ? Math.abs(Math.sin(ph)) * 3 : 0);
    g.E(0, 4, 78, 10, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -lift);
    const l = walk ? Math.sin(ph) * 7 : 0;
    if (!lying) { g.E(-42 + l, -12, 16, 12, 0, col.skin); g.E(34 - l, -12, 16, 12, 0, col.skin); g.E(-20 - l, -10, 16, 12, 0, col.skin); g.E(58 + l, -10, 16, 12, 0, col.skin); }
    g.E(-74, -26, 12, 8, 0.4, col.skin);
    const hx = lying ? 74 : 104, hy = (lying ? -34 : -62) + (pd.headDrop || 0);
    if (!lying) g.E(82, -44, 22, 14, 0.5, col.skin);
    g.E(hx, hy, 24, 21, 0, col.skin);
    face(c, P, g, hx, hy - 2, hx + 8, hy + 16, pd.face, t, false);
    if (pose === 'happy') g.E(hx - 6, hy + 10, 6, 4, 0, col.blush, false);
    const sy = lying ? 10 : 0;
    g.path(() => { c.moveTo(-72, -22 + sy); c.bezierCurveTo(-72, -108 + sy, 62, -108 + sy, 62, -22 + sy); c.closePath(); }, col.shell);
    g.line([[-36, -92 + sy], [-14, -60 + sy], [-14, -26 + sy]], 3, col.shellLine); g.line([[-14, -60 + sy], [22, -60 + sy], [32, -92 + sy]], 3, col.shellLine); g.line([[22, -60 + sy], [40, -26 + sy]], 3, col.shellLine);
    g.line([[-72, -22 + sy], [62, -22 + sy]], 5);
    c.restore();
    return { hx: hx - 40, hy: hy - lift - 10 };
  }

  /* ================= people (chibi) ================= */
  /* arm angle: 0 = hanging down, + = swung forward (+x), - = backward. Raised arms go out beside the head, never across the face. */
  const ARMS = { idle: [0.15, -0.1], sad: [0.04, 0.02], sleep: [0.1, 0.1], hop: [2.0, -2.3], shock: [1.9, -2.2], happy: [2.1, -2.4] };
  function human(c, ch, pose, t, P, g) {
    const pd = POSE_DEFS[pose], F = ch.features, col = ch.colors, s = F.scale || 1, ex = F.extras || [];
    const lift = liftOf(pd, t), run = pose === 'run', walking = pose === 'walk' || run;
    const ph = t * (run ? 9 : 5), legA = walking ? Math.sin(ph) * (run ? 0.6 : 0.35) : 0;
    let front, back;
    if (walking) { front = Math.sin(ph) * (run ? 0.9 : 0.5); back = -front; }
    else if (pose === 'talk') { front = 1.1 + Math.sin(t * 5) * 0.25; back = 0.12; }
    else [front, back] = ARMS[pose] || ARMS.idle;
    if (ex.includes('cane') && !['hop', 'shock', 'happy'].includes(pose)) front = 0.45;
    if ((ex.includes('magnifier') || ex.includes('book')) && (pose === 'idle' || pose === 'sad')) front = 0.9;
    g.E(0, 4, 46 * s, 8, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -lift); c.scale(s, s);
    const lying = pd.layout === 'lying';
    if (lying) { c.translate(-86, -40); c.rotate(Math.PI / 2); }
    if (run) c.rotate(0.12);
    const hx = 6 + (F.elder ? 6 : 0), hy = -136 + (pd.headDrop || 0) + (F.elder ? 6 : 0), R = 36;
    const hand = (sx, sy, a) => [sx + Math.sin(a) * 36, sy + Math.cos(a) * 36];
    const arm = (sx, sy, a) => { c.save(); c.translate(sx, sy); c.rotate(-a); g.rrect(-7, -4, 14, 36, 7, F.top === 'shirt' ? col.top : col.top); g.E(0, 36, 7.5, 7.5, 0, col.skin); c.restore(); };
    /* legs */
    const legCol = F.bottom === 'pants' ? col.bottom : col.skin;
    for (const [lx, a] of [[-9, -legA], [9, legA]]) {
      c.save(); c.translate(lx, -44); c.rotate(-a); g.rrect(-8, 0, 16, 42, 6, legCol);
      if (F.bottom === 'shorts') g.rrect(-9, 0, 18, 18, 4, col.bottom);
      g.E(5, 42, 13, 7, 0, col.shoe); c.restore();
    }
    /* back arm, back hair */
    arm(-20, -88, back);
    if (F.hair === 'long') g.E(hx - 8, hy + 18, 40, 48, 0, col.hair);
    if (F.hair === 'bob') g.E(hx - 4, hy + 6, 42, 38, 0, col.hair);
    if (F.hair === 'ponytail') { const sway = Math.sin(t * 6) * 0.15; c.save(); c.translate(hx - 34, hy - 10); c.rotate(0.6 + sway); g.E(0, 22, 13, 26, 0, col.hair); c.restore(); g.E(hx - 32, hy - 10, 6, 6, 0, col.accent); }
    if (F.hair === 'bun') g.E(hx - 10, hy - 38, 15, 14, 0, col.hair);
    /* body */
    if (F.bottom === 'skirt' || F.bottom === 'longskirt') { const hem = F.bottom === 'skirt' ? -22 : -6, w = F.bottom === 'skirt' ? 32 : 28; g.poly([[-24, -50], [24, -50], [w, hem], [-w, hem]], col.bottom); }
    g.rrect(-6, -102, 12, 10, 3, col.skin);
    if (F.top === 'coat') { g.rrect(-26, -96, 52, 64, 12, col.top); g.rrect(-7, -96, 14, 34, 3, col.inner); g.line([[0, -62], [0, -34]], 2); }
    else g.rrect(-24, -96, 48, 54, 14, col.top);
    if (F.top === 'suit') { g.poly([[-9, -96], [9, -96], [0, -70]], col.inner); }
    if (ex.includes('tie')) g.poly([[-3, -94], [3, -94], [5, -66], [0, -60], [-5, -66]], col.accent);
    if (ex.includes('apron')) { g.rrect(-18, -78, 36, 40, 6, col.accent); g.line([[-12, -78], [-8, -96]], 2.5, col.accent); g.line([[12, -78], [8, -96]], 2.5, col.accent); }
    if (ex.includes('stethoscope')) { g.line(qpts(-14, -96, 0, -60, 14, -96), 3, col.accent); g.E(6, -74, 4.5, 4.5, 0, '#b0b0b0'); }
    /* head */
    g.E(hx, hy, R, R, 0, col.skin);
    if (F.hair) {
      c.save(); c.beginPath(); c.arc(hx, hy, R, 0, Math.PI * 2); c.clip();
      const fr = F.hair === 'bob' || F.hair === 'long' ? 4 : 0;
      g.poly([[hx - R - 2, hy + 24], [hx - R - 2, hy - R - 2], [hx + R + 2, hy - R - 2], [hx + R + 2, hy - 8 + fr], [hx + 20, hy - 14 + fr], [hx + 10, hy - 8 + fr], [hx, hy - 14 + fr], [hx - 10, hy - 6 + fr], [hx - 16, hy + 24]], col.hair, false);
      c.restore();
      g.path(() => c.arc(hx, hy, R, 0, Math.PI * 2), null);
      if (F.hair === 'side') g.line([[hx - 4, hy - R + 2], [hx + 4, hy - 16]], 2);
    }
    if (ex.includes('blush')) { g.E(hx + 1, hy + 14, 6, 3.5, 0, '#ff9db0', false); g.E(hx + 30, hy + 14, 6, 3.5, 0, '#ff9db0', false); }
    face(c, P, g, hx + 24, hy + 2, hx + 16, hy + 20, pd.face, t, true);
    if (pd.face.eyes === 'wide') { g.line([[hx + 2, hy - 12], [hx + 10, hy - 14]], 2.5); g.line([[hx + 20, hy - 14], [hx + 28, hy - 12]], 2.5); }
    if (pose === 'sad') { g.line([[hx + 2, hy - 8], [hx + 10, hy - 11]], 2.5); g.line([[hx + 20, hy - 11], [hx + 28, hy - 8]], 2.5); }
    if (ex.includes('glasses')) { g.E(hx + 6, hy + 2, 9, 9, 0, null); g.E(hx + 24, hy + 2, 9, 9, 0, null); g.line([[hx + 15, hy + 2], [hx + 15, hy + 2]], 2); }
    if (F.hat === 'fedora') { g.rrect(hx - 26, hy - 58, 52, 32, 10, col.accent); g.rect(hx - 26, hy - 36, 52, 7, '#2b2220', false); g.E(hx, hy - 28, 46, 8, -0.04, col.accent); }
    if (F.hat === 'straw') { g.E(hx, hy - 36, 28, 18, 0, '#e8c77a'); g.E(hx, hy - 26, 56, 11, 0, '#e8c77a'); }
    /* front arm + held items */
    const [fx, fy] = hand(20, -88, front);
    arm(20, -88, front);
    if (ex.includes('cane')) { g.line([[fx + 2, fy], [fx + 10, 0]], 5, '#8a5a32'); }
    if (ex.includes('magnifier')) { g.line([[fx, fy], [fx + 12, fy - 12]], 4, '#5a3e2b'); g.E(fx + 20, fy - 20, 11, 11, 0, 'rgba(190,230,255,.6)'); }
    if (ex.includes('book')) g.rrect(fx - 4, fy - 12, 24, 30, 3, col.accent);
    c.restore();
    return lying ? { hx: 40 * s, hy: -60 * s - lift } : { hx: (hx - 30) * s, hy: (hy + 26) * s - lift };
  }

  function fx(c, P, list, t, hx, hy) {
    for (const k of list || []) {
      if (k === 'zzz') for (let i = 0; i < 3; i++) { const q = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - q; c.font = `bold ${22 + i * 8}px ${FONT}`; c.fillStyle = P.accent; c.fillText('Z', hx + 18 + i * 16 + q * 20, hy - 42 - q * 70 - i * 6); c.globalAlpha = 1; }
      if (k === 'speed') { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-90 - i * 18, -80 + i * 22); c.lineTo(-130 - i * 18, -80 + i * 22); c.stroke(); } }
      if (k === 'bang') { c.fillStyle = P.accent; c.font = `bold 46px ${FONT}`; c.fillText('!', hx + 44, hy - 50); }
      if (k === 'tear') { const q = (t * 0.8) % 1; c.fillStyle = '#6fc3ff'; c.beginPath(); c.ellipse(hx + 6, hy + 2 + q * 30, 4, 6, 0, 0, Math.PI * 2); c.fill(); }
    }
  }

  const TEMPLATES = { critter, shell, human };
  /** draw(ctx, name, pose, t, palette, opts) - opts: { facing: 1|-1, fx: bool, look } */
  function draw(c, name, pose, t, P, opts = {}) {
    const ch = CHARACTERS[name]; if (!ch) throw new Error('unknown character ' + name);
    if (!POSE_DEFS[pose]) throw new Error('unknown pose ' + pose);
    const g = makePen(c, P, opts.look, t);
    c.save(); if (opts.facing === -1) c.scale(-1, 1);
    const head = TEMPLATES[ch.template](c, ch, pose, t, P, g);
    if (opts.fx !== false) fx(c, P, POSE_DEFS[pose].fx, t, head.hx, head.hy);
    c.restore();
  }
  const Rig = { draw, TEMPLATES };
  if (node) module.exports = Rig; else root.Rig = Rig;
})(this);
