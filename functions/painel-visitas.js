const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};

async function matches(actual, expected) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([actual, expected].map(async value =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
  ));
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function onRequestGet({ env, request }) {
  if (new URL(request.url).hostname !== 'velmo-black-drink-b7m.pages.dev') {
    return new Response('Página não encontrada.', { status: 404 });
  }

  if (!env.VISITS_DASHBOARD_PASSWORD) {
    return new Response('Painel privado indisponível.', { status: 503, headers });
  }

  const expected = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode('velmo:' + env.VISITS_DASHBOARD_PASSWORD)));
  const actual = request.headers.get('Authorization') ?? '';
  if (actual.length > 512 || !await matches(actual, expected)) {
    return new Response('Entre com o usuário velmo e sua senha.', {
      status: 401,
      headers: { ...headers, 'WWW-Authenticate': 'Basic realm="Painel Velmo", charset="UTF-8"' },
    });
  }

  let totals;
  let history;
  try {
    const { results } = await env.VISITS_DB.prepare(
      "SELECT site, total FROM visit_totals WHERE site IN ('meta', 'tiktok', 'black-friday')"
    ).all();
    const { results: daily } = await env.VISITS_DB.prepare(
      "SELECT day, SUM(CASE WHEN site='meta' THEN total ELSE 0 END) AS meta, SUM(CASE WHEN site='tiktok' THEN total ELSE 0 END) AS tiktok, SUM(CASE WHEN site='black-friday' THEN total ELSE 0 END) AS black_friday, SUM(total) AS combined FROM visit_daily WHERE site IN ('meta','tiktok','black-friday') GROUP BY day ORDER BY day DESC LIMIT 30"
    ).all();
    history = daily;
    totals = new Map(results.map(({ site, total }) => [site, Number(total)]));
  } catch {
    return new Response('Não foi possível consultar as visitas agora. Atualize a página para tentar novamente.', { status: 503, headers });
  }

  const meta = totals.get('meta') ?? 0;
  const tiktok = totals.get('tiktok') ?? 0;
  const blackFriday = totals.get('black-friday') ?? 0;
  const format = new Intl.NumberFormat('pt-BR');
  const dailyRows = history.map(row => {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(row.day) ? row.day.split('-').reverse().join('/') : '';
    return '<tr><th scope="row">' + day + '</th>' +
      [row.meta, row.tiktok, row.black_friday, row.combined].map(total => '<td>' + format.format(total) + '</td>').join('') + '</tr>';
  }).join('');
  const updated = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  return new Response(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="5">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Painel de visitas | Velmo Black Drink</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#0e201d;color:#f3fbf7}
*{box-sizing:border-box}
main{max-width:880px;margin:auto;padding:clamp(40px,8vw,92px) 24px}
h1{font-size:clamp(2.3rem,6vw,4.1rem);line-height:1.05;margin:12px 0}
p{color:#b9d2c9;line-height:1.6}.brand{color:#8de2cc;font-weight:700}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:26px 0}
article{border:1px solid #376254;border-radius:16px;background:#172f29;padding:24px}
.total{grid-column:1/-1;background:#204337}
h2{font-size:1rem;margin:0 0 8px}
strong{font-size:clamp(2rem,6vw,3.5rem);font-variant-numeric:tabular-nums}
a{display:inline-block;color:#10251f;background:#8de2cc;padding:11px 16px;border-radius:8px;font-weight:700;text-decoration:none}
a:focus-visible{outline:2px solid white;outline-offset:4px}
@media(max-width:600px){.cards{grid-template-columns:1fr}}
.daily { margin-top: 36px; }
.daily-scroll { overflow-x: auto; }
.daily table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.daily th,.daily td { padding: 12px; border-bottom: 1px solid #376254; white-space: nowrap; text-align: right; }
.daily th:first-child { text-align: left; }
.daily h2 { font-size: 1.4rem; }
</style>
</head>
<body>
<main>
  <div class="brand">Velmo Black Drink</div>
  <h1>Painel de visitas</h1>
  <p>Totais acumulados desde a instalação do contador. Atualização automática a cada 5 segundos.</p>
  <section class="cards" aria-label="Visitas por versão">
    <article class="total"><h2>Total combinado</h2><strong>${format.format(meta + tiktok + blackFriday)}</strong></article>
    <article><h2>Meta</h2><strong>${format.format(meta)}</strong></article>
    <article><h2>TikTok</h2><strong>${format.format(tiktok)}</strong></article>
    <article><h2>Black Friday</h2><strong>${format.format(blackFriday)}</strong></article>
  </section>
  <p>O mesmo IP é contado uma vez a cada 24 horas em cada versão. Se o mesmo IP acessar mais de uma versão, cada versão registra sua própria visita.</p>
  <p>Consultado em ${updated} (horário de Brasília).</p>
  <a href="/painel-visitas">Atualizar números</a>
  <section class="daily" aria-labelledby="daily-heading">
    <h2 id="daily-heading">Histórico diário</h2>
    <p>Últimos 30 dias com visitas registradas desde a ativação do histórico. Datas no horário de Brasília.</p>
    ${dailyRows ? `<div class="daily-scroll" tabindex="0" role="region" aria-label="Tabela de visitas por dia"><table>
      <thead><tr><th scope="col">Data</th><th scope="col">Meta</th><th scope="col">TikTok</th><th scope="col">Black Friday</th><th scope="col">Total</th></tr></thead>
      <tbody>${dailyRows}</tbody></table></div>` : '<p>Aguardando as primeiras visitas do histórico.</p>'}
  </section>
</main>
</body>
</html>`, { headers });
}
