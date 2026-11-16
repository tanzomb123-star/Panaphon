/* All settings come from env vars (see .env.example). */
const os = require('os'); const path = require('path'); const crypto = require('crypto');
function loadConfig(env = process.env) {
  const port = +(env.PORT || 8080);
  return {
    port,
    dataDir: path.resolve(env.DATA_DIR || path.join(__dirname, '..', 'data')),
    publicUrl: (env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
    fileSecret: env.FILE_SECRET || crypto.randomBytes(32).toString('hex'), // set it in prod or URLs die on restart
    jwtSecret: env.SUPABASE_JWT_SECRET || '',
    redisUrl: env.REDIS_URL || '',
    webhookUrl: env.WEBHOOK_URL || '', webhookSecret: env.WEBHOOK_SECRET || '',
    voiceId: env.ELEVENLABS_VOICE_ID || '',
    concurrency: +(env.RENDER_CONCURRENCY || 1),
    renderShort: +(env.RENDER_SHORT || 720), renderFps: +(env.RENDER_FPS || 24), renderWorkers: +(env.RENDER_WORKERS || Math.min(4, os.cpus().length)),
    maxActiveJobs: +(env.MAX_ACTIVE_JOBS || 3),
    urlTtl: +(env.URL_TTL || 3600),
    logger: env.LOG !== '0'
  };
}
module.exports = { loadConfig };
