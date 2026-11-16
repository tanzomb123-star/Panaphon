const test = require('node:test'); const assert = require('node:assert');
const { makeApp, fakeRender, story, as } = require('./helpers.cjs');

async function setup(opts) {
  const ctx = makeApp(opts);
  const { id } = (await ctx.app.inject({ method: 'POST', url: '/v1/projects', headers: as('u1'), payload: { story } })).json();
  return { ...ctx, projectId: id };
}
const grant = (app, n) => app.inject({ method: 'POST', url: '/v1/dev/credits', headers: as('u1'), payload: { amount: n } });
const renderReq = (app, id, payload = {}) => app.inject({ method: 'POST', url: `/v1/projects/${id}/render`, headers: as('u1'), payload });
const credits = async (app) => (await app.inject({ url: '/v1/me/credits', headers: as('u1') })).json().balance;

test('insufficient credits -> 402, no job, balance unchanged', async () => {
  const { app, db, projectId } = await setup(); await grant(app, 1);
  const r = await renderReq(app, projectId);
  assert.strictEqual(r.statusCode, 402); assert.deepStrictEqual(r.json(), { error: 'insufficient_credits', cost: 2, balance: 1 });
  assert.strictEqual(db.listJobs('u1').length, 0); assert.strictEqual(await credits(app), 1);
});
test('happy path: queued -> done, video URL, credits charged', async () => {
  const { app, queue, projectId } = await setup(); await grant(app, 10);
  const r = await renderReq(app, projectId, { aspect: '1:1', style: 'night' });
  assert.strictEqual(r.statusCode, 202); const { jobId, cost } = r.json(); assert.strictEqual(cost, 2);
  await queue.idle();
  const j = (await app.inject({ url: `/v1/jobs/${jobId}`, headers: as('u1') })).json();
  assert.strictEqual(j.status, 'done'); assert.strictEqual(j.progress, 1); assert.match(j.videoUrl, /^http:\/\/test\/files\/videos\/u1\/.+\.mp4\?exp=\d+&sig=/);
  assert.strictEqual(await credits(app), 8);
  const f = await app.inject({ url: j.videoUrl.replace('http://test', '') });
  assert.strictEqual(f.statusCode, 200); assert.strictEqual(f.headers['content-type'], 'video/mp4');
});
test('render params reach the engine', async () => {
  const renderFn = fakeRender(); const { app, queue, projectId } = await setup({ renderFn }); await grant(app, 10);
  await renderReq(app, projectId, { aspect: '16:9', style: 'winter' }); await queue.idle();
  const o = renderFn.calls[0]; assert.strictEqual(o.aspect, '16:9'); assert.strictEqual(o.style, 'winter'); assert.strictEqual(o.failOnQA, true); assert.strictEqual(o.story.title, 'ทดสอบ');
});
test('failed render -> failed with errors, refunded exactly once', async () => {
  const { app, db, queue, projectId } = await setup({ renderFn: fakeRender({ fail: true }) }); await grant(app, 10);
  const { jobId } = (await renderReq(app, projectId)).json(); await queue.idle();
  const j = (await app.inject({ url: `/v1/jobs/${jobId}`, headers: as('u1') })).json();
  assert.strictEqual(j.status, 'failed'); assert.deepStrictEqual(j.errors, ['character out of frame at 1s cat']); assert.strictEqual(j.videoUrl, null);
  assert.strictEqual(await credits(app), 10);
  assert.strictEqual(db.addCredits('u1', 2, 'refund', jobId), false); // second refund is ignored
  assert.strictEqual(await credits(app), 10);
});
test('voice requested: voice step runs, its files are passed to render, cost includes narration', async () => {
  const seen = []; const voiceFn = async (storyFile, dir) => { seen.push(storyFile); return { timeline: dir + '/t.json', audio: dir + '/a.mp3' }; };
  const renderFn = fakeRender(); const { app, queue, projectId } = await setup({ renderFn, voiceFn }); await grant(app, 10);
  const { cost } = (await renderReq(app, projectId, { voice: true })).json(); await queue.idle();
  assert.strictEqual(cost, 3); assert.strictEqual(seen.length, 1); assert.ok(renderFn.calls[0].audio.endsWith('/a.mp3'));
});
test('two jobs with concurrency 1 both finish, in order', async () => {
  const order = []; const base = fakeRender({ delayMs: 30 }); const renderFn = async (o) => { order.push(o.aspect); return base(o); };
  const { app, queue, projectId } = await setup({ renderFn }); await grant(app, 10);
  await renderReq(app, projectId, { aspect: '9:16' }); await renderReq(app, projectId, { aspect: '1:1' }); await queue.idle();
  assert.deepStrictEqual(order, ['9:16', '1:1']);
  const jobs = (await app.inject({ url: '/v1/jobs', headers: as('u1') })).json().jobs; assert.deepStrictEqual(jobs.map((j) => j.status), ['done', 'done']);
});
test('active job limit -> 429', async () => {
  const { app, projectId } = await setup({ renderFn: fakeRender({ delayMs: 200 }), maxActiveJobs: 1 }); await grant(app, 10);
  assert.strictEqual((await renderReq(app, projectId)).statusCode, 202);
  assert.strictEqual((await renderReq(app, projectId)).statusCode, 429);
});
test('bad aspect / style -> 400', async () => {
  const { app, projectId } = await setup(); await grant(app, 10);
  assert.strictEqual((await renderReq(app, projectId, { aspect: '4:3' })).statusCode, 400);
  assert.strictEqual((await renderReq(app, projectId, { style: 'neon' })).statusCode, 400);
});
