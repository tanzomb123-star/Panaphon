const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { makeApp } = require('./helpers.cjs');

async function withFile() {
  const ctx = makeApp(); const src = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-')), 'v.mp4');
  fs.writeFileSync(src, Buffer.alloc(1000, 7)); await ctx.storage.put('videos/u1/x.mp4', src);
  return ctx;
}
const local = (u) => u.replace('http://test', '');

test('valid signed URL -> 200 with full body', async () => {
  const { app, storage } = await withFile(); const r = await app.inject({ url: local(storage.signedUrl('videos/u1/x.mp4')) });
  assert.strictEqual(r.statusCode, 200); assert.strictEqual(r.rawPayload.length, 1000); assert.strictEqual(r.headers['accept-ranges'], 'bytes');
});
test('Range request -> 206 partial content', async () => {
  const { app, storage } = await withFile(); const r = await app.inject({ url: local(storage.signedUrl('videos/u1/x.mp4')), headers: { range: 'bytes=100-199' } });
  assert.strictEqual(r.statusCode, 206); assert.strictEqual(r.headers['content-range'], 'bytes 100-199/1000'); assert.strictEqual(r.rawPayload.length, 100);
  const bad = await app.inject({ url: local(storage.signedUrl('videos/u1/x.mp4')), headers: { range: 'bytes=5000-' } });
  assert.strictEqual(bad.statusCode, 416);
});
test('tampered signature, other key, or expired URL -> 403', async () => {
  const { app, storage } = await withFile(); const u = local(storage.signedUrl('videos/u1/x.mp4'));
  assert.strictEqual((await app.inject({ url: u.replace(/sig=./, 'sig=A') })).statusCode, 403);
  assert.strictEqual((await app.inject({ url: u.replace('x.mp4', 'y.mp4') })).statusCode, 403);
  const old = local(storage.signedUrl('videos/u1/x.mp4', 60, Math.floor(Date.now() / 1000) - 3600));
  assert.strictEqual((await app.inject({ url: old })).statusCode, 403);
});
test('path traversal keys are refused', async () => {
  const { storage } = await withFile();
  assert.strictEqual(storage.verify('../secret', 9999999999, 'x'), null);
  await assert.rejects(() => storage.put('../evil.mp4', __filename));
});
