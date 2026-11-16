/* Executes one render job: (voice) -> render -> store -> mark done -> webhook. Any failure refunds the job once. */
const fs = require('fs'); const os = require('os'); const path = require('path'); const crypto = require('crypto');
const { spawn } = require('child_process');

const ENGINE = path.resolve(__dirname, '../../video-engine/engine');

/** Default voice step: runs engine/voice.cjs in the job dir; returns { timeline, audio }. */
function defaultVoiceFn(storyFile, dir, voiceId) {
  return new Promise((resolve, reject) => {
    const args = [path.join(ENGINE, 'voice.cjs'), '--story', storyFile]; if (voiceId) args.push('--voice', voiceId);
    const p = spawn(process.execPath, args, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'] }); let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 || code === 3 /* unverified/mismatch is reported by render QA */ ? resolve({ timeline: path.join(dir, 'build/timeline.json'), audio: path.join(dir, 'build/narration.mp3') }) : reject(new Error('voice failed: ' + err.slice(0, 300)))));
  });
}

async function postWebhook(cfg, body) {
  if (!cfg.webhookUrl) return;
  const payload = JSON.stringify(body), sig = crypto.createHmac('sha256', cfg.webhookSecret || '').update(payload).digest('hex');
  try { await fetch(cfg.webhookUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'x-signature': sig }, body: payload }); } catch { /* best effort */ }
}

function createWorker({ db, storage, config, renderFn, voiceFn = defaultVoiceFn, log = () => {} }) {
  return async function processJob(jobId) {
    const job = db.getJob(jobId); if (!job || job.status !== 'queued') return;
    const project = db.getProject(job.project_id, job.user_id);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'job-'));
    db.updateJob(jobId, { status: 'running', progress: 0 });
    try {
      const storyFile = path.join(dir, 'story.json'); fs.writeFileSync(storyFile, JSON.stringify(project.story));
      let voice = {};
      if (job.voice) { voice = await voiceFn(storyFile, dir, config.voiceId); db.updateJob(jobId, { progress: 0.05 }); }
      const out = path.join(dir, 'out.mp4');
      const r = await renderFn({
        story: project.story, aspect: job.aspect, style: job.style || undefined, scene: job.scene || undefined, short: config.renderShort, fps: config.renderFps,
        workers: config.renderWorkers, out, timeline: voice.timeline, audio: voice.audio, failOnQA: true,
        onProgress: (v) => db.updateJob(jobId, { progress: Math.min(0.99, (job.voice ? 0.05 : 0) + v * (job.voice ? 0.95 : 1)) })
      });
      if (r.code !== 0) throw Object.assign(new Error('render failed'), { errors: r.errors || ['render failed'] });
      const key = `videos/${job.user_id}/${jobId}.mp4`; await storage.put(key, out);
      db.updateJob(jobId, { status: 'done', progress: 1, video_key: key, seconds: r.seconds });
      await postWebhook(config, { jobId, status: 'done', videoUrl: storage.signedUrl(key, config.urlTtl) });
    } catch (e) {
      log(`job ${jobId} failed: ${e.message}`);
      db.updateJob(jobId, { status: 'failed', errors: e.errors || [e.message] });
      db.addCredits(job.user_id, job.cost, 'refund', jobId);
      await postWebhook(config, { jobId, status: 'failed', errors: e.errors || [e.message] });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  };
}
module.exports = { createWorker, defaultVoiceFn };
