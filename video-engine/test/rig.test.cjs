const test = require('node:test'); const assert = require('node:assert');
const { CHARACTERS, POSES } = require('../engine/characters.js');
const { enginePage } = require('./helpers.cjs');

test('library has 10 characters and 9 poses', () => {
  assert.strictEqual(Object.keys(CHARACTERS).length, 10);
  assert.deepStrictEqual(POSES, ['idle', 'walk', 'hop', 'run', 'sleep', 'shock', 'happy', 'sad', 'talk']);
});

test('every character x pose draws inside its declared bbox', async () => {
  const { browser, page } = await enginePage();
  const res = await page.evaluate(({ names, poses }) => {
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d');
    const P = { line: '#3a2b24', accent: '#ff7043' }; const out = [];
    for (const n of names) for (const p of poses) for (const t of [0, 0.37, 1.1]) {
      c.clearRect(0, 0, 600, 600); c.save(); c.translate(300, 450); Rig.draw(c, n, p, t, P, { fx: false }); c.restore();
      const d = c.getImageData(0, 0, 600, 600).data; let l = 1e9, r = -1e9, tp = 1e9, b = -1e9, cnt = 0;
      for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) if (d[(y * 600 + x) * 4 + 3] > 60) { cnt++; if (x < l) l = x; if (x > r) r = x; if (y < tp) tp = y; if (y > b) b = y; }
      out.push({ n, p, t, cnt, box: [l - 300, tp - 450, r - 300, b - 450] });
    }
    return out;
  }, { names: Object.keys(CHARACTERS), poses: POSES });
  await browser.close();
  const bad = res.filter((r) => { const bb = CHARACTERS[r.n].bbox, tol = 4; return r.cnt < 500 || r.box[0] < bb[0] - tol || r.box[1] < bb[1] - tol || r.box[2] > bb[2] + tol || r.box[3] > bb[3] + tol; });
  assert.deepStrictEqual(bad, []);
});
