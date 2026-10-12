import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.name !== 'sw.js') result.push(path);
  }
  return result;
}
const assets = await files('dist');
const hash = createHash('sha256');
for (const file of assets) hash.update(await readFile(file));
const cache = `folha-shell-${hash.digest('hex').slice(0, 12)}`;
const urls = assets.map(f => '/' + f.slice(5));
await writeFile('dist/sw.js', `
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('folha-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(() => caches.open(CACHE).then(c => c.match('/index.html')))); return; }
  if (URLS.includes(u.pathname)) e.respondWith(caches.open(CACHE).then(async c => (await c.match(u.pathname)) || fetch(e.request)));
});
`);
console.log(`Shell offline: ${urls.length} arquivos; ${cache}`);
