const test = require('node:test'); const assert = require('node:assert');
const { CHARACTERS, POSES } = require('../engine/characters.js');
const { enginePage } = require('./helpers.cjs');

test('library has 10 animals, 10 people, 3 bean figures and 9 poses', () => {
  const t = Object.values(CHARACTERS).map((c) => c.template);
  assert.strictEqual(t.length, 23); assert.strictEqual(t.filter((x) => x === 'human').length, 10); assert.strictEqual(t.filter((x) => x === 'bean').length, 3);
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

test('there are 21 looks (20 reference styles + thai)', () => { assert.strictEqual(Object.keys(require('../engine/looks.js').LOOKS).length, 21); });
test('every look draws every character without errors and leaves visible pixels', async () => {
  const { LOOKS } = require('../engine/looks.js');
  const { browser, page } = await enginePage();
  const res = await page.evaluate(({ names, looks }) => {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; const c = cv.getContext('2d'); const out = [];
    for (const l of looks) for (const n of names) {
      const look = LookLib.LOOKS[l], P = look.palette ? look.palette(SceneLib.SCENES.meadow) : SceneLib.SCENES.meadow;
      c.clearRect(0, 0, 300, 300); c.save(); c.translate(150, 260); c.scale(0.8, 0.8);
      try { Rig.draw(c, n, 'walk', 0.4, P, { look }); } catch (e) { out.push(`${l}/${n}: ${e.message}`); }
      c.restore(); const d = c.getImageData(0, 0, 300, 300).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) k++;
      if (k < 400) out.push(`${l}/${n}: only ${k} visible pixels`);
    }
    return out;
  }, { names: Object.keys(CHARACTERS), looks: Object.keys(LOOKS) });
  await browser.close();
  assert.deepStrictEqual(res, []);
});
