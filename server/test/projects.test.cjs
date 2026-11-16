const test = require('node:test'); const assert = require('node:assert');
const { makeApp, story, as, clone } = require('./helpers.cjs');
const { signHS256, verifyHS256 } = require('../src/auth.cjs');

test('catalog is public and lists the engine library', async () => {
  const { app } = makeApp(); const r = await app.inject({ url: '/v1/catalog' });
  assert.strictEqual(r.statusCode, 200);
  const b = r.json(); assert.strictEqual(b.characters.length, 20); assert.strictEqual(b.characters.filter((c) => c.kind === 'person').length, 10);
  assert.strictEqual(b.styles.length, 10); assert.deepStrictEqual(b.styles[0], { id: 'pastel', label: 'การ์ตูนเด็กสีพาสเทล' }); assert.strictEqual(b.scenes.length, 8); assert.deepStrictEqual(b.aspects, ['9:16', '16:9', '1:1']);
});
test('requests without a user are rejected', async () => {
  const { app } = makeApp(); const r = await app.inject({ method: 'POST', url: '/v1/projects', payload: { story } });
  assert.strictEqual(r.statusCode, 401);
});
test('invalid story -> 400 with readable errors', async () => {
  const { app } = makeApp(); const bad = clone(story); bad.shots[0].actors.cat.pose = 'fly';
  const r = await app.inject({ method: 'POST', url: '/v1/projects', headers: as('u1'), payload: { story: bad } });
  assert.strictEqual(r.statusCode, 400); assert.ok(r.json().errors[0].includes('unknown pose "fly"'));
});
test('create, get and list a project; estimate included', async () => {
  const { app } = makeApp();
  const c = await app.inject({ method: 'POST', url: '/v1/projects', headers: as('u1'), payload: { story } });
  assert.strictEqual(c.statusCode, 201); const { id, estimate } = c.json();
  assert.deepStrictEqual(estimate, { silent: 2, voiced: 3 }); // 2s; 16 chars -> +1
  const g = await app.inject({ url: `/v1/projects/${id}`, headers: as('u1') });
  assert.strictEqual(g.statusCode, 200); assert.strictEqual(g.json().story.title, 'ทดสอบ');
  const l = await app.inject({ url: '/v1/projects', headers: as('u1') });
  assert.strictEqual(l.json().projects.length, 1);
});
test("another user's project is 404", async () => {
  const { app } = makeApp();
  const { id } = (await app.inject({ method: 'POST', url: '/v1/projects', headers: as('u1'), payload: { story } })).json();
  const r = await app.inject({ url: `/v1/projects/${id}`, headers: as('u2') });
  assert.strictEqual(r.statusCode, 404);
  const rr = await app.inject({ method: 'POST', url: `/v1/projects/${id}/render`, headers: as('u2'), payload: {} });
  assert.strictEqual(rr.statusCode, 404);
});
test('JWT mode: valid token accepted, dev header and expired/forged tokens rejected', async () => {
  const secret = 'jwt-secret'; const { app } = makeApp({ jwtSecret: secret });
  const ok = signHS256({ sub: 'user-a', exp: Math.floor(Date.now() / 1000) + 60 }, secret);
  const expired = signHS256({ sub: 'user-a', exp: 1 }, secret), forged = signHS256({ sub: 'user-a' }, 'other');
  assert.strictEqual((await app.inject({ url: '/v1/me/credits', headers: { authorization: 'Bearer ' + ok } })).statusCode, 200);
  for (const h of [{ 'x-user-id': 'user-a' }, { authorization: 'Bearer ' + expired }, { authorization: 'Bearer ' + forged }]) assert.strictEqual((await app.inject({ url: '/v1/me/credits', headers: h })).statusCode, 401);
  assert.strictEqual((await app.inject({ method: 'POST', url: '/v1/dev/credits', headers: { authorization: 'Bearer ' + ok }, payload: { amount: 5 } })).statusCode, 404);
  assert.strictEqual(verifyHS256('a.b', secret), null);
});
