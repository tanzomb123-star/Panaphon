/* Queue adapters, same shape: { add(jobId), process(handler), idle(), close() }.
   memory: in-process FIFO (local dev, tests). bullmq: Redis-backed, used when REDIS_URL is set (multi-instance workers). */
function createMemoryQueue({ concurrency = 1 } = {}) {
  const pending = []; let running = 0, handler = null, waiters = [];
  const settle = () => { if (!pending.length && !running) { waiters.forEach((w) => w()); waiters = []; } };
  const pump = () => {
    while (handler && running < concurrency && pending.length) {
      const id = pending.shift(); running++;
      Promise.resolve().then(() => handler(id)).catch(() => {}).finally(() => { running--; pump(); settle(); });
    }
  };
  return {
    kind: 'memory',
    async add(id) { pending.push(id); pump(); },
    process(fn) { handler = fn; pump(); },
    idle() { return new Promise((r) => { waiters.push(r); settle(); }); },
    async close() {}
  };
}

function createBullQueue({ redisUrl, concurrency = 1, name = 'render' }) {
  const { Queue, Worker } = require('bullmq'); // optional dependency, only needed in production
  const connection = { url: redisUrl };
  const queue = new Queue(name, { connection }); let worker = null;
  return {
    kind: 'bullmq',
    async add(id) { await queue.add('render', { jobId: id }, { jobId: id, removeOnComplete: 1000, removeOnFail: 1000 }); },
    process(fn) { worker = new Worker(name, (j) => fn(j.data.jobId), { connection, concurrency }); },
    async idle() { /* not meaningful across processes */ },
    async close() { if (worker) await worker.close(); await queue.close(); }
  };
}

function createQueue(cfg) { return cfg.redisUrl ? createBullQueue(cfg) : createMemoryQueue(cfg); }
module.exports = { createQueue, createMemoryQueue };
