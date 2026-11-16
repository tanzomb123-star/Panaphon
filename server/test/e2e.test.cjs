/* End to end with the real engine: API -> queue -> render.cjs -> signed URL -> playable mp4. */
const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path'); const { execFileSync } = require('child_process');
const { render } = require('../../video-engine/engine/render.cjs');
const { makeApp, story, as } = require('./helpers.cjs');

test('real render through the API produces a playable video', async () => {
  const { app, queue } = makeApp({ renderFn: render });
  const { id } = (await app.inject({ method: 'POST', url: '/v1/projects', headers: as('u1'), payload: { story } })).json();
  await app.inject({ method: 'POST', url: '/v1/dev/credits', headers: as('u1'), payload: { amount: 5 } });
  const { jobId } = (await app.inject({ method: 'POST', url: `/v1/projects/${id}/render`, headers: as('u1'), payload: { aspect: '9:16', style: 'paper', scene: 'forest' } })).json();
  await queue.idle();
  const j = (await app.inject({ url: `/v1/jobs/${jobId}`, headers: as('u1') })).json();
  assert.strictEqual(j.status, 'done', JSON.stringify(j.errors));
  const f = await app.inject({ url: j.videoUrl.replace('http://test', '') });
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-')), 'v.mp4'); fs.writeFileSync(out, f.rawPayload);
  const p = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', out]).toString());
  assert.deepStrictEqual([p.streams[0].width, p.streams[0].height], [160, 284]);
  assert.ok(Math.abs(+p.format.duration - 2) < 0.1, p.format.duration);
});
