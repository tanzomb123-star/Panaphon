-- Works on SQLite (local) and Postgres (Supabase). Keep to the common subset.
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS projects_user ON projects (user_id, created_at);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects (id),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
  progress REAL NOT NULL DEFAULT 0,
  aspect TEXT NOT NULL,
  style TEXT,
  voice INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL,
  errors TEXT,
  video_key TEXT,
  seconds REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_user ON jobs (user_id, created_at);

-- balance = SUM(delta). One 'render' charge and at most one 'refund' per job.
CREATE TABLE IF NOT EXISTS credit_ledger (
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  job_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_user ON credit_ledger (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ledger_job_reason ON credit_ledger (job_id, reason) WHERE job_id IS NOT NULL;
