/* Animation styles ("looks"): HOW things are drawn, independent of the scene (WHERE).
   A look = palette transform + pen rules for every shape (outline, fill, glow, jitter, shading) + frame post-processing + stepped timing.
   Rig, props and stage draw only through makePen(), so a new look restyles every character and prop at once.
   20 looks follow the reference sheet (01 Classic Hand-Drawn ... 20 Expressive ink-splatter) plus "thai". */
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
  const sky = (P, o) => ({ ...P, ...o });

  /* ---------- the looks (display order = reference sheet order) ---------- */
  const LOOKS = {
    sketch: { no: 1, label: 'ลายมือดินสอ (Classic Hand-Drawn)', mode: 'sketch', lw: 0.9, jitter: 1.3, stepFps: 12, post: ['paper', 'vignetteSoft'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#efe4cf', 0.72)), { skyTop: '#f7eedc', skyBot: '#f3e6cc', line: '#3d332b', sub: 'rgba(61,51,43,.85)', subText: '#fbf3e4', accent: '#8a5a32', cloud: '#fffaf0' }) },
    anime: { no: 2, label: 'อนิเมะแอ็กชัน (Anime Action)', mode: 'anime', lw: 1.1, jitter: 0.8, stepFps: 12, post: ['speedlines'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#ffffff', 0.7)), { skyTop: '#ffffff', skyBot: '#eef3ff', line: '#14204a', sub: 'rgba(20,32,74,.88)', accent: '#e8344e', cloud: '#ffffff' }) },
    comic: { no: 3, label: 'การ์ตูนเส้นหนา (Bold Cartoon)', outline: '#1d1d1d', lw: 2.2, palette: (P) => ({ ...mapPalette(P, (c) => mix(c, '#ffffff', -0.06)), line: '#1d1d1d' }) },
    pastel: { no: 4, label: 'ชิบิน่ารัก (Cute Chibi)', outline: 'soft', lw: 1.3, fillMix: ['#ffffff', 0.28], gloss: true, palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#7a5a5a' : mix(c, '#ffffff', 0.3))) },
    pixel: { no: 5, label: 'พิกเซล 16 บิต (16-Bit Pixel Art)', lw: 1.6, stepFps: 8, post: ['pixel', 'scanlines'] },
    clay: { no: 6, label: 'ดินน้ำมัน (Tactile Clay)', mode: 'clay', stepFps: 12, post: ['vignetteSoft'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#cfc6bd', 0.35)), { skyTop: '#d9d3cc', skyBot: '#c9c1b8', line: '#4a3f36' }) },
    paper: { no: 7, label: 'กระดาษตัดซ้อนชั้น (Layered Paper-Cutout)', outline: '#fffaf0', lw: 0.8, shadow: true, stepFps: 12, post: ['paper'] },
    neon: { no: 8, label: 'นีออนไซเบอร์พังก์ (Neon Cyberpunk)', mode: 'neon', glow: 14, edge: (layer) => (layer === 0 ? '#ff4fd8' : '#36f9f6'), post: ['circuits'],
      palette: (P) => sky(P, { skyTop: '#05031a', skyBot: '#1a0b3b', sun: '#ff4fd8', sunOn: true, hill1: '#140e36', hill2: '#0e0a28', grass: '#09071c', track: '#100d2a', trackDash: '#36f9f6', treeTop: '#0f3b3a', line: '#e8f6ff', cloud: 'rgba(120,80,255,.18)', sub: 'rgba(10,0,30,.75)', subText: '#e8f6ff', accent: '#36f9f6' }) },
    minimal: { no: 9, label: 'มินิมอลเวกเตอร์ (Minimal Vector)', outline: null, palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#2d3142' : mix(c, '#f4f4f4', 0.12))) },
    watercolor: { no: 10, label: 'สีน้ำนิทาน (Watercolor Storybook)', outline: 'bleed', lw: 0.8, wash: true, post: ['paper', 'soften'], palette: (P) => mapPalette(P, (c, k) => (k === 'line' ? '#6b5a50' : mix(c, '#fdf6e8', 0.18))) },
    rubberhose: { no: 11, label: 'การ์ตูนยุค 30 (Rubber-hose Retro)', mode: 'rubberhose', outline: '#1a1410', lw: 2, stepFps: 12, post: ['grain', 'vignette'],
      palette: (P) => sky(mapPalette(P, (c) => mix(mix(c, '#e9dcc3', 0.7), '#c8a979', 0.15)), { skyTop: '#efe2c6', skyBot: '#e6d4b0', line: '#1a1410', sub: 'rgba(26,20,16,.88)', subText: '#f4ead6', accent: '#7a3b1e', cloud: '#f6ecd8', sun: '#f6ecd8' }) },
    noir: { no: 12, label: 'เงาดำฟิล์มนัวร์ (Noir Silhouette)', mode: 'silhouette', post: ['spotlight', 'grain'],
      palette: (P) => sky(P, { skyTop: '#1b1b20', skyBot: '#2a2724', sun: '#e9a94a', sunOn: false, hill1: '#24221f', hill2: '#1c1a18', grass: '#151412', track: '#2a2724', trackDash: '#3a3631', treeTop: '#141312', line: '#0d0d10', cloud: 'rgba(255,255,255,.05)', sub: 'rgba(0,0,0,.8)', subText: '#f2e6cf', accent: '#e9a94a', particles: P.particles === 'stars' ? null : P.particles }) },
    riso: { no: 13, label: 'พิมพ์ริโซกราฟ (Risograph Print)', mode: 'riso', lw: 1.2, post: ['grain'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#fff8ef', 0.35)), { skyTop: '#fffaf2', skyBot: '#fff3e6', line: '#2b59ff', accent: '#ff4f8b', sub: 'rgba(43,89,255,.9)' }) },
    chalk: { no: 14, label: 'ชอล์กกระดานดำ (Chalkboard)', mode: 'chalk', lw: 1.1, jitter: 2.2, stepFps: 8, post: ['chalkdust'], edge: () => '#e8efe6',
      palette: (P) => ({ ...P, skyTop: '#22362b', skyBot: '#2f4a3a', sun: '#e8efe6', hill1: '#33533f', hill2: '#2b4737', grass: '#243a2f', track: '#2c4637', trackDash: '#dfe9df', treeTop: '#3d6a50', line: '#eef3ec', cloud: 'rgba(255,255,255,.22)', sub: 'rgba(0,0,0,.45)', subText: '#f4f7f2', accent: '#ffd166' }) },
    origami: { no: 15, label: 'พับกระดาษโอริกามิ (Origami Fold)', mode: 'fold', stepFps: 12, palette: (P) => sky(mapPalette(P, (c) => mix(c, '#ffffff', 0.15)), { skyTop: '#fbfaf7', skyBot: '#efece6', line: '#3a3a3a' }) },
    lowpoly: { no: 16, label: 'โลว์โพลี 3 มิติ (Low-poly 3D)', mode: 'facet', palette: (P) => sky(P, { skyTop: '#1aa6a6', skyBot: '#58c9bd', cloud: 'rgba(255,255,255,.55)', line: '#123c3c' }) },
    cel: { no: 17, label: 'เซลเชดแอ็กชัน (Cel-shaded Action)', mode: 'cel', outline: '#1f2a6b', lw: 2, palette: (P) => ({ ...mapPalette(P, (c) => mix(c, '#ffffff', 0.1)), line: '#1f2a6b' }) },
    stitch: { no: 18, label: 'ผ้าปักตุ๊กตา (Embroidered Fabric)', mode: 'stitch', lw: 1.2, stepFps: 10, post: ['linen'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#efe9df', 0.3)), { skyTop: '#efebe4', skyBot: '#e4ded3', line: '#5a3d4a' }) },
    blueprint: { no: 19, label: 'พิมพ์เขียว (Technical Blueprint)', mode: 'blueprint', post: ['grid'],
      palette: (P) => sky(P, { skyTop: '#1f4fa3', skyBot: '#2559b5', sun: '#2f63bf', sunOn: false, hill1: '#2a5dbb', hill2: '#2d63c4', grass: '#2559b5', track: '#2a5fbd', trackDash: '#e8f1ff', treeTop: '#2a5dbb', line: '#e8f1ff', cloud: 'rgba(232,241,255,.12)', sub: 'rgba(10,30,80,.8)', subText: '#e8f1ff', accent: '#ffffff', particles: null }) },
    ink: { no: 20, label: 'หมึกสาด (Expressive Ink-splatter)', mode: 'ink', lw: 2.4, jitter: 1.4, stepFps: 10, post: ['splatter'],
      palette: (P) => sky(mapPalette(P, (c) => mix(c, '#ffffff', 0.85)), { skyTop: '#ffffff', skyBot: '#fbfbfb', line: '#111111', sub: 'rgba(17,17,17,.9)', accent: '#f0542a', cloud: '#ffffff', sunOn: false }) },
    thai: { no: 21, label: 'ไทยประเพณี', outline: '#c9971c', lw: 1.1, post: ['thaiBorder'],
      palette: (P) => ({ ...P, skyTop: '#6e1010', skyBot: '#b0331c', sun: '#f2c14e', sunOn: true, hill1: '#2f5d3a', hill2: '#244a2e', grass: '#2b5232', track: '#b8913f', trackDash: '#f5e2a8', treeTop: '#2f6b3a', line: '#3b1d0e', cloud: '#f2d488', sub: 'rgba(60,10,5,.82)', subText: '#fbe7b0', accent: '#f2c14e' }) }
  };
  const BASE = { outline: undefined, lw: 1 }; // plain flat cartoon: used when no look is given (rig tests, sheets)

  /* ---------- pen: every shape goes through paint() ---------- */
  function makePen(c, P, look = BASE, t = 0) {
    const L = look || BASE, lw = 3 * (L.lw || 1), step = L.stepFps ? Math.floor(t * L.stepFps) : 0; let n = 0;
    const J = (k) => (L.jitter ? (hash(n * 13.7 + k * 3.1 + step * 101.3) - 0.5) * 2 * L.jitter : 0);
    const dark = (f, k) => mix(HEX.test(f || '') ? f : '#888888', '#000000', k);
    /* meta: {x, y, w, h} bounds of the shape when known, for shading looks */
    function paint(build, fill, stroke, meta) {
      n++; let f = fill; if (f && L.fillMix && HEX.test(f)) f = mix(f, L.fillMix[0], L.fillMix[1]);
      const solid = f && HEX.test(f);
      c.save(); c.beginPath(); build(); c.lineJoin = 'round'; c.lineCap = 'round';
      const m = L.mode;
      if (m === 'chalk') {
        if (f) { c.fillStyle = alpha(f, stroke ? 0.22 : 0.45); c.fill(); }
        if (stroke) { c.strokeStyle = solid ? mix(f, '#ffffff', 0.7) : '#eef3ec'; c.lineWidth = lw; c.stroke(); }
      } else if (m === 'neon') {
        if (stroke) { if (f) { c.fillStyle = 'rgba(6,6,22,.9)'; c.fill(); } const g = !solid || lum(f) > 0.8 ? '#9ff3ff' : mix(f, '#ffffff', 0.3); c.shadowColor = g; c.shadowBlur = L.glow; c.strokeStyle = g; c.lineWidth = 2.5; c.stroke(); }
        else if (f) { c.globalAlpha = 0.6; c.fillStyle = f; c.fill(); }
      } else if (m === 'sketch') {
        if (f) { c.fillStyle = solid ? alpha(f, stroke ? 0.18 : 0.35) : f; c.fill(); }
        if (stroke) { c.strokeStyle = 'rgba(61,51,43,.85)'; c.lineWidth = lw * 0.7; c.stroke(); c.translate(0.9, 0.7); c.strokeStyle = 'rgba(61,51,43,.35)'; c.stroke(); }
      } else if (m === 'anime') {
        if (f) { c.fillStyle = solid ? mix(f, '#ffffff', 0.72) : f; c.fill(); }
        if (stroke) { c.strokeStyle = '#14204a'; c.lineWidth = lw * 0.75; c.stroke(); }
      } else if (m === 'blueprint') {
        if (f && stroke) { c.fillStyle = 'rgba(232,241,255,.06)'; c.fill(); }
        if (stroke || (f && solid && lum(f) < 0.3)) { c.strokeStyle = '#e8f1ff'; c.lineWidth = 2; c.stroke(); }
      } else if (m === 'silhouette') {
        if (stroke && f) { c.fillStyle = '#0d0d10'; c.fill(); }
        else if (f && !solid) { c.fillStyle = f; c.fill(); }
      } else if (m === 'ink') {
        if (f) { c.fillStyle = !solid ? f : lum(f) < 0.45 ? '#111111' : '#ffffff'; c.fill(); }
        if (stroke) { c.strokeStyle = '#111111'; c.lineWidth = lw; c.stroke(); }
      } else if (m === 'rubberhose') {
        if (f) { c.fillStyle = !solid ? f : lum(f) < 0.35 ? '#1a1410' : lum(f) > 0.78 ? '#fbf3e4' : mix(f, '#e3d2b2', 0.72); c.fill(); }
        if (stroke) { c.strokeStyle = '#1a1410'; c.lineWidth = lw; c.stroke(); }
      } else if (m === 'riso') {
        if (f) { c.fillStyle = solid ? alpha(mix(f, '#ffffff', 0.1), 0.88) : f; c.fill(); }
        if (stroke) { c.lineWidth = lw; c.translate(-1.6, -1); c.strokeStyle = 'rgba(255,79,139,.85)'; c.stroke(); c.translate(3.2, 2); c.strokeStyle = 'rgba(43,89,255,.85)'; c.stroke(); }
      } else if (m === 'clay' || m === 'fold' || m === 'facet' || m === 'cel' || m === 'stitch') {
        if (f) {
          const b = meta || null;
          if (m === 'clay' && solid && stroke) { c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 6; c.shadowOffsetY = 3; }
          if (m === 'clay' && solid && b) { const r = Math.max(b.w, b.h); const g = c.createRadialGradient(b.x + b.w * 0.35, b.y + b.h * 0.3, r * 0.05, b.x + b.w * 0.5, b.y + b.h * 0.5, r * 0.75); g.addColorStop(0, mix(f, '#ffffff', 0.35)); g.addColorStop(0.55, f); g.addColorStop(1, mix(f, '#000000', 0.28)); c.fillStyle = g; }
          else c.fillStyle = f;
          c.fill(); c.shadowColor = 'transparent';
          if (solid && b && stroke && m !== 'clay') {
            c.save(); c.clip();
            if (m === 'fold') { c.beginPath(); c.moveTo(b.x + b.w * 0.5, b.y - 2); c.lineTo(b.x + b.w + 2, b.y - 2); c.lineTo(b.x + b.w + 2, b.y + b.h + 2); c.lineTo(b.x + b.w * 0.42, b.y + b.h + 2); c.closePath(); c.fillStyle = dark(f, 0.16); c.fill(); }
            if (m === 'facet') { const s = Math.max(10, Math.min(b.w, b.h) / 2.2); for (let y = b.y - s, r = 0; y < b.y + b.h + s; y += s, r++) for (let x = b.x - s + (r % 2) * s / 2, k = 0; x < b.x + b.w + s; x += s, k++) { const v = hash(r * 31 + k * 7 + n); c.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.36})` : `rgba(0,0,0,${(0.5 - v) * 0.3})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y); c.lineTo(x + s / 2, y + s); c.closePath(); c.fill(); c.fillStyle = v > 0.5 ? `rgba(0,0,0,${(v - 0.5) * 0.2})` : `rgba(255,255,255,${(0.5 - v) * 0.3})`; c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s * 1.5, y + s); c.lineTo(x + s / 2, y + s); c.closePath(); c.fill(); } }
            if (m === 'cel') { c.fillStyle = dark(f, 0.28); c.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8); c.translate(-Math.max(4, b.w * 0.14), -Math.max(3, b.h * 0.1)); c.beginPath(); build(); c.fillStyle = f; c.fill(); }
            if (m === 'stitch') { c.globalAlpha = 0.18; c.fillStyle = fabric(c); c.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4); }
            c.restore();
          }
        }
        if (stroke) {
          c.beginPath(); build(); // shading replaced the current path; outline the shape itself
          if (m === 'cel') { c.strokeStyle = '#1f2a6b'; c.lineWidth = lw; c.stroke(); }
          if (m === 'stitch') { c.strokeStyle = dark(f, 0.45); c.lineWidth = lw * 0.8; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]); }
          if (m === 'fold' || m === 'facet') { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.stroke(); }
        }
      } else {
        if (f) {
          if (L.shadow && stroke) { c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowOffsetY = 3; c.shadowBlur = 3; }
          if (L.wash && solid) { c.fillStyle = alpha(f, 0.35); c.save(); c.translate(1.5, 1.5); c.fill(); c.restore(); c.fillStyle = alpha(f, 0.82); } else c.fillStyle = f;
          c.fill(); c.shadowColor = 'transparent';
        }
        if (stroke && L.outline !== null) {
          const o = L.outline === 'soft' ? mix(solid ? f : '#777777', '#3a2b24', 0.6) : L.outline === 'bleed' ? alpha(mix(solid ? f : '#777777', '#000000', 0.35), 0.55) : L.outline || P.line;
          c.strokeStyle = o; c.lineWidth = lw; c.stroke();
        }
        if (L.gloss && solid && stroke && meta && meta.w > 34 && meta.h > 34) { c.beginPath(); c.ellipse(meta.x + meta.w * 0.32, meta.y + meta.h * 0.26, meta.w * 0.14, meta.h * 0.09, -0.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); }
      }
      c.restore();
    }
    let fabricPat = null; function fabric(cx) { if (!fabricPat) { const o = document.createElement('canvas'); o.width = o.height = 6; const g = o.getContext('2d'); g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 6); g.lineTo(6, 0); g.moveTo(0, 0); g.lineTo(6, 6); g.stroke(); fabricPat = cx.createPattern(o, 'repeat'); } return fabricPat; }
    const ellPath = (x, y, rx, ry, rot) => {
      if (!L.jitter) { c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); return; }
      const k = 18, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
      for (let i = 0; i <= k; i++) { const a = (i % k) / k * Math.PI * 2, ex = Math.cos(a) * (rx + J(i)), ey = Math.sin(a) * (ry + J(i + 50)); const px = x + ex * cr - ey * sr, py = y + ex * sr + ey * cr; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath();
    };
    const bounds = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
    const pen = {
      look: L,
      E: (x, y, rx, ry, rot, fill, stroke = true) => { const r = Math.max(rx, ry); paint(() => ellPath(x, y, rx, ry, rot), fill, stroke, rot ? { x: x - r, y: y - r, w: 2 * r, h: 2 * r } : { x: x - rx, y: y - ry, w: 2 * rx, h: 2 * ry }); },
      poly: (pts, fill, stroke = true) => paint(() => { pts.forEach((p, i) => (i ? c.lineTo(p[0] + J(i), p[1] + J(i + 9)) : c.moveTo(p[0] + J(i), p[1] + J(i + 9)))); c.closePath(); }, fill, stroke, bounds(pts)),
      rect: (x, y, w, h, fill, stroke = true) => pen.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, stroke),
      rrect: (x, y, w, h, r, fill, stroke = true) => paint(() => { if (L.jitter) { c.rect(x + J(1), y + J(2), w + J(3), h + J(4)); } else c.roundRect(x, y, w, h, r); }, fill, stroke, { x, y, w, h }),
      path: (build, fill, stroke = true, meta) => paint(build, fill, stroke, meta),
      line: (pts, w, col) => {
        n++; c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0] + J(i), p[1] + J(i + 7)) : c.moveTo(p[0] + J(i), p[1] + J(i + 7))));
        let s = col || P.line; const m = L.mode;
        if (m === 'chalk') s = col && HEX.test(col) && lum(col) < 0.6 && col !== P.line ? mix(col, '#ffffff', 0.55) : '#eef3ec';
        else if (m === 'neon') { s = col && HEX.test(col) && col !== P.line ? mix(col, '#ffffff', 0.3) : '#9ff3ff'; c.shadowColor = s; c.shadowBlur = L.glow; }
        else if (m === 'blueprint') s = '#e8f1ff';
        else if (m === 'silhouette') s = '#0d0d10';
        else if (m === 'sketch') s = col && col !== P.line && HEX.test(col) ? alpha(mix(col, '#3d332b', 0.5), 0.75) : 'rgba(61,51,43,.85)';
        else if (m === 'ink') s = col && col !== P.line && HEX.test(col) && lum(col) > 0.45 ? '#ffffff' : '#111111';
        else if (m === 'rubberhose') s = col && col !== P.line && HEX.test(col) && lum(col) > 0.78 ? '#fbf3e4' : col && col !== P.line && HEX.test(col) && lum(col) > 0.35 ? mix(col, '#e3d2b2', 0.72) : '#1a1410';
        else if (L.outline && L.outline !== 'soft' && L.outline !== 'bleed' && !col) s = L.outline;
        c.lineWidth = w * (L.lw || 1); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = s; c.stroke(); c.restore();
      }
    };
    return pen;
  }

  /* ---------- frame post-processing (browser only) ---------- */
  const cache = {};
  // offscreen canvases are cached per size, so frames of different sizes don't reallocate each other's buffers
  function off(name, w, h) { const key = `${name}:${w}x${h}`; let o = cache[key]; if (!o || o.width !== w || o.height !== h) { o = cache[key] = document.createElement('canvas'); o.width = w; o.height = h; } return o; }
  function noisePattern(c, key, size, dots, col) {
    if (!cache[key]) { const o = document.createElement('canvas'); o.width = o.height = size; const g = o.getContext('2d'); for (let i = 0; i < dots; i++) { g.fillStyle = col(hash(i * 3.3)); g.fillRect(hash(i) * size, hash(i + 77) * size, 1 + hash(i + 5) * 2, 1 + hash(i + 9) * 2); } cache[key] = o; }
    return c.createPattern(cache[key], 'repeat');
  }
  const S = (W, H) => Math.min(W, H) / 400; // scale for decorations
  const POST = {
    paper(c, W, H) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = noisePattern(c, 'paper', 200, 1400, (v) => `rgba(120,100,70,${0.03 + v * 0.07})`); c.fillRect(0, 0, W, H); c.restore(); },
    linen(c, W, H) { c.save(); c.globalCompositeOperation = 'multiply'; if (!cache.linen) { const o = document.createElement('canvas'); o.width = o.height = 8; const g = o.getContext('2d'); g.fillStyle = 'rgba(120,100,80,.10)'; g.fillRect(0, 0, 8, 1); g.fillRect(0, 4, 8, 1); g.fillStyle = 'rgba(120,100,80,.07)'; g.fillRect(0, 0, 1, 8); g.fillRect(4, 0, 1, 8); cache.linen = o; } c.fillStyle = c.createPattern(cache.linen, 'repeat'); c.fillRect(0, 0, W, H); c.restore(); },
    chalkdust(c, W, H) { c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = noisePattern(c, 'chalk', 180, 1600, (v) => `rgba(255,255,255,${0.04 + v * 0.1})`); c.fillRect(0, 0, W, H); c.restore(); },
    grain(c, W, H, t) { c.save(); const k = Math.floor(t * 12); c.translate(Math.floor(hash(k) * 160), Math.floor(hash(k + 1) * 160)); c.fillStyle = noisePattern(c, 'grain2', 160, 2200, (q) => (q > 0.5 ? `rgba(255,255,255,${(q - 0.5) * 0.16})` : `rgba(0,0,0,${(0.5 - q) * 0.18})`)); c.fillRect(-160, -160, W + 160, H + 160); c.restore(); },
    vignette(c, W, H) { const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72); v.addColorStop(0, 'rgba(60,40,20,0)'); v.addColorStop(1, 'rgba(60,40,20,.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H); },
    vignetteSoft(c, W, H) { const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = v; c.fillRect(0, 0, W, H); },
    scanlines(c, W, H) { c.save(); c.fillStyle = 'rgba(0,0,0,.08)'; const s = Math.max(2, Math.round(Math.min(W, H) / 220)); for (let y = 0; y < H; y += s * 2) c.fillRect(0, y, W, s); c.restore(); },
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
    spotlight(c, W, H) {
      c.save(); const cx = W / 2, top = -H * 0.05, r = Math.max(W, H);
      const g = c.createRadialGradient(cx, H * 0.62, Math.min(W, H) * 0.12, cx, H * 0.62, Math.min(W, H) * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'screen'; const b = c.createLinearGradient(0, top, 0, H * 0.8); b.addColorStop(0, 'rgba(233,169,74,.55)'); b.addColorStop(1, 'rgba(233,169,74,.22)'); c.fillStyle = b;
      c.beginPath(); c.moveTo(cx - W * 0.06, top); c.lineTo(cx + W * 0.06, top); c.lineTo(cx + Math.min(W, H) * 0.42, H * 0.8); c.lineTo(cx - Math.min(W, H) * 0.42, H * 0.8); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(cx, H * 0.8, Math.min(W, H) * 0.42, Math.min(W, H) * 0.06, 0, 0, 7); c.fillStyle = 'rgba(233,169,74,.35)'; c.fill(); void r; c.restore();
    },
    speedlines(c, W, H, t) {
      c.save(); const cx = W / 2, cy = H * 0.55, k = Math.floor(t * 12), s = S(W, H);
      for (let i = 0; i < 26; i++) { const a = hash(i * 7 + k) * Math.PI * 2, r0 = Math.min(W, H) * (0.32 + hash(i + k * 3) * 0.12), len = Math.min(W, H) * (0.12 + hash(i * 3 + k) * 0.2);
        c.strokeStyle = i % 3 === 0 ? 'rgba(232,52,78,.55)' : 'rgba(30,70,200,.45)'; c.lineWidth = (1 + hash(i + 5) * 2.5) * s; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); c.stroke(); }
      c.restore();
    },
    circuits(c, W, H) {
      c.save(); const s = S(W, H); c.lineWidth = 1.5 * s; c.shadowBlur = 8 * s;
      for (let i = 0; i < 10; i++) { const left = i % 2 === 0, x = left ? (8 + hash(i) * 40) * s : W - (8 + hash(i) * 40) * s, col = i % 3 ? '#36f9f6' : '#ff4fd8'; c.strokeStyle = col; c.shadowColor = col; c.globalAlpha = 0.55;
        c.beginPath(); let y = hash(i + 3) * H * 0.6; c.moveTo(x, y); y += (40 + hash(i + 5) * 120) * s; c.lineTo(x, y); const x2 = x + (left ? 1 : -1) * (20 + hash(i + 7) * 30) * s; c.lineTo(x2, y + 20 * s); c.lineTo(x2, y + (60 + hash(i + 9) * 80) * s); c.stroke();
        c.beginPath(); c.arc(x2, y + (60 + hash(i + 9) * 80) * s, 3 * s, 0, 7); c.stroke(); }
      c.restore();
    },
    grid(c, W, H) {
      c.save(); const s = S(W, H), g = 20 * s;
      c.strokeStyle = 'rgba(232,241,255,.13)'; c.lineWidth = 1; for (let x = 0; x < W; x += g) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += g) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = 'rgba(232,241,255,.4)'; c.lineWidth = 1.5 * s; c.strokeRect(8 * s, 8 * s, W - 16 * s, H - 16 * s); c.restore();
    },
    splatter(c, W, H) {
      c.save(); const s = S(W, H);
      for (let i = 0; i < 18; i++) { const x = hash(i * 5.1) * W, y = hash(i * 9.7) * H * 0.75, r = (3 + hash(i * 2.3) * 16) * s; if (Math.abs(x - W / 2) < W * 0.18 && y > H * 0.35) continue;
        c.fillStyle = i % 3 === 0 ? 'rgba(240,84,42,.75)' : 'rgba(17,17,17,.8)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        for (let k = 0; k < 5; k++) { const a = hash(i * 13 + k) * 7, d = r * (1.4 + hash(i + k * 3) * 1.8); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.18 * (1 + hash(k + i)), 0, 7); c.fill(); } }
      c.restore();
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
