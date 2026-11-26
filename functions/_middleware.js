const sites = new Map([
  ['velmo-black-drink-b7m.pages.dev', 'meta'],
  ['tiktok-pixel.velmo-black-drink-b7m.pages.dev', 'tiktok'],
]);
const windowSeconds = 24 * 60 * 60;

async function countVisit(db, secret, site, ip) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(site + ':' + ip));
  const digest = Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);

  await db.batch([
    db.prepare('DELETE FROM visit_keys WHERE expires <= ?').bind(now),
    db.prepare('INSERT INTO visit_keys (site, digest, expires) VALUES (?, ?, ?) ON CONFLICT(site, digest) DO NOTHING')
      .bind(site, digest, now + windowSeconds),
  ]);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const site = sites.get(url.hostname);
  const ip = request.headers.get('CF-Connecting-IP');
  const isLanding = url.pathname === '/' || url.pathname === '/index.html';
  const isDocument = request.headers.get('Sec-Fetch-Dest') === 'document';

  const response = await context.next();
  if (site && ip && env.VISITS_DB && env.VISITOR_HMAC_SECRET &&
      request.method === 'GET' && isLanding && isDocument && response.ok &&
      !request.headers.get('Sec-Purpose')?.includes('prefetch')) {
    context.waitUntil(countVisit(env.VISITS_DB, env.VISITOR_HMAC_SECRET, site, ip)
      .catch(() => console.error('Velmo visit counter write failed')));
  }

  return response;
}
