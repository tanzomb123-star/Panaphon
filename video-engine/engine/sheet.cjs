#!/usr/bin/env node
/* Contact sheets for review / app gallery.
   node engine/sheet.cjs characters out/characters.png
   node engine/sheet.cjs styles out/styles.png [story.json] [t] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [mode = 'characters', out = `out/${mode}.png`, storyPath = 'stories/showcase.json', tArg = '2'] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  await page.goto('file://' + path.join(__dirname, 'stage.html'));
  let png;
  if (mode === 'characters') {
    png = await page.evaluate(() => {
      const names = Object.keys(CharLib.CHARACTERS), poses = ['idle', 'walk', 'run', 'sleep', 'shock', 'happy', 'sad', 'talk'], cw = 230, chh = 260;
      const cv = document.createElement('canvas'); cv.width = cw * poses.length + 110; cv.height = chh * names.length + 40; const c = cv.getContext('2d');
      const P = StyleLib.STYLES.storybook; c.fillStyle = '#f4f7fb'; c.fillRect(0, 0, cv.width, cv.height); c.font = 'bold 22px Loma'; c.fillStyle = '#333';
      poses.forEach((p, j) => c.fillText(p, 110 + j * cw + 80, 28));
      names.forEach((n, i) => { c.fillText(n, 10, 40 + i * chh + chh / 2); poses.forEach((p, j) => { c.save(); c.translate(110 + j * cw + 100, 40 + i * chh + 220); c.scale(0.8, 0.8); Rig.draw(c, n, p, 0.37, P); c.restore(); }); });
      return cv.toDataURL('image/png');
    });
  } else {
    const story = JSON.parse(fs.readFileSync(storyPath, 'utf8')); const names = Object.keys(await page.evaluate(() => StyleLib.STYLES)), W = 360, H = 640;
    const tiles = [];
    for (const style of names) { await page.evaluate((cfg) => window.init(cfg), { W, H, story, style }); await page.evaluate((t) => window.draw(t), +tArg); tiles.push(await page.evaluate(() => document.getElementById('c').toDataURL('image/png'))); }
    png = await page.evaluate(({ tiles, names, W, H }) => new Promise(async (res) => {
      const cols = 5, cv = document.createElement('canvas'); cv.width = cols * W; cv.height = Math.ceil(tiles.length / cols) * (H + 36); const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < tiles.length; i++) { const im = new Image(); im.src = tiles[i]; await im.decode(); const x = (i % cols) * W, y = Math.floor(i / cols) * (H + 36); c.drawImage(im, x, y + 36); c.fillStyle = '#fff'; c.font = 'bold 24px Loma'; c.fillText(names[i], x + 10, y + 26); }
      res(cv.toDataURL('image/png'));
    }), { tiles, names, W, H });
  }
  fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64')); await browser.close(); console.log('wrote', out);
})();
