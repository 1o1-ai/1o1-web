/* yogabrata-gate — Cloudflare Worker behind the sign-in on yogabrata.com items.
 * POST /login {user, password} → {token, user, expires}
 * GET  /check (Authorization: Bearer <token>) → {ok, user} or 401
 *
 * Secrets (never in git): USERS — JSON {uid: {salt, hash}},
 *   hash = base64(HMAC-SHA256(PEPPER, salt + ":" + password)); PEPPER; SESSION_KEY.
 * Separate from JanDrishti's API: its own users, keys and sessions.
 */
const SESSION_DAYS = 7;
const ORIGINS = ['https://yogabrata.com', 'https://www.yogabrata.com', 'http://localhost:8801', 'http://127.0.0.1:8801'];

const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function cors(origin) {
  const h = { Vary: 'Origin' };
  if (ORIGINS.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

const json = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', ...cors(origin) }
});

async function verify(env, header) {
  const m = /^Bearer\s+([\w-]+)\.([\w-]+)$/.exec(header || '');
  if (!m) return null;
  if (!safeEqual(b64url(await hmac(env.SESSION_KEY, m[1])), m[2])) return null;
  try {
    const p = JSON.parse(unb64url(m[1]));
    return p.s === 'yogabrata' && p.exp > Date.now() ? p.u : null;
  } catch {
    return null;
  }
}

async function login(request, env, origin) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400, origin); }
  const uid = String(body.user || '').trim().toLowerCase();
  const users = JSON.parse(env.USERS);
  const rec = users[uid] || { salt: 'unknown-user', hash: '' };
  // Hash even for unknown users so response time does not reveal which uids exist.
  const got = await hmac(env.PEPPER, `${rec.salt}:${String(body.password || '')}`);
  if (!users[uid] || !safeEqual(got, rec.hash)) return json({ error: 'Invalid user ID or password' }, 401, origin);
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const payload = b64url(JSON.stringify({ u: uid, exp, s: 'yogabrata' }));
  return json({ token: `${payload}.${b64url(await hmac(env.SESSION_KEY, payload))}`, user: uid, expires: exp }, 200, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname === '/health') return json({ ok: true }, 200, origin);
    if (url.pathname === '/login' && request.method === 'POST') return login(request, env, origin);
    if (url.pathname === '/check' && request.method === 'GET') {
      const user = await verify(env, request.headers.get('Authorization'));
      return user ? json({ ok: true, user }, 200, origin) : json({ error: 'Sign in required' }, 401, origin);
    }
    return json({ error: 'Not found' }, 404, origin);
  }
};
