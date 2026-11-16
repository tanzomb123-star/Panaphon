/* HTTP API. buildApp(deps) wires adapters so tests can swap any of them. */
const Fastify = require('fastify');
const fs = require('fs');
const { validateStory } = require('../../video-engine/engine/schema.cjs');
const { CHARACTERS, POSES } = require('../../video-engine/engine/characters.js');
const { LOOKS } = require('../../video-engine/engine/looks.js');
const { SCENES } = require('../../video-engine/engine/scenes.js');
const { PROPS } = require('../../video-engine/engine/props.js');
const { estimateCost } = require('./credits.cjs');

const ASPECTS = ['9:16', '16:9', '1:1'];

function jobView(job, storage, ttl) {
  return {
    id: job.id, projectId: job.project_id, status: job.status, progress: job.progress, aspect: job.aspect, style: job.style, scene: job.scene, voice: job.voice,
    cost: job.cost, seconds: job.seconds, errors: job.errors, createdAt: job.created_at, updatedAt: job.updated_at,
    videoUrl: job.status === 'done' && job.video_key ? storage.signedUrl(job.video_key, ttl) : null
  };
}

function buildApp({ db, queue, storage, auth, config }) {
  const app = Fastify({ logger: config.logger || false, bodyLimit: 512 * 1024 });

  app.decorateRequest('userId', null);
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/v1/') || req.url.startsWith('/v1/catalog') || req.url.startsWith('/v1/health')) return;
    req.userId = auth.userFromRequest(req);
    if (!req.userId) return reply.code(401).send({ error: 'unauthorized' });
  });

  app.get('/v1/health', async () => ({ ok: true, queue: queue.kind, storage: storage.kind, auth: auth.devMode ? 'dev' : 'jwt' }));
  app.get('/v1/catalog', async () => ({
    characters: Object.entries(CHARACTERS).map(([id, c]) => ({ id, kind: c.template === 'human' ? 'person' : 'animal', label: c.label || id })),
    poses: POSES, styles: Object.entries(LOOKS).map(([id, l]) => ({ id, label: l.label })), scenes: Object.keys(SCENES), props: Object.keys(PROPS), aspects: ASPECTS
  }));

  /* projects */
  app.post('/v1/projects', async (req, reply) => {
    const r = validateStory(req.body && req.body.story);
    if (!r.ok) return reply.code(400).send({ error: 'invalid_story', errors: r.errors });
    const id = db.createProject(req.userId, r.story);
    return reply.code(201).send({ id, estimate: { silent: estimateCost(r.story), voiced: estimateCost(r.story, { voice: true }) } });
  });
  app.get('/v1/projects', async (req) => ({ projects: db.listProjects(req.userId) }));
  app.get('/v1/projects/:id', async (req, reply) => {
    const p = db.getProject(req.params.id, req.userId); if (!p) return reply.code(404).send({ error: 'not_found' });
    return { id: p.id, title: p.title, story: p.story, createdAt: p.created_at };
  });

  /* renders */
  app.post('/v1/projects/:id/render', async (req, reply) => {
    const p = db.getProject(req.params.id, req.userId); if (!p) return reply.code(404).send({ error: 'not_found' });
    const { aspect = '9:16', style, scene, voice = false } = req.body || {};
    if (!ASPECTS.includes(aspect)) return reply.code(400).send({ error: 'bad_aspect', allowed: ASPECTS });
    if (style !== undefined && !LOOKS[style]) return reply.code(400).send({ error: 'bad_style', allowed: Object.keys(LOOKS) });
    if (scene !== undefined && !SCENES[scene]) return reply.code(400).send({ error: 'bad_scene', allowed: Object.keys(SCENES) });
    if (db.activeJobs(req.userId) >= config.maxActiveJobs) return reply.code(429).send({ error: 'too_many_active_jobs', limit: config.maxActiveJobs });
    const cost = estimateCost(p.story, { voice: !!voice });
    const jobId = db.createJob(req.userId, p.id, { aspect, style, scene, voice: !!voice, cost });
    if (!jobId) return reply.code(402).send({ error: 'insufficient_credits', cost, balance: db.balance(req.userId) });
    await queue.add(jobId);
    return reply.code(202).send({ jobId, cost, balance: db.balance(req.userId) });
  });
  app.get('/v1/jobs', async (req) => ({ jobs: db.listJobs(req.userId).map((j) => jobView(j, storage, config.urlTtl)) }));
  app.get('/v1/jobs/:id', async (req, reply) => {
    const j = db.getJob(req.params.id); if (!j || j.user_id !== req.userId) return reply.code(404).send({ error: 'not_found' });
    return jobView(j, storage, config.urlTtl);
  });

  /* credits */
  app.get('/v1/me/credits', async (req) => ({ balance: db.balance(req.userId) }));
  if (auth.devMode) app.post('/v1/dev/credits', async (req) => { db.addCredits(req.userId, Math.max(0, Math.min(10000, +(req.body && req.body.amount) || 0)), 'dev_grant'); return { balance: db.balance(req.userId) }; });

  /* signed file download with HTTP Range (iOS/Android video players require it) */
  app.get('/files/*', async (req, reply) => {
    const file = storage.verify(req.params['*'], req.query.exp, req.query.sig);
    if (!file) return reply.code(403).send({ error: 'forbidden' });
    const size = fs.statSync(file).size; reply.header('accept-ranges', 'bytes').type('video/mp4');
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m) {
      let start = m[1] === '' ? size - +m[2] : +m[1], end = m[1] !== '' && m[2] !== '' ? +m[2] : size - 1;
      if (Number.isNaN(start) || start < 0 || start >= size || end < start) return reply.code(416).header('content-range', `bytes */${size}`).send();
      end = Math.min(end, size - 1);
      return reply.code(206).header('content-range', `bytes ${start}-${end}/${size}`).header('content-length', end - start + 1).send(fs.createReadStream(file, { start, end }));
    }
    return reply.header('content-length', size).send(fs.createReadStream(file));
  });

  return app;
}
module.exports = { buildApp, ASPECTS };
