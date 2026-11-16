# Phase 1: Backend API + Render Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An HTTP API that accepts stories, charges credits, queues renders, reports progress and serves finished videos. It runs locally with zero external services and switches to Supabase/Redis/R2 by env vars.

**Architecture:** `server/` is a Fastify app built by `buildApp(deps)`. Every external system is a small adapter behind an interface: `db` (node:sqlite locally, Postgres/Supabase later), `queue` (in-process locally, BullMQ when `REDIS_URL` is set), `storage` (local dir + HMAC-signed URLs, S3/R2 later), `auth` (dev header locally, Supabase JWT when `SUPABASE_JWT_SECRET` is set). The worker calls `render()` from `video-engine/engine/render.cjs` with a progress callback.

**Tech Stack:** Node 22 (CJS), Fastify 4, node:sqlite, node:crypto (HMAC, HS256 JWT), node:test + `app.inject`.

**Spec:** `docs/APP_PLAN.md`, section "เฟส 1"

## Global Constraints
- No external service is required to run `npm test` or `npm start` locally.
- Credit cost: `ceil(seconds)` + `ceil(narrationChars / 50)` when voice is requested; charged when queued, refunded in full on failure.
- Signed file URLs expire (default 1 hour); a tampered or expired signature returns 403.
- Every story is validated with `validateStory` before it is saved; invalid -> 400 with the errors list.
- Job states: `queued` -> `running` -> `done` | `failed`; `progress` 0..1.

## Review Focus
1. Render requested with insufficient credits -> 402, no job created, balance unchanged. (Task 3)
2. Render fails mid-way -> job `failed`, credits refunded exactly once. (Task 3)
3. User B reads user A's project/job -> 404 (not 403, to avoid leaking existence). (Task 2)
4. Expired or tampered signed URL -> 403. (Task 4)
5. Two renders queued at once with concurrency 1 -> both finish, in order. (Task 3)

---

### Task 1: Engine progress hook
**Files:** Modify `video-engine/engine/render.cjs`; Test `video-engine/test/render.test.cjs`
- `render(o)` accepts `o.onProgress(fraction: number)`; called with monotonically increasing values, last call `1`.
- [x] Test: tiny story with 3 workers -> progress values ascending, last === 1.

### Task 2: App skeleton, db, auth, projects, catalog
**Files:** Create `server/package.json`, `server/src/app.cjs`, `server/src/db.cjs`, `server/src/auth.cjs`, `server/src/routes/projects.cjs`, `server/src/routes/catalog.cjs`, `server/test/projects.test.cjs`
**Interfaces:**
- `buildApp({ db, queue, storage, auth, config }) -> FastifyInstance`
- `openDb(file = ':memory:')` -> `{ createProject, getProject, listProjects, createJob, getJob, updateJob, balance, addCredits }`
- `auth.userFromRequest(req) -> userId | null` (dev: `x-user-id` header; prod: `Authorization: Bearer <Supabase JWT>`, HS256, `sub` claim, `exp` checked).
- Routes: `GET /v1/catalog`, `POST /v1/projects {story}`, `GET /v1/projects`, `GET /v1/projects/:id`.
- [x] Tests: no auth -> 401; invalid story -> 400 with errors; create+get roundtrip; other user's project -> 404; catalog lists 10 characters/10 styles.

### Task 3: Credits, render jobs, queue, worker
**Files:** Create `server/src/credits.cjs`, `server/src/queue.cjs`, `server/src/worker.cjs`, `server/src/routes/jobs.cjs`, `server/test/jobs.test.cjs`
**Interfaces:**
- `estimateCost(story, { voice }) -> number`
- `createMemoryQueue({ concurrency }) -> { add(job), onProcess(fn), idle() }`; BullMQ adapter with the same shape when `REDIS_URL` set.
- `processJob(job, { db, storage, renderFn, voiceFn })`.
- Routes: `POST /v1/projects/:id/render {aspect, style?, voice?}` -> `202 {jobId, cost}`; `GET /v1/jobs/:id`; `GET /v1/me/credits`; `POST /v1/dev/credits` (dev mode only).
- [x] Tests: 402 path; happy path -> done + videoUrl + balance reduced by cost; failing renderFn -> failed + refund; two jobs concurrency 1 complete.

### Task 4: Storage + signed URLs + webhook
**Files:** Create `server/src/storage.cjs`, `server/src/routes/files.cjs`, `server/test/storage.test.cjs`
- `createLocalStorage(dir, secret)` -> `{ put(key, srcPath), signedUrl(key, ttlSec), verify(key, exp, sig), path(key) }`.
- `GET /files/*?exp&sig` streams video; 403 on bad/expired sig.
- Job completion POSTs `{jobId, status, videoUrl}` to `WEBHOOK_URL` with `x-signature` HMAC when configured.
- [x] Tests: valid URL -> 200 video/mp4; tampered -> 403; expired -> 403.

### Task 5: Container + docs
**Files:** Create `server/Dockerfile` (Playwright base image + ffmpeg + fonts-thai-tlwg), `server/README.md`, `server/.env.example`.
- [x] `npm start` locally renders through the API end to end (manual curl script in README).
