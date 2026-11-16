/* Animation styles ("looks"): HOW things are drawn, independent of the scene (WHERE).
   A look = palette transform + pen rules for every shape (outline, fill, glow, jitter) + frame post-processing + stepped timing.
   Rig, props and stage draw only through makePen(), so a new look restyles every character and prop at once. */
(function (root) {
  /* ---------- colour helpers ---------- */
  const HEX = /^#([0-9a-f]{6})$/i;
  const rgb = (c) => { const m = HEX.exec(c); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (c, to, k) => { const a = rgb(c), b = rgb(to); return a && b ? toHex(a.map((v, i) => v + (b[i] - v) * k)) : c; };
  const alpha = (c, a) => { const x = rgb(c); return x ? `rgba(${x[0]},${x[1]},${x[2]},${a})` : c; };
  const lum = (c) => { const x = rgb(c); return x ? (0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]) / 255 : 0.5; };
  const mapPalette = (P, fn) => { const o = {}; for (const k in P) o[k] = typeof P[k] === 'string' && HEX.test(P[k]) ? fn(P[k], k) : P[k]; return o; };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---------- the 10 looks ---------- */
  const LOOKS = {
    pastel: { label: 'การ์ตูนเด็กสีพาสเทล', outline: 'soft', lw: 1.3, fillMix: ['#ffffff', 0.28], palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#5b4a42' : mix(c, '#ffffff', 0.25))) },
    paper: { label: 'กระดาษตัดแปะ', outline: '#fffaf0', lw: 0.8, shadow: true, stepFps: 12, post: ['paper'] },
    chalk: {
      label: 'ชอล์กบนกระดานดำ', mode: 'chalk', lw: 1.1, jitter: 2.2, stepFps: 8, post: ['chalkdust'], edge: () => '#e8efe6',
      palette: (P) => ({ ...P, skyTop: '#22362b', skyBot: '#2f4a3a', sun: '#e8efe6', hill1: '#33533f', hill2: '#2b4737', grass: '#243a2f', track: '#2c4637', trackDash: '#dfe9df', treeTop: '#3d6a50', line: '#eef3ec', cloud: 'rgba(255,255,255,.22)', sub: 'rgba(0,0,0,.45)', subText: '#f4f7f2', accent: '#ffd166' })
    },
    comic: { label: 'คอมิก halftone', outline: '#111111', lw: 2, post: ['halftone'], palette: (P) => ({ ...mapPalette(P, (c) => mix(c, '#ffffff', -0.08)), line: '#111111', sub: 'rgba(255,255,255,.92)', subText: '#111111' }) },
    pixel: { label: 'พิกเซลอาร์ตย้อนยุค', lw: 1.6, stepFps: 8, post: ['pixel'] },
    neon: {
      label: 'นีออนกลางคืน', mode: 'neon', glow: 14, edge: (layer) => (layer === 0 ? '#ff4fd8' : '#36f9f6'),
      palette: (P) => ({ ...P, skyTop: '#05031a', skyBot: '#1a0b3b', sun: '#ff4fd8', sunOn: true, hill1: '#140e36', hill2: '#0e0a28', grass: '#09071c', track: '#100d2a', trackDash: '#36f9f6', treeTop: '#0f3b3a', line: '#e8f6ff', cloud: 'rgba(120,80,255,.18)', sub: 'rgba(10,0,30,.75)', subText: '#e8f6ff', accent: '#36f9f6' })
    },
    watercolor: { label: 'สีน้ำ', outline: 'bleed', lw: 0.8, wash: true, post: ['paper', 'soften'], palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#6b5a50' : mix(c, '#fdf6e8', 0.18))) },
    thai: {
      label: 'ไทยประเพณี', outline: '#c9971c', lw: 1.1, post: ['thaiBorder'],
      palette: (P) => ({ ...P, skyTop: '#6e1010', skyBot: '#b0331c', sun: '#f2c14e', sunOn: true, hill1: '#2f5d3a', hill2: '#244a2e', grass: '#2b5232', track: '#b8913f', trackDash: '#f5e2a8', treeTop: '#2f6b3a', line: '#3b1d0e', cloud: '#f2d488', sub: 'rgba(60,10,5,.82)', subText: '#fbe7b0', accent: '#f2c14e' })
    },
    minimal: { label: 'มินิมอล explainer', outline: null, palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#2d3142' : mix(c, '#f4f4f4', 0.12))) },
    noir: { label: 'noir ขาวดำลึกลับ', outline: '#000000', lw: 1.2, post: ['noir'], palette: (P) => ({ ...P, sub: 'rgba(0,0,0,.8)', subText: '#f2f2f2' }) }
  };
  const BASE = { outline: undefined, lw: 1 }; // plain flat cartoon: used when no look is given (rig tests, sheets)

  /* ---------- pen: every shape goes through paint() ---------- */
  function makePen(c, P, look = BASE, t = 0) {
    const L = look || BASE, lw = 3 * (L.lw || 1), step = L.stepFps ? Math.floor(t * L.stepFps) : 0; let n = 0;
    const J = (k) => (L.jitter ? (hash(n * 13.7 + k * 3.1 + step * 101.3) - 0.5) * 2 * L.jitter : 0);
    function paint(build, fill, stroke) {
      n++; let f = fill; if (f && L.fillMix && HEX.test(f)) f = mix(f, L.fillMix[0], L.fillMix[1]);
      c.save(); c.beginPath(); build(); c.lineJoin = 'round'; c.lineCap = 'round';
      if (L.mode === 'chalk') {
        if (f) { c.fillStyle = alpha(f, stroke ? 0.22 : 0.45); c.fill(); }
        if (stroke) { c.strokeStyle = HEX.test(f || '') ? mix(f, '#ffffff', 0.7) : '#eef3ec'; c.lineWidth = lw; c.stroke(); }
      } else if (L.mode === 'neon') {
        if (stroke) { if (f) { c.fillStyle = 'rgba(6,6,22,.9)'; c.fill(); } const g = !HEX.test(f || '') || lum(f) > 0.8 ? '#9ff3ff' : mix(f, '#ffffff', 0.3); c.shadowColor = g; c.shadowBlur = L.glow; c.strokeStyle = g; c.lineWidth = 2.5; c.stroke(); }
        else if (f) { c.globalAlpha = 0.6; c.fillStyle = f; c.fill(); }
      } else {
        if (f) {
          if (L.shadow && stroke) { c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowOffsetY = 3; c.shadowBlur = 3; }
          if (L.wash && HEX.test(f)) { c.fillStyle = alpha(f, 0.35); c.save(); c.translate(1.5, 1.5); c.fill(); c.restore(); c.fillStyle = alpha(f, 0.82); } else c.fillStyle = f;
          c.fill(); c.shadowColor = 'transparent';
        }
        if (stroke && L.outline !== null) {
          const o = L.outline === 'soft' ? mix(HEX.test(f || '') ? f : '#777777', '#3a2b24', 0.6) : L.outline === 'bleed' ? alpha(mix(HEX.test(f || '') ? f : '#777777', '#000000', 0.35), 0.55) : L.outline || P.line;
          c.strokeStyle = o; c.lineWidth = lw; c.stroke();
        }
      }
      c.restore();
    }
    const ellPath = (x, y, rx, ry, rot) => {
      if (!L.jitter) { c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); return; }
      const k = 18, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
      for (let i = 0; i <= k; i++) { const a = (i % k) / k * Math.PI * 2, ex = Math.cos(a) * (rx + J(i)), ey = Math.sin(a) * (ry + J(i + 50)); const px = x + ex * cr - ey * sr, py = y + ex * sr + ey * cr; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath();
    };
    const pen = {
      look: L,
      E: (x, y, rx, ry, rot, fill, stroke = true) => paint(() => ellPath(x, y, rx, ry, rot), fill, stroke),
      poly: (pts, fill, stroke = true) => paint(() => { pts.forEach((p, i) => (i ? c.lineTo(p[0] + J(i), p[1] + J(i + 9)) : c.moveTo(p[0] + J(i), p[1] + J(i + 9)))); c.closePath(); }, fill, stroke),
      rect: (x, y, w, h, fill, stroke = true) => pen.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, stroke),
      rrect: (x, y, w, h, r, fill, stroke = true) => paint(() => { if (L.jitter) { c.rect(x + J(1), y + J(2), w + J(3), h + J(4)); } else c.roundRect(x, y, w, h, r); }, fill, stroke),
      path: (build, fill, stroke = true) => paint(build, fill, stroke),
      line: (pts, w, col) => {
        n++; c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0] + J(i), p[1] + J(i + 7)) : c.moveTo(p[0] + J(i), p[1] + J(i + 7))));
        let s = col || P.line; if (L.mode === 'chalk') s = '#eef3ec'; if (L.mode === 'neon') { s = '#9ff3ff'; c.shadowColor = s; c.shadowBlur = L.glow; } else if (L.outline && L.outline !== 'soft' && L.outline !== 'bleed' && !col) s = L.outline;
        c.lineWidth = w * (L.lw || 1); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = s; c.stroke(); c.restore();
      }
    };
    return pen;
  }

  /* ---------- frame post-processing (browser only) ---------- */
  const cache = {};
  function off(key, w, h) { let o = cache[key]; if (!o || o.width !== w || o.height !== h) { o = cache[key] = document.createElement('canvas'); o.width = w; o.height = h; } return o; }
  function noisePattern(c, key, size, dots, col) {
    if (!cache[key]) { const o = document.createElement('canvas'); o.width = o.height = size; const g = o.getContext('2d'); for (let i = 0; i < dots; i++) { g.fillStyle = col(hash(i * 3.3)); g.fillRect(hash(i) * size, hash(i + 77) * size, 1 + hash(i + 5) * 2, 1 + hash(i + 9) * 2); } cache[key] = o; }
    return c.createPattern(cache[key], 'repeat');
  }
  const POST = {
    paper(c, W, H) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = noisePattern(c, 'paper', 200, 1400, (v) => `rgba(120,100,70,${0.03 + v * 0.07})`); c.fillRect(0, 0, W, H); c.restore(); },
    chalkdust(c, W, H) { c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = noisePattern(c, 'chalk', 180, 1600, (v) => `rgba(255,255,255,${0.04 + v * 0.1})`); c.fillRect(0, 0, W, H); c.restore(); },
    halftone(c, W, H) {
      if (!cache.dots) { const o = document.createElement('canvas'); o.width = o.height = 8; const g = o.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(4, 4, 1.6, 0, 7); g.fill(); cache.dots = o; }
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(cache.dots, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
    },
    pixel(c, W, H) {
      const s = Math.max(3, Math.round(Math.min(W, H) / 150)), w = Math.ceil(W / s), h = Math.ceil(H / s), o = off('px', w, h), g = o.getContext('2d');
      g.imageSmoothingEnabled = true; g.clearRect(0, 0, w, h); g.drawImage(c.canvas, 0, 0, w, h);
      c.save(); c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H); c.drawImage(o, 0, 0, w * s, h * s); c.restore();
    },
    soften(c, W, H) { const o = off('soft', W, H), g = o.getContext('2d'); g.clearRect(0, 0, W, H); g.drawImage(c.canvas, 0, 0); c.save(); c.globalAlpha = 0.45; c.filter = 'blur(1.2px)'; c.drawImage(o, 0, 0); c.restore(); },
    noir(c, W, H, t) {
      const o = off('noir', W, H), g = o.getContext('2d'); g.clearRect(0, 0, W, H); g.drawImage(c.canvas, 0, 0);
      c.save(); c.filter = 'grayscale(1) contrast(1.35) brightness(0.92)'; c.drawImage(o, 0, 0); c.filter = 'none';
      const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.65)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      const p = noisePattern(c, 'grain', 200, 3000, (q) => `rgba(255,255,255,${0.03 + q * 0.08})`); const k = Math.floor(t * 12);
      c.translate(Math.floor(hash(k) * 200), Math.floor(hash(k + 1) * 200)); c.fillStyle = p; c.fillRect(-200, -200, W + 200, H + 200); c.restore();
    },
    thaiBorder(c, W, H) {
      const b = Math.round(Math.min(W, H) * 0.035), gold = '#e0b13a', red = '#5a0d0d';
      c.save();
      for (const top of [true, false]) {
        const y0 = top ? 0 : H - b; c.fillStyle = red; c.fillRect(0, y0, W, b);
        c.fillStyle = gold; const n = Math.ceil(W / b);
        for (let i = 0; i <= n; i++) { const x = i * b; c.beginPath(); if (top) { c.moveTo(x, b); c.quadraticCurveTo(x + b * 0.5, b * 0.1, x + b, b); } else { c.moveTo(x, H - b); c.quadraticCurveTo(x + b * 0.5, H - b * 0.1, x + b, H - b); } c.fill(); }
        c.fillRect(0, top ? b - 2 : H - b, W, 2);
      }
      c.restore();
    }
  };
  function post(c, look, W, H, t) { for (const k of (look && look.post) || []) POST[k](c, W, H, t); }

  const lib = { LOOKS, BASE, makePen, post, mix, alpha };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib; else root.LookLib = lib;
})(this);
