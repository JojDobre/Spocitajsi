// Generuje SEO značky, štruktúrované dáta, hlavičku, omrvinky, súvisiace odkazy, pätičku,
// sitemap.xml, robots.txt, manifest, 404 stránku a hlavičky pre hosting.
// Spustenie: node tools/build.js   (bezpečné spúšťať opakovane)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Iná konfigurácia sa dá zadať cez premennú SITE_CONFIG (používajú testy)
const cfg = require(process.env.SITE_CONFIG ? path.resolve(process.env.SITE_CONFIG) : './site.config.js');

const root = path.join(__dirname, '..');
const D = cfg.domena.replace(/\/$/, '');
const ORG_ID = D + '/#organizacia';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = slug => D + '/' + (slug ? slug + '/' : '');
const cesta = slug => '/' + (slug ? slug + '/' : '');
const subor = slug => path.join(root, slug ? path.join(slug, 'index.html') : 'index.html');
const stranka = slug => cfg.stranky.find(s => s.slug === slug);
const datumSk = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d}. ${m}. ${y}`; };
const hash = f => crypto.createHash('md5').update(fs.readFileSync(path.join(root, f))).digest('hex').slice(0, 8);
const verzia = { 'assets/style.css': hash('assets/style.css'), 'assets/calc.js': hash('assets/calc.js'), 'assets/site.js': hash('assets/site.js') };
const Z = cfg.zarabanie || {};
const ADS = (Z.adsense && Z.adsense.client) ? Z.adsense : null;
const kalkulacky = () => cfg.stranky.filter(s => s.typ === 'app');
const ogObrazok = s => `${D}/assets/og/${s.slug || 'domov'}.jpg`;

function nahradBlok(html, meno, obsah) {
  const re = new RegExp(`<!-- ${meno}:START -->[\\s\\S]*?<!-- ${meno}:END -->`);
  if (!re.test(html)) throw new Error(`Chýba značka ${meno} v súbore`);
  return html.replace(re, `<!-- ${meno}:START -->\n${obsah}\n<!-- ${meno}:END -->`);
}

function jsonLd(s) {
  const org = {
    '@type': 'Organization', '@id': ORG_ID, name: cfg.nazov, url: url(''),
    logo: { '@type': 'ImageObject', url: D + '/assets/icons/icon-512.png', width: 512, height: 512 }
  };
  const omrvinky = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Domov', item: url('') },
      { '@type': 'ListItem', position: 2, name: s.nazov, item: url(s.slug) }
    ]
  };
  const graf = [];
  if (s.typ === 'home') {
    graf.push(org, {
      '@type': 'WebSite', '@id': D + '/#web', name: cfg.nazov, url: url(''), inLanguage: 'sk-SK',
      description: cfg.popis, publisher: { '@id': ORG_ID }
    });
  } else if (s.typ === 'app') {
    graf.push({
      '@type': 'WebApplication', name: s.obrazok || s.nazov, url: url(s.slug), description: s.description,
      applicationCategory: 'FinanceApplication', operatingSystem: 'Všetky (webový prehliadač)', inLanguage: 'sk-SK',
      isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      dateModified: cfg.aktualizovane, image: ogObrazok(s), publisher: { '@id': ORG_ID }
    }, omrvinky, org);
  } else if (s.typ === 'article') {
    graf.push({
      '@type': 'Article', headline: s.title, description: s.description, inLanguage: 'sk-SK',
      datePublished: s.publikovane || cfg.aktualizovane, dateModified: cfg.aktualizovane,
      image: ogObrazok(s), mainEntityOfPage: url(s.slug),
      author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }
    }, omrvinky, org);
  } else {
    graf.push({ '@type': 'WebPage', name: s.title, url: url(s.slug), inLanguage: 'sk-SK', dateModified: cfg.aktualizovane }, omrvinky);
  }
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graf })}</script>`;
}

function seo(s) {
  const titul = `${s.title} | ${cfg.nazov}`;
  const r = [
    `<title>${esc(titul)}</title>`,
    `<meta name="description" content="${esc(s.description)}">`,
    `<meta name="robots" content="${s.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">`,
    `<link rel="canonical" href="${url(s.slug)}">`,
    `<link rel="alternate" hreflang="sk" href="${url(s.slug)}">`,
    `<meta name="theme-color" content="${cfg.farba}">`,
    `<meta property="og:locale" content="sk_SK">`,
    `<meta property="og:site_name" content="${esc(cfg.nazov)}">`,
    `<meta property="og:type" content="${s.typ === 'article' ? 'article' : 'website'}">`,
    `<meta property="og:title" content="${esc(s.title)}">`,
    `<meta property="og:description" content="${esc(s.description)}">`,
    `<meta property="og:url" content="${url(s.slug)}">`,
    `<meta property="og:image" content="${ogObrazok(s)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(s.obrazok || s.title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="/assets/icons/icon-48.png" type="image/png" sizes="48x48">`,
    `<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
    `<link rel="stylesheet" href="/assets/style.css?v=${verzia['assets/style.css']}">`,
    // režim vloženia na iný web: nastaví sa pred vykreslením, aby neblikla hlavička
    `<script>if(/[?&]embed=1(&|$)/.test(location.search)){document.documentElement.classList.add('embed');window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.pauseAdRequests=1;}</script>`,
    `<script>window.SPOCITAJ=${JSON.stringify(klientskaKonfig(s))};</script>`,
    `<script src="/assets/site.js?v=${verzia['assets/site.js']}" defer></script>`
  ];
  if (s.typ === 'article') {
    r.push(`<meta property="article:published_time" content="${s.publikovane || cfg.aktualizovane}">`);
    r.push(`<meta property="article:modified_time" content="${cfg.aktualizovane}">`);
  }
  if (cfg.googleVerifikacia) r.push(`<meta name="google-site-verification" content="${esc(cfg.googleVerifikacia)}">`);
  if (cfg.bingVerifikacia) r.push(`<meta name="msvalidate.01" content="${esc(cfg.bingVerifikacia)}">`);
  if (ADS && !s.noindex) {
    r.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ADS.client)}" crossorigin="anonymous"></script>`);
  }
  r.push(jsonLd(s));
  return r.join('\n');
}

function klientskaKonfig(s) {
  const a = Z.analytika || {};
  return {
    nazov: cfg.nazov, slug: s.slug, url: url(s.slug),
    adsense: !!ADS,
    analytika: a.typ ? { typ: a.typ, id: a.id, skript: a.skript || '' } : {}
  };
}

function header(aktivna) {
  const odkazy = cfg.stranky.filter(s => s.menu).map(s =>
    `    <a href="${cesta(s.slug)}"${s.slug === aktivna ? ' aria-current="page"' : ''}>${esc(s.menuNazov || s.nazov)}</a>`).join('\n');
  return `<header class="site"><div class="wrap">
  <a class="logo" href="/" aria-label="${esc(cfg.nazov)} – domov">Spočítaj<span>Si</span></a>
  <nav class="main" aria-label="Hlavná navigácia">
${odkazy}
    <a href="/#vsetky">Všetky kalkulačky</a>
  </nav>
</div></header>`;
}

function footer() {
  const kalk = cfg.stranky.filter(s => s.slug && s.typ !== 'page').map(s => `    <a href="${cesta(s.slug)}">${esc(s.nazov)}</a>`).join('\n');
  return `<footer class="site"><div class="wrap">
  <nav class="links" aria-label="Všetky kalkulačky">
${kalk}
  </nav>
  <div class="links">
    <a href="/vlozit/">Vložiť kalkulačku na web</a>
    <a href="/reklama/">Reklama a spolupráca</a>
    <a href="/o-nas/">O nás a metodika</a>
    <a href="/ochrana-sukromia/">Ochrana súkromia</a>${Z.podpora && Z.podpora.url ? `
    <a href="${esc(Z.podpora.url)}" rel="noopener" target="_blank" data-podpora>${esc(Z.podpora.text)}</a>` : ''}
  </div>
  <p>© 2026 ${esc(cfg.nazov)}. Výpočty sú orientačné a nenahrádzajú odborné daňové ani právne poradenstvo.</p>
</div></footer>`;
}

function omrvinky(s) {
  if (!s.slug) return '';
  return `<nav class="crumbs" aria-label="Omrvinky"><a href="/">Domov</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(s.nazov)}</span></nav>`;
}

function suvisiace(s) {
  if (s.noindex) return '';
  const casti = [];
  if (s.slug) {
    casti.push(`<p class="updated">Naposledy skontrolované a aktualizované: <time datetime="${cfg.aktualizovane}">${datumSk(cfg.aktualizovane)}</time></p>`);
  }
  if (s.typ !== 'page') casti.push(newsletter());
  if (s.suvisiace && s.suvisiace.length) {
    const karty = s.suvisiace.map(stranka).filter(Boolean).map(x =>
      `    <a class="card" href="${cesta(x.slug)}"><h3>${esc(x.nazov)}</h3><p>${esc(x.podtitul || x.description)}</p></a>`).join('\n');
    casti.push(`<section class="related" aria-labelledby="suvisiace"><h2 id="suvisiace">Súvisiace kalkulačky</h2>\n  <div class="cards">\n${karty}\n  </div>\n</section>`);
  }
  if (s.zdroje && s.zdroje.length && s.typ !== 'page') {
    const z = s.zdroje.map(k => cfg.zdroje[k]).map(x => `<li><a href="${x.url}" rel="noopener" target="_blank">${esc(x.nazov)}</a></li>`).join('');
    casti.push(`<section class="sources"><h2>Zdroje</h2><p>Výpočet vychádza z platných zákonov a údajov týchto inštitúcií. Podrobnosti nájdete v <a href="/o-nas/">metodike</a>.</p><ul>${z}</ul></section>`);
  }
  return casti.join('\n');
}

// ---------- Zarábanie a zdieľanie ----------
function zdielanie(s) {
  const u = encodeURIComponent(url(s.slug));
  const t = encodeURIComponent(s.title);
  const vysledok = s.typ === 'app'
    ? `<button type="button" class="share-main" data-share="vysledok">🔗 Zdieľať výsledok</button>\n  ` : '';
  const vlozit = s.typ === 'app' ? `\n  <a href="/vlozit/?k=${s.slug}" data-share="vlozit">&lt;/&gt; Vložiť na web</a>` : '';
  return `<div class="share" role="group" aria-label="Zdieľať">
  <span class="share-label">Zdieľať:</span>
  ${vysledok}<a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" data-share="facebook">Facebook</a>
  <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" data-share="whatsapp">WhatsApp</a>
  <a href="https://x.com/intent/post?url=${u}&amp;text=${t}" target="_blank" rel="noopener" data-share="x">X</a>
  <a href="mailto:?subject=${t}&amp;body=${u}" data-share="email">E-mail</a>${vlozit}
</div>`;
}

function partnerBox(s) {
  const p = (Z.partneri || []).find(x => x.url && (x.stranky || []).includes(s.slug));
  if (p) {
    return `<aside class="partner" aria-label="Reklama">
  <span class="ad-label">Reklama · partner</span>
  <strong>${esc(p.nadpis)}</strong>
  <p>${esc(p.text || '')}</p>
  <a class="btn" href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-partner="${esc(p.id || '')}">${esc(p.tlacidlo || 'Zistiť viac')}</a>
</aside>`;
  }
  return s.tip ? `<aside class="partner tip"><p>${s.tip}</p></aside>` : '';
}

function money(s) {
  return `<div class="money">\n${zdielanie(s)}\n${partnerBox(s)}\n</div>`;
}

function reklamnaJednotka(miesto) {
  const slot = ADS && (miesto === 'obsah' ? ADS.slotVObsahu : ADS.slotPodKalkulackou);
  if (!slot) return `<div class="ad-slot" data-slot="${miesto}"></div>`;
  return `<div class="ad-slot ad-on" data-slot="${miesto}"><span class="ad-label">Reklama</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ADS.client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}

function newsletter() {
  const n = Z.newsletter || {};
  if (!n.akcia) return '';
  const skryte = Object.entries(n.skrytePolia || {}).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
  return `<section class="newsletter" aria-labelledby="nl-nadpis">
  <h2 id="nl-nadpis">Upozorníme vás na zmeny v roku 2027</h2>
  <p>Keď sa zmení minimálna mzda, odvody, dane alebo dávky, pošleme vám krátky e-mail. Žiadny spam, odhlásite sa jedným klikom.</p>
  <form action="${esc(n.akcia)}" method="post" target="_blank" data-newsletter>${skryte}
    <div class="nl-row">
      <label for="nl-email" class="sr-only">Váš e-mail</label>
      <input type="email" id="nl-email" name="${esc(n.pole || 'email')}" required placeholder="vas@email.sk" autocomplete="email">
      <button type="submit">Chcem upozornenia</button>
    </div>
    <label class="check"><input type="checkbox" required> <span>Súhlasím so zasielaním noviniek a so spracovaním e-mailu podľa <a href="/ochrana-sukromia/">zásad ochrany súkromia</a>.</span></label>
  </form>
</section>`;
}

function embedZoznam() {
  return `<script>window.SPOCITAJ_KALKULACKY=${JSON.stringify(kalkulacky().map(s => ({ slug: s.slug, nazov: s.obrazok || s.nazov, title: s.title })))};</script>`;
}

function domovskeKarty() {
  const karty = cfg.stranky.filter(s => s.slug && s.typ !== 'page').map(s =>
    `    <a class="card" href="${cesta(s.slug)}">${s.badge ? `\n      <span class="badge">${esc(s.badge)}</span>` : ''}
      <h2>${esc(s.obrazok || s.nazov)}</h2>
      <p>${esc(s.description)}</p>
    </a>`).join('\n');
  return `  <div class="cards" id="vsetky">\n${karty}\n  </div>`;
}

let pocet = 0;
for (const s of cfg.stranky) {
  const f = subor(s.slug);
  if (!fs.existsSync(f)) { console.warn('⚠️  chýba súbor pre stránku:', s.slug); continue; }
  let h = fs.readFileSync(f, 'utf8');
  h = nahradBlok(h, 'SEO', seo(s));
  h = nahradBlok(h, 'BREADCRUMB', omrvinky(s));
  h = nahradBlok(h, 'RELATED', suvisiace(s));
  if (!s.slug) h = nahradBlok(h, 'HOMECARDS', domovskeKarty());
  if (h.includes('<!-- MONEY:START -->')) h = nahradBlok(h, 'MONEY', s.slug ? money(s) : '');
  if (h.includes('<!-- EMBEDLIST:START -->')) h = nahradBlok(h, 'EMBEDLIST', embedZoznam());
  h = h.replace(/<!-- KONTAKT -->[\s\S]*?<!-- \/KONTAKT -->/g, `<!-- KONTAKT -->${esc(Z.kontaktReklama || '')}<!-- /KONTAKT -->`);
  h = h.replace(/<div class="ad-slot[^"]*" data-slot="(\w+)">[\s\S]*?<\/div>/g, (m, miesto) => reklamnaJednotka(miesto));
  h = h.replace(/<header class="site">[\s\S]*?<\/header>/, header(s.slug));
  h = h.replace(/<footer class="site">[\s\S]*?<\/footer>/, footer());
  h = h.replace(/\/assets\/calc\.js(\?v=\w+)?/g, `/assets/calc.js?v=${verzia['assets/calc.js']}`);
  fs.writeFileSync(f, h);
  pocet++;
}

// 404
const s404 = { slug: '404', nazov: 'Stránka nenájdená', title: 'Stránka nenájdená', description: 'Hľadaná stránka neexistuje.', typ: 'page', noindex: true };
const odkazy404 = cfg.stranky.filter(s => s.slug && s.typ !== 'page').map(s => `<a class="card" href="${cesta(s.slug)}"><h3>${esc(s.nazov)}</h3></a>`).join('\n');
let h404 = `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${seo(s404).replace(/<link rel="canonical"[^>]*>\n|<link rel="alternate"[^>]*>\n|<script type="application\/ld\+json">.*<\/script>/g, '')}
</head>
<body>
${header('404')}
<main><div class="wrap">
  <h1>Stránka sa nenašla</h1>
  <p class="lead">Adresa je nesprávna alebo stránka už neexistuje. Skúste niektorú z kalkulačiek:</p>
  <div class="cards">
${odkazy404}
  </div>
</div></main>
${footer()}
</body>
</html>
`;
fs.writeFileSync(path.join(root, '404.html'), h404);

// sitemap.xml
const indexovane = cfg.stranky.filter(s => !s.noindex);
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexovane.map(s => `  <url><loc>${url(s.slug)}</loc><lastmod>${cfg.aktualizovane}</lastmod></url>`).join('\n')}
</urlset>
`);

// robots.txt
fs.writeFileSync(path.join(root, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /tests/
Disallow: /tools/

Sitemap: ${D}/sitemap.xml
`);

// Web manifest
fs.writeFileSync(path.join(root, 'site.webmanifest'), JSON.stringify({
  name: `${cfg.nazov} – kalkulačky`, short_name: cfg.nazov, lang: 'sk', start_url: '/', display: 'standalone',
  background_color: '#ffffff', theme_color: cfg.farba,
  icons: [
    { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2) + '\n');

// Hlavičky (Cloudflare Pages aj Netlify čítajú súbor _headers)
fs.writeFileSync(path.join(root, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/tests/*
  X-Robots-Tag: noindex

/tools/*
  X-Robots-Tag: noindex

/embed.js
  Cache-Control: public, max-age=3600
  Access-Control-Allow-Origin: *
`);

// ads.txt (AdSense ho vyžaduje, inak môže obmedziť príjmy)
const adsTxt = path.join(root, 'ads.txt');
if (ADS) fs.writeFileSync(adsTxt, `google.com, ${ADS.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
else if (fs.existsSync(adsTxt)) fs.unlinkSync(adsTxt);

// Presmerovania starých adries *.html na nové (Cloudflare Pages aj Netlify čítajú _redirects)
fs.writeFileSync(path.join(root, '_redirects'),
  cfg.stranky.filter(s => s.slug).map(s => `/${s.slug}.html /${s.slug}/ 301`).join('\n') + '\n');

console.log(`✓ ${pocet} stránok, 404, sitemap (${indexovane.length} adries), robots.txt, manifest, _headers, _redirects${ADS ? ', ads.txt' : ''}`);
