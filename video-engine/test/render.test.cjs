const test = require('node:test'); const assert = require('node:assert');
const { execFileSync } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { render } = require('../engine/render.cjs');
const story = { title: 'สั้น', style: 'storybook', shots: [{ id: 'a', dur: 3, text: 'ทดสอบ', cam: [[0, 0, -120, 900, 520]], actors: { cat: { x: [[0, -100], [3, 100]], pose: 'walk' } } }] };
const probe = (f) => execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames:format=duration', '-of', 'json', f]).toString();

for (const workers of [3, 5]) test(`parallel render with ${workers} workers keeps exact length`, async () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rt-')), 'x.mp4');
  const r = await render({ story, aspect: '1:1', short: 160, fps: 24, workers, out, failOnQA: true });
  assert.strictEqual(r.code, 0, JSON.stringify(r.errors));
  const p = JSON.parse(probe(out));
  assert.strictEqual(+p.streams[0].nb_read_frames, 72);
  assert.ok(Math.abs(+p.format.duration - 3) < 0.05, p.format.duration);
});
test('progress callback rises monotonically to 1', async () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rt-')), 'p.mp4'); const seen = [];
  const r = await render({ story, aspect: '1:1', short: 160, fps: 24, workers: 3, out, failOnQA: true, onProgress: (v) => seen.push(v) });
  assert.strictEqual(r.code, 0);
  assert.ok(seen.length >= 3, JSON.stringify(seen));
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] > seen[i - 1], JSON.stringify(seen));
  assert.strictEqual(seen[seen.length - 1], 1);
});
test('invalid story exits with code 1 before rendering', async () => {
  const bad = JSON.parse(JSON.stringify(story)); bad.shots[0].actors.cat.pose = 'fly';
  const r = await render({ story: bad, aspect: '1:1', short: 160, fps: 24, workers: 1, out: '/nonexistent/x.mp4', failOnQA: true });
  assert.strictEqual(r.code, 1); assert.ok(r.errors[0].includes('unknown pose'));
});
test('QA failure exits with code 2', async () => {
  const bad = JSON.parse(JSON.stringify(story)); bad.shots[0].actors.cat.x = 2000;
  const r = await render({ story: bad, aspect: '1:1', short: 160, fps: 24, workers: 1, out: '/nonexistent/x.mp4', failOnQA: true });
  assert.strictEqual(r.code, 2); assert.ok(r.errors.some((e) => e.includes('out of frame')));
});
