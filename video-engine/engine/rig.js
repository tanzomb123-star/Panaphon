/* Rig interpreter: draws any character from characters.js in any pose at time t.
   Origin = feet centre, y up is negative, facing +x. opts.fx=false skips effects (used by bbox tests). */
(function (root) {
  const CharLib = typeof module !== 'undefined' && module.exports ? require('./characters.js') : root.CharLib;
  const { CHARACTERS, POSE_DEFS } = CharLib;
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';

  function mk(c, P) {
    const E = (x, y, rx, ry, rot, fill, stroke = true) => {
      c.save(); c.translate(x, y); c.rotate(rot || 0); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); } c.restore();
    };
    const poly = (pts, fill, stroke = true) => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath();
      c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = P.line; c.stroke(); }
    };
    const line = (pts, w, col) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = col || P.line; c.stroke(); };
    return { E, poly, line };
  }
  const liftOf = (pd, t) => (pd.lift ? Math.abs(Math.sin(t * pd.lift.freq)) * pd.lift.amp : 0);
  const swingOf = (pd, t) => (pd.swing ? Math.sin(t * pd.swing.freq) * pd.swing.amp : 0);

  function face(c, P, g, hx, hy, f, t, frog) {
    const ex = frog ? hx + 16 : hx + 10, ey = frog ? hy - 26 : hy - 6;
    if (f.eyes === 'open' || f.eyes === 'wide') {
      const big = f.eyes === 'wide';
      g.E(ex, ey, big ? 10 : 7, big ? 11 : 8, 0, '#fff'); g.E(ex + 2, ey, big ? 3 : 4.5, big ? 3 : 4.5, 0, P.line, false);
    } else if (f.eyes === 'closed') { c.beginPath(); c.arc(ex, ey - 2, 6, 0.1, Math.PI - 0.1); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); }
    else if (f.eyes === 'happy') { c.beginPath(); c.arc(ex, ey + 3, 6, Math.PI + 0.2, -0.2); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); }
    const mx = hx + 18, my = hy + 12;
    c.beginPath(); c.lineWidth = 3; c.strokeStyle = P.line;
    if (f.mouth === 'smile') c.arc(mx, my - 6, 8, 0.2, Math.PI - 0.5);
    else if (f.mouth === 'grin') { c.arc(mx, my - 6, 10, 0.1, Math.PI - 0.3); c.closePath(); c.fillStyle = '#7a2e3a'; c.fill(); }
    else if (f.mouth === 'o') c.ellipse(mx, my, 6, 8, 0, 0, Math.PI * 2);
    else if (f.mouth === 'frown') c.arc(mx, my + 4, 8, Math.PI + 0.5, -0.2);
    else if (f.mouth === 'talk') { const o = 2 + Math.abs(Math.sin(t * 14)) * 6; c.ellipse(mx, my, 7, o, 0, 0, Math.PI * 2); c.fillStyle = '#7a2e3a'; c.fill(); }
    if (f.mouth !== 'none') c.stroke();
  }

  function ears(c, P, g, ch, hx, hy, lean, t, lying) {
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
    } else if (k === 'floppy') {
      g.E(hx - 22, hy - 2, 11, 26, 0.35 + lean * 0.4, col.accent);
    } else if (k === 'pig') {
      g.poly([[hx - 22, hy - 16], [hx - 18, hy - 42], [hx - 4, hy - 26]], col.fur); g.poly([[hx + 8, hy - 27], [hx + 20, hy - 46], [hx + 26, hy - 20]], col.fur);
    } else if (k === 'frog') {
      g.E(hx - 6, hy - 24, 14, 13, 0, col.fur); g.E(hx + 16, hy - 26, 14, 13, 0, col.fur);
    }
  }

  function tail(c, P, g, ch, x, y, t) {
    const col = ch.colors, k = ch.features.tail, w = Math.sin(t * 3) * 6;
    if (k === 'puff') g.E(x, y, 17, 17, 0, col.belly);
    else if (k === 'stub') g.E(x - 2, y - 8, 11, 8, -0.6, col.fur);
    else if (k === 'long') { c.beginPath(); c.moveTo(x + 4, y + 2); c.quadraticCurveTo(x - 50, y + 10 + w, x - 40, y - 50 - w); c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = P.line; c.stroke(); c.lineWidth = 5; c.strokeStyle = col.fur; c.stroke(); }
    else if (k === 'bushy') { g.E(x - 12, y - 16, 32, 15, -0.8 + w * 0.01, col.fur); g.E(x - 30, y - 36, 11, 9, -0.8, col.belly); }
    else if (k === 'curl') { c.beginPath(); c.arc(x - 6, y - 4, 8, 0, Math.PI * 1.6); c.lineWidth = 4; c.strokeStyle = col.inner; c.stroke(); }
  }

  function head(c, P, g, ch, hx, hy, pd, t, lying) {
    const col = ch.colors, F = ch.features;
    ears(c, P, g, ch, hx, hy, pd.earLean || 0, t, lying);
    g.E(hx, hy, 31, 28, 0, col.fur);
    if (F.stripes) { g.line([[hx - 6, hy - 27], [hx - 4, hy - 17]], 3, col.accent); g.line([[hx + 4, hy - 28], [hx + 4, hy - 18]], 3, col.accent); }
    if (F.patches) g.E(hx + 10, hy - 5, 12, 10, -0.4, col.accent, false);
    if (F.snout === 'muzzle') g.E(hx + 22, hy + 8, 16, 11, 0, col.belly);
    if (F.snout === 'pointed') g.poly([[hx + 10, hy - 2], [hx + 46, hy + 6], [hx + 10, hy + 18]], col.belly);
    if (F.snout === 'pig') { g.E(hx + 28, hy + 4, 10, 9, 0, col.inner); g.E(hx + 25, hy + 4, 2, 3, 0, P.line, false); g.E(hx + 31, hy + 4, 2, 3, 0, P.line, false); }
    else if (F.ears !== 'frog') g.E(F.snout === 'pointed' ? hx + 45 : hx + 30, hy + (F.snout === 'pointed' ? 6 : 2), 5, 4, 0, col.nose);
    face(c, P, g, hx, hy, pd.face, t, F.ears === 'frog');
    if (F.whiskers) for (const dy of [-2, 5]) g.line([[hx + 30, hy + 4], [hx + 52, hy + dy]], 2);
  }

  function critter(c, ch, pose, t, P, o) {
    const pd = POSE_DEFS[pose], g = mk(c, P), col = ch.colors, legC = ch.features.darkLegs ? col.accent : col.fur;
    const lift = liftOf(pd, t), sw = swingOf(pd, t);
    g.E(0, 4, Math.max(20, 60 - lift * 0.4), 9, 0, 'rgba(0,0,0,.18)', false);
    c.save(); c.translate(0, -lift);
    let hx, hy;
    if (pd.layout === 'lying') {
      hx = 52; hy = -28;
      g.E(-8, -32, 64, 32, 0, col.fur); tail(c, P, g, ch, -64, -30, 0);
      g.E(10, -6, 24, 10, 0, legC); g.E(40, -4, 20, 8, 0, legC);
      head(c, P, g, ch, hx, hy, pd, t, true);
    } else {
      hx = 50; hy = -96 + (pd.headDrop || 0);
      g.E(-34 - sw, -14, 26, 11, Math.abs(sw) > 8 ? 0.3 : 0, legC);
      tail(c, P, g, ch, -52, -62, t);
      g.E(0, -62, 52, 40, -0.1, col.fur); g.E(10, -50, 30, 24, -0.1, col.belly, false);
      if (ch.features.stripes) for (const x of [-30, -14]) g.line([[x, -98], [x + 4, -84]], 4, col.accent);
      g.E(30 + sw * 0.8, -10, 22, 9, 0, legC);
      head(c, P, g, ch, hx, hy, pd, t, false);
    }
    c.restore();
    if (o.fx !== false) fx(c, P, pd.fx, t, hx, hy - lift);
  }

  function shell(c, ch, pose, t, P, o) {
    const pd = POSE_DEFS[pose], g = mk(c, P), col = ch.colors, lying = pd.layout === 'lying';
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
    face(c, P, g, hx - 10, hy + 4, pd.face, t, false);
    if (pose === 'happy') g.E(hx - 6, hy + 10, 6, 4, 0, col.blush, false);
    const sy = lying ? 10 : 0;
    c.beginPath(); c.moveTo(-72, -22 + sy); c.bezierCurveTo(-72, -108 + sy, 62, -108 + sy, 62, -22 + sy); c.closePath(); c.fillStyle = col.shell; c.fill(); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke();
    g.line([[-36, -92 + sy], [-14, -60 + sy], [-14, -26 + sy]], 3, col.shellLine); g.line([[-14, -60 + sy], [22, -60 + sy], [32, -92 + sy]], 3, col.shellLine); g.line([[22, -60 + sy], [40, -26 + sy]], 3, col.shellLine);
    g.line([[-72, -22 + sy], [62, -22 + sy]], 5);
    c.restore();
    if (o.fx !== false) fx(c, P, pd.fx, t, hx - 40, hy - lift - 10);
  }

  function fx(c, P, list, t, hx, hy) {
    for (const k of list || []) {
      if (k === 'zzz') for (let i = 0; i < 3; i++) { const q = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - q; c.font = `bold ${22 + i * 8}px ${FONT}`; c.fillStyle = P.accent; c.fillText('Z', hx + 18 + i * 16 + q * 20, hy - 42 - q * 70 - i * 6); c.globalAlpha = 1; }
      if (k === 'speed') { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-90 - i * 18, -80 + i * 22); c.lineTo(-130 - i * 18, -80 + i * 22); c.stroke(); } }
      if (k === 'bang') { c.fillStyle = P.accent; c.font = `bold 46px ${FONT}`; c.fillText('!', hx + 44, hy - 50); }
      if (k === 'tear') { const q = (t * 0.8) % 1; c.fillStyle = '#6fc3ff'; c.beginPath(); c.ellipse(hx + 6, hy + 2 + q * 30, 4, 6, 0, 0, Math.PI * 2); c.fill(); }
    }
  }

  const TEMPLATES = { critter, shell };
  /** draw(ctx, name, pose, t, palette, opts) - opts: { facing: 1|-1, fx: bool } */
  function draw(c, name, pose, t, P, opts = {}) {
    const ch = CHARACTERS[name]; if (!ch) throw new Error('unknown character ' + name);
    if (!POSE_DEFS[pose]) throw new Error('unknown pose ' + pose);
    c.save(); if (opts.facing === -1) c.scale(-1, 1);
    TEMPLATES[ch.template](c, ch, pose, t, P, opts); c.restore();
  }
  const Rig = { draw, TEMPLATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = Rig; else root.Rig = Rig;
})(this);
