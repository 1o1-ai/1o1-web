// Runs the gate Worker locally on http://127.0.0.1:8793 (used by assets/site-gate.js on localhost).
//   node ops/yogabrata-gate/dev-server.mjs <auth.json>
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const env = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const worker = (await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), 'worker.js')).href)).default;
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks);
  const r = await worker.fetch(new Request(`http://127.0.0.1:8793${req.url}`, { method: req.method, headers: req.headers, body }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8793, '127.0.0.1', () => console.log('yogabrata-gate dev on http://127.0.0.1:8793'));
