/* Golden frames: every style x aspect at a fixed t must match the stored PNG (<0.5% pixels differ).
   UPDATE_GOLDEN=1 npm test  -> rewrites test/golden/*.png after an intended visual change. */
const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { PNG } = require('pngjs'); const pixelmatch = require('pixelmatch');
const { STYLES } = require('../engine/styles.js');
const { dims } = require('../engine/render.cjs');
const { enginePage } = require('./helpers.cjs');
const story = require('../stories/showcase.json');
const DIR = path.join(__dirname, 'golden'); const UPDATE = !!process.env.UPDATE_GOLDEN;

test('golden frames for 10 styles x 3 aspects', async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const { browser, page } = await enginePage(); const failures = [];
  for (const aspect of ['9:16', '16:9', '1:1']) for (const style of Object.keys(STYLES)) {
    const { W, H } = dims(aspect, 200);
    const url = await page.evaluate(({ W, H, story, style }) => { window.init({ W, H, story, style }); window.draw(2.5); return document.getElementById('c').toDataURL('image/png'); }, { W, H, story, style });
    const buf = Buffer.from(url.split(',')[1], 'base64'), file = path.join(DIR, `${style}-${aspect.replace(':', 'x')}.png`);
    if (UPDATE || !fs.existsSync(file)) { fs.writeFileSync(file, buf); continue; }
    const a = PNG.sync.read(buf), b = PNG.sync.read(fs.readFileSync(file));
    if (a.width !== b.width || a.height !== b.height) { failures.push(`${file}: size changed`); continue; }
    const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height);
    if (diff > 0.005) failures.push(`${path.basename(file)}: ${(diff * 100).toFixed(2)}% pixels differ`);
  }
  await browser.close();
  assert.deepStrictEqual(failures, []);
});
