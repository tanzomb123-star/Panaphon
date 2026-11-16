const fs = require('fs'); const os = require('os'); const path = require('path'); const { execFileSync } = require('child_process');
const { openDb } = require('../src/db.cjs');
const { createAuth } = require('../src/auth.cjs');
const { createMemoryQueue } = require('../src/queue.cjs');
const { createLocalStorage } = require('../src/storage.cjs');
const { createWorker } = require('../src/worker.cjs');
const { buildApp } = require('../src/app.cjs');

const story = {
  title: 'ทดสอบ', style: 'pastel', scene: 'meadow',
  shots: [{ id: 'a', dur: 2, text: 'แมวเดินเล่นในสวน', cam: [[0, 0, -120, 900, 520]], actors: { cat: { x: [[0, -100], [2, 100]], pose: 'walk' } } }]
};

/** A fake renderFn that writes a tiny real mp4 via ffmpeg (fast), reports progress, and can be told to fail. */
function fakeRender({ fail = false, delayMs = 0 } = {}) {
  const calls = [];
  const fn = async (o) => {
    calls.push(o); o.onProgress && o.onProgress(0.5);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (fail) return { code: 2, errors: ['character out of frame at 1s cat'] };
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:d=1:r=12', '-pix_fmt', 'yuv420p', o.out]);
    o.onProgress && o.onProgress(1); return { code: 0, seconds: 1 };
  };
  fn.calls = calls; return fn;
}

function makeApp({ renderFn = fakeRender(), voiceFn, jwtSecret, concurrency = 1, maxActiveJobs = 3 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'srv-'));
  const config = { publicUrl: 'http://test', urlTtl: 3600, renderShort: 160, renderFps: 12, renderWorkers: 2, maxActiveJobs, logger: false };
  const db = openDb(':memory:');
  const storage = createLocalStorage({ dir: path.join(dir, 'files'), secret: 'test-secret', publicUrl: 'http://test' });
  const queue = createMemoryQueue({ concurrency });
  queue.process(createWorker({ db, storage, config, renderFn, voiceFn }));
  const app = buildApp({ db, queue, storage, auth: createAuth({ jwtSecret }), config });
  return { app, db, queue, storage, config, dir };
}
const as = (user) => ({ 'x-user-id': user });
const clone = (o) => JSON.parse(JSON.stringify(o));
module.exports = { makeApp, fakeRender, story, as, clone };
