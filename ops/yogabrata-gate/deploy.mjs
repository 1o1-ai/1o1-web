// Deploys the yogabrata-gate Worker and attaches yogabrata-auth.brahmexa.com.
//   CLOUDFLARE_API_TOKEN=... node ops/yogabrata-gate/deploy.mjs <auth.json>
// <auth.json>: {USERS, PEPPER, SESSION_KEY} from Brahmando-ai/Citizen apps/jandrishti/api/make-auth.mjs
// (hashes and random keys only). Keep it outside git: C:\whizyoga\keys\yogabrata-gate-auth.json.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ACCOUNT = '81a0beaefcb5a7586e382fb60d379ccd';
const ZONE_ID = 'c14b44b96deaf6ae964f52eee4cc3269'; // brahmexa.com
const HOSTNAME = 'yogabrata-auth.brahmexa.com';
const SCRIPT = 'yogabrata-gate';
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token || !process.argv[2]) { console.error('usage: CLOUDFLARE_API_TOKEN=... node deploy.mjs <auth.json>'); process.exit(1); }
const auth = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const api = async (method, path, body, headers = {}) => {
  const j = await (await fetch(`https://api.cloudflare.com/client/v4${path}`, { method, body, headers: { Authorization: `Bearer ${token}`, ...headers } })).json();
  if (!j.success) throw new Error(`${method} ${path}: ${JSON.stringify(j.errors)}`);
  return j.result;
};
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify({
  main_module: 'worker.js', compatibility_date: '2026-10-01',
  bindings: ['USERS', 'PEPPER', 'SESSION_KEY'].map(name => ({ type: 'secret_text', name, text: auth[name] }))
})], { type: 'application/json' }));
form.append('worker.js', new Blob([readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'worker.js'))], { type: 'application/javascript+module' }), 'worker.js');
await api('PUT', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`, form);
await api('PUT', `/accounts/${ACCOUNT}/workers/domains`, JSON.stringify({ environment: 'production', hostname: HOSTNAME, service: SCRIPT, zone_id: ZONE_ID }), { 'Content-Type': 'application/json' });
console.log(`deployed ${SCRIPT} at https://${HOSTNAME}`);
