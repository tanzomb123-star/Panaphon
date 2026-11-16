const test = require('node:test'); const assert = require('node:assert');
const qa = require('../engine/qa.cjs');
const { enginePage } = require('./helpers.cjs');
const story = require('../stories/rabbit-tortoise.json');

test('black frame detected, noise is not', () => {
  const w = 64, h = 64, black = new Uint8ClampedArray(w * h * 4), noise = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919) % 256;
  assert.ok(qa.isBlack(qa.frameStats(black, w, h)));
  assert.ok(!qa.isBlack(qa.frameStats(noise, w, h)));
});
test('frozen run longer than 2.5s detected', () => {
  const hashes = [1, 2, ...Array(12).fill(7), 3]; // 12 samples * 0.25s = 3s
  assert.deepStrictEqual(qa.frozenRuns(hashes, 0.25), [{ from: 0.5, to: 3.5 }]);
  assert.deepStrictEqual(qa.frozenRuns([1, 2, 3, 3, 3, 4], 0.25), []);
});
test('voiceover longer than shot is reported', () => {
  const errs = qa.checkTimeline([{ shot: 's1', audioSec: 4.2, ok: true }, { shot: 's2', audioSec: 2, ok: false, similarity: 0.4 }], [4, 4]);
  assert.deepStrictEqual(errs, ['s1: voiceover 4.2s longer than shot 4s', 's2: voiceover does not match script (similarity 0.4)']);
});
test('long Thai subtitle overflows on 1:1, short one does not', async () => {
  const { browser, page } = await enginePage({ width: 720, height: 720 });
  const long = JSON.parse(JSON.stringify(story)); long.shots[0].text = 'กาลครั้งหนึ่งนานมาแล้ว '.repeat(12);
  const r1 = await page.evaluate((s) => { window.init({ W: 720, H: 720, story: s }); return window.qa(1); }, long);
  const r2 = await page.evaluate((s) => { window.init({ W: 720, H: 720, story: s }); return window.qa(1); }, story);
  await browser.close();
  assert.ok(r1.subtitle.overflow && r1.subtitle.lines > 3, JSON.stringify(r1.subtitle));
  assert.ok(!r2.subtitle.overflow, JSON.stringify(r2.subtitle));
});
test('crop QA flags an actor pushed outside the camera box', async () => {
  const { browser, page } = await enginePage({ width: 720, height: 1280 });
  const s = JSON.parse(JSON.stringify(story)); s.shots[0].actors.rabbit.x = -600;
  const r = await page.evaluate((st) => { window.init({ W: 720, H: 1280, story: st }); return window.qa(1); }, s);
  await browser.close();
  assert.deepStrictEqual(r.cropped.map((c) => c.id), ['rabbit']);
});
