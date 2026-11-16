#!/usr/bin/env node
/* Entry point. ROLE=api | worker | all (default all: API + in-process worker, enough for local dev and a single instance). */
const path = require('path');
const { loadConfig } = require('./config.cjs');
const { openDb } = require('./db.cjs');
const { createAuth } = require('./auth.cjs');
const { createQueue } = require('./queue.cjs');
const { createLocalStorage } = require('./storage.cjs');
const { createWorker } = require('./worker.cjs');
const { buildApp } = require('./app.cjs');
const { render } = require('../../video-engine/engine/render.cjs');

(async () => {
  const config = loadConfig(), role = process.env.ROLE || 'all';
  const db = openDb(path.join(config.dataDir, 'app.db'));
  const storage = createLocalStorage({ dir: path.join(config.dataDir, 'files'), secret: config.fileSecret, publicUrl: config.publicUrl });
  const queue = createQueue({ redisUrl: config.redisUrl, concurrency: config.concurrency });
  if (role !== 'api') queue.process(createWorker({ db, storage, config, renderFn: render, log: console.error }));
  if (role !== 'worker') {
    const app = buildApp({ db, queue, storage, auth: createAuth({ jwtSecret: config.jwtSecret }), config });
    await app.listen({ port: config.port, host: '0.0.0.0' });
  }
})().catch((e) => { console.error(e); process.exit(1); });
