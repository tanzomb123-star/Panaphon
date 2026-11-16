/* Auth adapter.
   prod: Authorization: Bearer <Supabase access token> (HS256 signed with the project's JWT secret; `sub` = user id, `exp` checked)
   dev : x-user-id header (only when no JWT secret is configured) */
const crypto = require('crypto');
const b64 = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function verifyHS256(token, secret, nowSec = Math.floor(Date.now() / 1000)) {
  const parts = (token || '').split('.'); if (parts.length !== 3) return null;
  let header, payload; try { header = JSON.parse(b64(parts[0])); payload = JSON.parse(b64(parts[1])); } catch { return null; }
  if (header.alg !== 'HS256') return null;
  const want = crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest();
  const got = b64(parts[2]);
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  if (typeof payload.exp === 'number' && payload.exp < nowSec) return null;
  return payload;
}
function signHS256(payload, secret) { // used by tests and local tooling
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = enc({ alg: 'HS256', typ: 'JWT' }) + '.' + enc(payload);
  return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
}

function createAuth({ jwtSecret } = {}) {
  const devMode = !jwtSecret;
  return {
    devMode,
    userFromRequest(req) {
      if (devMode) { const u = req.headers['x-user-id']; return typeof u === 'string' && /^[\w-]{1,64}$/.test(u) ? u : null; }
      const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); if (!m) return null;
      const p = verifyHS256(m[1], jwtSecret); return p && typeof p.sub === 'string' ? p.sub : null;
    }
  };
}
module.exports = { createAuth, verifyHS256, signHS256 };
