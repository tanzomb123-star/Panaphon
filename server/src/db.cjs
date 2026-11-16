/* Local database on node:sqlite. Same shape will be implemented for Postgres/Supabase (see migrations/001_init.sql).
   Credits are a ledger: balance = SUM(delta). A job can be charged once and refunded once (unique index). */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const fs = require('fs'); const path = require('path');

function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8'));
  const now = () => new Date().toISOString();
  const row = (r) => (r ? { ...r } : null);
  const job = (r) => (r ? { ...r, voice: !!r.voice, errors: r.errors ? JSON.parse(r.errors) : [] } : null);
  const q = {
    insProject: db.prepare('INSERT INTO projects (id, user_id, title, story, created_at) VALUES (?, ?, ?, ?, ?)'),
    getProject: db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?'),
    listProjects: db.prepare('SELECT id, title, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),
    insJob: db.prepare(`INSERT INTO jobs (id, user_id, project_id, status, progress, aspect, style, voice, cost, created_at, updated_at)
                        VALUES (?, ?, ?, 'queued', 0, ?, ?, ?, ?, ?, ?)`),
    getJob: db.prepare('SELECT * FROM jobs WHERE id = ?'),
    listJobs: db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),
    activeJobs: db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE user_id = ? AND status IN ('queued','running')"),
    balance: db.prepare('SELECT COALESCE(SUM(delta), 0) AS b FROM credit_ledger WHERE user_id = ?'),
    ledger: db.prepare('INSERT OR IGNORE INTO credit_ledger (user_id, delta, reason, job_id, created_at) VALUES (?, ?, ?, ?, ?)')
  };
  return {
    raw: db,
    createProject(userId, story) { const id = crypto.randomUUID(); q.insProject.run(id, userId, story.title, JSON.stringify(story), now()); return id; },
    getProject(id, userId) { const r = row(q.getProject.get(id, userId)); if (r) r.story = JSON.parse(r.story); return r; },
    listProjects(userId, limit = 50) { return q.listProjects.all(userId, limit).map(row); },
    balance(userId) { return q.balance.get(userId).b; },
    addCredits(userId, delta, reason, jobId = null) { return q.ledger.run(userId, delta, reason, jobId, now()).changes === 1; },
    activeJobs(userId) { return q.activeJobs.get(userId).n; },
    /** Charge + create the job atomically. Returns null when the balance is too low. */
    createJob(userId, projectId, { aspect, style, voice, cost }) {
      db.exec('BEGIN IMMEDIATE');
      try {
        if (q.balance.get(userId).b < cost) { db.exec('ROLLBACK'); return null; }
        const id = crypto.randomUUID(), t = now();
        q.insJob.run(id, userId, projectId, aspect, style || null, voice ? 1 : 0, cost, t, t);
        q.ledger.run(userId, -cost, 'render', id, t);
        db.exec('COMMIT'); return id;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    getJob(id) { return job(q.getJob.get(id)); },
    listJobs(userId, limit = 50) { return q.listJobs.all(userId, limit).map(job); },
    updateJob(id, fields) {
      const f = { ...fields, updated_at: now() }; if (f.errors) f.errors = JSON.stringify(f.errors);
      const keys = Object.keys(f); db.prepare(`UPDATE jobs SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => f[k]), id);
    }
  };
}
module.exports = { openDb };
