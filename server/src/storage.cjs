/* Local file storage with HMAC-signed, expiring URLs. An S3/R2 adapter will expose the same { put, signedUrl } shape. */
const crypto = require('crypto'); const fs = require('fs'); const path = require('path');

function createLocalStorage({ dir, secret, publicUrl }) {
  fs.mkdirSync(dir, { recursive: true });
  const sign = (key, exp) => crypto.createHmac('sha256', secret).update(`${key}.${exp}`).digest('base64url');
  const safe = (key) => { if (!/^[\w./-]+$/.test(key) || key.includes('..')) throw new Error('bad key'); return path.join(dir, key); };
  return {
    kind: 'local',
    async put(key, srcPath) { const dst = safe(key); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(srcPath, dst); return key; },
    signedUrl(key, ttlSec = 3600, nowSec = Math.floor(Date.now() / 1000)) { const exp = nowSec + ttlSec; return `${publicUrl}/files/${key}?exp=${exp}&sig=${sign(key, exp)}`; },
    /** Returns the absolute path when the signature is valid and unexpired, else null. */
    verify(key, exp, sig, nowSec = Math.floor(Date.now() / 1000)) {
      if (!/^\d+$/.test(String(exp)) || +exp < nowSec || typeof sig !== 'string') return null;
      const want = Buffer.from(sign(key, exp)), got = Buffer.from(sig);
      if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
      try { const p = safe(key); return fs.existsSync(p) ? p : null; } catch { return null; }
    }
  };
}
module.exports = { createLocalStorage };
