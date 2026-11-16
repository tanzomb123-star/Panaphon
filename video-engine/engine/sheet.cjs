#!/usr/bin/env node
/* Contact sheets for review / the app gallery.
   node engine/sheet.cjs characters out/characters.png [look]     every character x pose
   node engine/sheet.cjs looks out/looks.png [story.json] [t]      the story in all 10 animation styles
   node engine/sheet.cjs scenes out/scenes.png [story.json] [t]    the story in all scenes */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [mode = 'characters', out = `out/${mode}.png`, a3, a4] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  await page.goto('file://' + path.join(__dirname, 'stage.html'));
  let png;
  if (mode === 'characters') {
    png = await page.evaluate((lookName) => {
      const names = Object.keys(CharLib.CHARACTERS), poses = ['idle', 'walk', 'run', 'sleep', 'shock', 'happy', 'sad', 'talk'], cw = 230, chh = 260;
      const look = lookName ? LookLib.LOOKS[lookName] : undefined, base = SceneLib.SCENES.meadow, P = look && look.palette ? look.palette(base) : base;
      const cv = document.createElement('canvas'); cv.width = cw * poses.length + 120; cv.height = chh * names.length + 40; const c = cv.getContext('2d');
      c.fillStyle = look && (look.mode === 'neon' || look.mode === 'chalk') ? P.skyBot : '#f4f7fb'; c.fillRect(0, 0, cv.width, cv.height); c.font = 'bold 22px Loma'; c.fillStyle = look && look.mode ? '#eee' : '#333';
      poses.forEach((p, j) => c.fillText(p, 120 + j * cw + 80, 28));
      names.forEach((n, i) => { c.fillText(n, 10, 40 + i * chh + chh / 2); poses.forEach((p, j) => { c.save(); c.translate(120 + j * cw + 100, 40 + i * chh + 225); c.scale(0.8, 0.8); Rig.draw(c, n, p, 0.37, P, { look }); c.restore(); }); });
      return cv.toDataURL('image/png');
    }, a3);
  } else if (mode === 'models') {
    png = await page.evaluate(({ who, pose }) => {
      const looks = Object.entries(LookLib.LOOKS), tw = 300, th = 360, cols = 7, cv = document.createElement('canvas');
      cv.width = cols * tw; cv.height = Math.ceil(looks.length / cols) * (th + 44); const c = cv.getContext('2d'); c.fillStyle = '#d9d9dd'; c.fillRect(0, 0, cv.width, cv.height);
      looks.forEach(([id, look], i) => {
        const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 44), P = look.palette ? look.palette(SceneLib.SCENES.meadow) : SceneLib.SCENES.meadow;
        const o = document.createElement('canvas'); o.width = tw - 16; o.height = th - 16; const g = o.getContext('2d');
        const gr = g.createLinearGradient(0, 0, 0, o.height); gr.addColorStop(0, P.skyTop); gr.addColorStop(1, P.skyBot); g.fillStyle = gr; g.fillRect(0, 0, o.width, o.height);
        g.fillStyle = P.grass; g.fillRect(0, o.height - 56, o.width, 56);
        g.save(); g.translate(o.width / 2 - 10, o.height - 46); g.scale(1.15, 1.15); Rig.draw(g, who, pose, 0.45, P, { look, fx: false }); g.restore();
        LookLib.post(g, look, o.width, o.height, 0.45);
        c.drawImage(o, x + 8, y + 8); c.fillStyle = '#222'; c.font = 'bold 20px Loma'; c.fillText(String(look.no).padStart(2, '0') + '  ' + look.label.replace(/ \(.*\)/, ''), x + 10, y + th + 22);
        c.font = '15px Loma'; c.fillStyle = '#555'; const m = /\((.*)\)/.exec(look.label); if (m) c.fillText(m[1], x + 10, y + th + 40);
      });
      return cv.toDataURL('image/png');
    }, { who: a3 || 'bean', pose: a4 || 'happy' });
  } else {
    const story = JSON.parse(fs.readFileSync(a3 || 'stories/people.json', 'utf8')), t = +(a4 || 2.5), W = +(process.env.SHEET_W || 360), H = +(process.env.SHEET_H || 640);
    const names = await page.evaluate((m) => Object.keys(m === 'looks' ? LookLib.LOOKS : SceneLib.SCENES), mode), tiles = [];
    for (const n of names) {
      await page.evaluate((cfg) => window.init(cfg), { W, H, story, ...(mode === 'looks' ? { style: n } : { scene: n }) });
      tiles.push(await page.evaluate((tt) => { window.draw(tt); return document.getElementById('c').toDataURL('image/png'); }, t));
    }
    png = await page.evaluate(({ tiles, names, W, H }) => new Promise(async (res) => {
      const cols = 5, cv = document.createElement('canvas'); cv.width = cols * W; cv.height = Math.ceil(tiles.length / cols) * (H + 36); const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < tiles.length; i++) { const im = new Image(); im.src = tiles[i]; await im.decode(); const x = (i % cols) * W, y = Math.floor(i / cols) * (H + 36); c.drawImage(im, x, y + 36); c.fillStyle = '#fff'; c.font = 'bold 24px Loma'; c.fillText(names[i], x + 10, y + 26); }
      res(cv.toDataURL('image/png'));
    }), { tiles, names, W, H });
  }
  fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64')); await browser.close(); console.log('wrote', out);
})();
