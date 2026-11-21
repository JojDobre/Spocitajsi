// Test v reálnom prehliadači (Playwright) cez lokálny HTTP server. Spustenie: node tests/e2e.js
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const C = require('../assets/calc.js');
const cfg = require('../tools/site.config.js');

const dir = path.join(__dirname, '..');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const TYPY = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
// jednoduchý statický server so správaním ako Cloudflare Pages / Netlify (priečinok → index.html, inak 404.html)
const statickyServer = koren => http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let f = path.join(koren, u);
  if (!f.startsWith(koren)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': TYPY['.html'] }); return res.end(fs.readFileSync(path.join(koren, '404.html'))); }
  res.writeHead(200, { 'Content-Type': TYPY[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
const server = statickyServer(dir);
const url = slug => `${BASE}/${slug ? slug + '/' : ''}`;
const stranky = cfg.stranky.map(s => s.slug);
const D = cfg.domena;

let ok = 0, chyby = [];
async function t(name, fn) {
  try { await fn(); ok++; console.log('✓ ' + name); }
  catch (e) { chyby.push(name); console.log('✗ ' + name + '\n   ' + e.message); }
}
const text = (p, sel) => p.$eval(sel, e => e.textContent.trim());

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  for (const [sirka, nazov] of [[360, 'mobil 360px'], [1280, 'desktop']]) {
    const p = await b.newPage({ viewport: { width: sirka, height: 800 } });
    const js = [];
    p.on('pageerror', e => js.push(e.message));
    p.on('console', m => m.type() === 'error' && js.push(m.text()));

    for (const f of stranky) {
      await t(`${nazov}: /${f} – bez chýb, bez vodorovného posúvania, interné odkazy fungujú`, async () => {
        js.length = 0;
        const odp = await p.goto(url(f));
        assert.strictEqual(odp.status(), 200);
        const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(sw <= sirka, `scrollWidth ${sw} > ${sirka}`);
        assert.deepStrictEqual(js, []);
        const odkazy = await p.$$eval('a[href^="/"]', as => as.map(a => a.getAttribute('href').split(/[?#]/)[0]));
        for (const o of new Set(odkazy)) {
          const slug = o.replace(/^\/|\/$/g, '');
          assert.ok(stranky.includes(slug), 'neexistujúci odkaz ' + o);
        }
        const nan = await p.evaluate(() => /NaN|undefined|Infinity/.test(document.body.innerText));
        assert.ok(!nan, 'na stránke je NaN/undefined/Infinity');
      });
    }

    // Okrajové vstupy na všetkých kalkulačkách
    const zle = ['', 'abc', '-500', '0', '99999999', '1 234,56'];
    for (const f of stranky) {
      await t(`${nazov}: /${f} – okrajové vstupy nezobrazia NaN`, async () => {
        await p.goto(url(f));
        const inputy = await p.$$('input[type="text"]:visible, input[type="number"]:visible');
        for (const v of zle) {
          for (const i of inputy) {
            // do číselného poľa prehliadač text ani medzery nepustí
            if ((await i.getAttribute('type')) === 'number' && !/^-?\d*$/.test(v)) continue;
            await i.fill(v);
          }
          const nan = await p.evaluate(() => /NaN|undefined|Infinity/.test(document.body.innerText));
          assert.ok(!nan, `vstup "${v}" spôsobil NaN/undefined`);
        }
        assert.deepStrictEqual(js, []);
      });
    }
    await p.close();
  }

  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const E = C.eur;

  await t('Čistá mzda: zobrazený výsledok = výpočet (2 000 €, 1 dieťa do 15, 1 dieťa 15–18)', async () => {
    await p.goto(url('cista-mzda'));
    await p.fill('#suma', '2000'); await p.selectOption('#d15', '1'); await p.selectOption('#d18', '1');
    assert.strictEqual(await text(p, '#res-value'), E(C.cistaMzda(2000, { deti: { do15: 1, od15do18: 1 } }).cista));
  });

  await t('PN: 30 dní pri 1 800 € – súčet riadkov = celkom', async () => {
    await p.goto(url('pn'));
    await p.fill('#mzda', '1800'); await p.fill('#dni', '30');
    const r = C.pn(1800, 30);
    assert.strictEqual(await text(p, '#res-value'), E(r.spolu));
    assert.strictEqual(await text(p, '#r-n3'), E(r.nemocenske));
    near(r.nahrada1 + r.nahrada2 + r.nemocenske, r.spolu);
  });

  await t('PN: vysoká mzda ukáže upozornenie na strop', async () => {
    await p.goto(url('pn'));
    await p.fill('#mzda', '5000');
    assert.strictEqual(await p.$eval('#r-max', e => e.hidden), false);
    await p.fill('#mzda', '1500');
    assert.strictEqual(await p.$eval('#r-max', e => e.hidden), true);
  });

  await t('Materská: maximum 2 254,70 € a prepínač 43 týždňov (301 dní)', async () => {
    await p.goto(url('materska'));
    await p.fill('#mzda', '6000');
    assert.strictEqual(await text(p, '#res-value'), E(2254.70));
    assert.strictEqual(await text(p, '#r-31'), E(2329.90));
    await p.click('[data-t="43"]');
    assert.strictEqual(await text(p, '#r-dni'), '301');
    assert.strictEqual(await text(p, '#r-spolu'), E(C.materske(6000, 43).spolu));
  });

  await t('Hypotéka: splátka a splátkový kalendár (20 rokov = 20 riadkov, posledný zostatok 0)', async () => {
    await p.goto(url('hypoteka'));
    await p.fill('#istina', '200000'); await p.fill('#urok', '4,1'); await p.fill('#roky', '20');
    assert.strictEqual(await text(p, '#res-value'), E(C.hypoteka(200000, 4.1, 20).splatka));
    const riadky = await p.$$eval('#kalendar tr', r => r.map(x => x.lastElementChild.textContent));
    assert.strictEqual(riadky.length, 20);
    assert.strictEqual(riadky[19], E(0));
  });

  await t('Sporenie: vypnutie dane zvýši konečnú sumu a daň = 0', async () => {
    await p.goto(url('sporenie'));
    const sDanou = await text(p, '#res-value');
    await p.uncheck('#dan');
    assert.strictEqual(await text(p, '#r-dan'), '− ' + E(0));
    assert.notStrictEqual(await text(p, '#res-value'), sDanou);
    assert.strictEqual(await text(p, '#res-value'), E(C.sporenie(1000, 100, 2.5, 10, false).konecnaSuma));
  });

  await t('Cestovné: 13 h s obedom = 5,92 €, staré sadzby 9,30 €, auto 120 km', async () => {
    await p.goto(url('cestovne-nahrady'));
    await p.fill('#hodiny', '13'); await p.check('#j-o');
    assert.strictEqual(await text(p, '#r-stravne'), E(5.92));
    await p.uncheck('#j-o'); await p.fill('#hodiny', '8'); await p.click('#s-old');
    assert.strictEqual(await text(p, '#r-stravne'), E(9.30));
    await p.fill('#km', '120');
    const a = C.nahradaAuto(120, 6.5, 1.55);
    assert.strictEqual(await text(p, '#r-km'), E(a.zakladna));
    assert.strictEqual(await text(p, '#res-value'), E(9.30 + a.spolu));
  });

  await t('Príplatky: tabuľky a výpočet s dohodnutou sadzbou', async () => {
    await p.goto(url('priplatky'));
    const stupne = await p.$$eval('#t-stupne tr', r => r.map(x => x.children[2].textContent));
    assert.deepStrictEqual(stupne, [915, 1031, 1147, 1263, 1379, 1495].map(E));
    const stupne27 = await p.$$eval('#t-stupne tr', r => r.map(x => x.children[4].textContent));
    assert.deepStrictEqual(stupne27, [972, 1088, 1204, 1320, 1436, 1552].map(E));
    await p.click('[data-rok="2026"]');
    await p.check('#dohodnute');
    assert.strictEqual(await text(p, '#r-sobota'), E(18.93));   // 8 × 2,3666
    assert.strictEqual(await text(p, '#r-nedela'), E(37.86));   // 8 × 4,7331
    await p.uncheck('#dohodnute');
    await p.click('[data-rok="2027"]');
    assert.strictEqual(await text(p, '#r-nedela'), E(44.69));   // 8 × 5,586
  });

  await t('PN a materská: prepínač roka 2027 použije nový strop', async () => {
    await p.goto(url('pn'));
    await p.fill('#mzda', '9000'); await p.fill('#dni', '44');
    await p.click('[data-rok="2027"]');
    assert.strictEqual(await text(p, '#r-n3'), E(1757.60));
    assert.strictEqual(await text(p, '#r-maxdvz'), '106,5206 €');
    await p.click('[data-rok="2026"]');
    assert.strictEqual(await text(p, '#r-n3'), E(1653.50));
    await p.goto(url('materska'));
    await p.fill('#mzda', '9000');
    await p.click('[data-rok="2027"]');
    assert.strictEqual(await text(p, '#res-value'), E(2396.80));
  });

  await t('Daňový bonus: 2 deti pri 3 000 € (krátenie) = výpočet', async () => {
    await p.goto(url('danovy-bonus'));
    await p.fill('#mzda', '3000'); await p.selectOption('#d15', '2');
    assert.strictEqual(await text(p, '#res-value'), E(C.cistaMzda(3000, { deti: { do15: 2 } }).bonus));
    assert.match(await text(p, '#r-info'), /krátený/);
  });

  await t('Nezdaniteľná časť: 1 500 € → plná 497,23 €, 3 500 € → krátená', async () => {
    await p.goto(url('nezdanitelna-cast'));
    await p.fill('#mzda', '1500');
    assert.strictEqual(await text(p, '#res-value'), E(497.23));
    await p.fill('#mzda', '3500');
    assert.strictEqual(await text(p, '#res-value'), E(C.cistaMzda(3500).nczd));
    assert.strictEqual(await p.$$eval('#priklady tr', r => r.length), 6);
  });

  await t('Neexistujúca adresa vráti 404 so stránkou a odkazmi', async () => {
    const odp = await p.goto(BASE + '/neexistuje/');
    assert.strictEqual(odp.status(), 404);
    assert.match(await text(p, 'h1'), /nenašla/);
  });

  // ---------------- Zdieľanie a vloženie ----------------
  await t('Zdieľať výsledok: odkaz obsahuje zadané hodnoty a po otvorení ich obnoví', async () => {
    const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const q = await ctx.newPage();
    await q.goto(url('cista-mzda'));
    await q.click('#m-ch');                              // režim z čistej na hrubú
    await q.fill('#suma', '1400'); await q.selectOption('#d15', '2'); await q.uncheck('#nczd');
    const ocakavane = await text(q, '#res-value');
    await q.click('[data-share="vysledok"]');
    await q.waitForTimeout(200);
    const odkaz = await q.evaluate(() => navigator.clipboard.readText());
    assert.ok(odkaz.startsWith(D + '/cista-mzda/?'), odkaz);
    assert.match(await text(q, '[data-share="vysledok"]'), /skopírovaný/);
    const lokalne = odkaz.replace(D, BASE);
    const r = await ctx.newPage();
    await r.goto(lokalne);
    assert.strictEqual(await r.inputValue('#suma'), '1400');
    assert.strictEqual(await r.inputValue('#d15'), '2');
    assert.strictEqual(await r.isChecked('#nczd'), false);
    assert.strictEqual(await r.getAttribute('#m-ch', 'aria-pressed'), 'true');
    assert.strictEqual(await text(r, '#res-value'), ocakavane);
    await ctx.close();
  });

  await t('Zdieľať výsledok: obnovenie roka a týždňov v materskej', async () => {
    await p.goto(url('materska') + '?mzda=2000&_b=1.4');  // tlačidlá: [2026, 2027, 34, 37, 43] → 2027 a 43 týž.
    assert.strictEqual(await p.getAttribute('[data-rok="2027"]', 'aria-pressed'), 'true');
    assert.strictEqual(await text(p, '#r-dni'), '301');
    assert.strictEqual(await text(p, '#r-spolu'), E(C.materske(2000, 43, 2027).spolu));
  });

  await t('Zdieľacie odkazy: Facebook, WhatsApp, X a e-mail smerujú na kanonickú adresu', async () => {
    await p.goto(url('pn'));
    const hrefs = await p.$$eval('.share a', as => as.map(a => a.href));
    const kodovana = encodeURIComponent(D + '/pn/');
    for (const s of ['facebook.com', 'wa.me', 'x.com', 'mailto:']) {
      const h = hrefs.find(x => x.includes(s));
      assert.ok(h && h.includes(kodovana), s + ': ' + h);
    }
  });

  await t('Režim vloženia (?embed=1): bez hlavičky, pätičky a reklamy, so zdrojovým odkazom', async () => {
    await p.goto(url('pn') + '?embed=1');
    for (const sel of ['header.site', 'footer.site', '.share', '.ad-slot', 'section.content', '.related']) {
      assert.strictEqual(await p.isVisible(sel), false, sel + ' je viditeľný');
    }
    assert.strictEqual(await p.isVisible('.grid.calc'), true);
    const badge = await p.$eval('.embed-badge a', a => ({ href: a.href, target: a.target }));
    assert.strictEqual(badge.href, D + '/pn/');
    assert.strictEqual(badge.target, '_blank');
    const sw = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.ok(sw);
  });

  await t('Vložiť na web: generátor kódu a automatická výška náhľadu', async () => {
    await p.goto(url('vlozit') + '?k=hypoteka');
    assert.strictEqual(await p.inputValue('#vyber'), 'hypoteka');
    const kod = await p.inputValue('#kod');
    assert.ok(kod.includes(`src="${D}/hypoteka/?embed=1"`), kod);
    assert.ok(kod.includes(`<a href="${D}/hypoteka/">`), 'chýba zdrojový odkaz');
    assert.ok(kod.includes(`${D}/embed.js`), 'chýba embed.js');
    await p.selectOption('#sirka', '480px');
    assert.ok((await p.inputValue('#kod')).includes('max-width:480px'));
    // náhľad: embed.js nastaví výšku podľa obsahu kalkulačky (pôvodne 640 px)
    await p.waitForFunction(() => document.getElementById('nahlad').style.height !== '640px', null, { timeout: 8000 });
    const vyska = await p.$eval('#nahlad', f => parseInt(f.style.height, 10));
    assert.ok(vyska > 300 && vyska < 4000, 'výška ' + vyska);
    await p.selectOption('#vyber', 'dph');
    assert.ok((await p.inputValue('#kod')).includes('/dph/?embed=1'));
  });

  await t('Hlavičky hostingu: _headers povoľuje vloženie do rámca (bez X-Frame-Options)', async () => {
    const h = fs.readFileSync(path.join(dir, '_headers'), 'utf8');
    assert.ok(!/X-Frame-Options/i.test(h));
    assert.ok(/\/embed\.js[\s\S]*Access-Control-Allow-Origin: \*/.test(h));
  });

  await t('Bez nastavení zarábania sa nezobrazí prázdna reklama ani partner', async () => {
    await p.goto(url('dph'));
    assert.strictEqual(await p.$$eval('ins.adsbygoogle', x => x.length), 0);
    assert.strictEqual(await p.$$eval('a[rel~="sponsored"]', x => x.length), 0);
    assert.strictEqual(await p.$$eval('form[data-newsletter]', x => x.length), 0);
    assert.ok(await p.isVisible('.partner.tip'), 'tip sa má zobraziť namiesto partnera');
    assert.ok(!fs.existsSync(path.join(dir, 'ads.txt')), 'ads.txt nemá existovať bez AdSense');
  });

  await t('Zarábanie zapnuté (testovacia konfigurácia): AdSense, ads.txt, partner, newsletter, podpora, meranie', async () => {
    const os = require('os');
    const { execFileSync } = require('child_process');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spocitajsi-'));
    for (const x of fs.readdirSync(dir)) {
      if (x === '.git' || x === 'node_modules') continue;
      fs.cpSync(path.join(dir, x), path.join(tmp, x), { recursive: true });
    }
    const testCfg = path.join(tmp, 'tools', 'test.config.js');
    fs.writeFileSync(testCfg, `const c = require('./site.config.js');
c.zarabanie = {
  adsense: { client: 'ca-pub-1234567890123456', slotPodKalkulackou: '111', slotVObsahu: '222' },
  partneri: [{ id: 'fakturacia', stranky: ['dph'], nadpis: 'Testovací partner', text: 'Text', tlacidlo: 'Vyskúšať', url: 'https://partner.example/?ref=1' }],
  newsletter: { akcia: 'https://newsletter.example/subscribe', pole: 'email', skrytePolia: { list: '7' } },
  podpora: { url: 'https://kava.example/', text: 'Kúpte nám kávu' },
  analytika: { typ: 'umami', id: 'abc-123', skript: 'https://umami.example/script.js' },
  kontaktReklama: 'reklama@example.sk'
};
module.exports = c;`);
    execFileSync(process.execPath, [path.join(tmp, 'tools', 'build.js')], { env: { ...process.env, SITE_CONFIG: testCfg } });
    const dph = fs.readFileSync(path.join(tmp, 'dph', 'index.html'), 'utf8');
    const hyp = fs.readFileSync(path.join(tmp, 'hypoteka', 'index.html'), 'utf8');
    assert.ok(dph.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456'));
    assert.ok(/<ins class="adsbygoogle"[^>]*data-ad-slot="111"/.test(dph), 'jednotka pod kalkulačkou');
    assert.ok(/<ins class="adsbygoogle"[^>]*data-ad-slot="222"/.test(dph), 'jednotka v obsahu');
    assert.strictEqual(fs.readFileSync(path.join(tmp, 'ads.txt'), 'utf8').trim(), 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0');
    assert.ok(/href="https:\/\/partner\.example\/\?ref=1" rel="sponsored nofollow noopener"/.test(dph), 'partner s rel=sponsored');
    assert.ok(dph.includes('Reklama · partner'), 'označenie reklamy');
    assert.ok(!hyp.includes('partner.example') && hyp.includes('partner tip'), 'na hypotéke tip, nie partner');
    assert.ok(dph.includes('action="https://newsletter.example/subscribe"') && dph.includes('name="list" value="7"'));
    assert.ok(dph.includes('href="https://kava.example/"'), 'podpora v pätičke');
    assert.ok(dph.includes('"analytika":{"typ":"umami","id":"abc-123"'), 'meranie');
    assert.ok(fs.readFileSync(path.join(tmp, 'reklama', 'index.html'), 'utf8').includes('reklama@example.sk'));
    // stránky bez indexovania nemajú reklamu
    assert.ok(!fs.readFileSync(path.join(tmp, 'ochrana-sukromia', 'index.html'), 'utf8').includes('adsbygoogle.js'));
    // stránka so zapnutým zarábaním sa v prehliadači načíta bez chýb a reklamné jednotky odošle
    const q = await b.newPage();
    const chybyJs = [];
    q.on('pageerror', e => chybyJs.push(e.message));
    const tmpServer = statickyServer(tmp);
    await new Promise(r => tmpServer.listen(PORT + 1, r));
    await q.route('**/*', r => r.request().url().startsWith(`http://localhost:${PORT + 1}`) ? r.continue() : r.abort());
    await q.goto(`http://localhost:${PORT + 1}/dph/`);
    await q.waitForTimeout(200);
    assert.deepStrictEqual(chybyJs, []);
    assert.strictEqual(await q.evaluate(() => (window.adsbygoogle || []).length), 2);
    assert.ok(await q.isVisible('a[data-partner="fakturacia"]'));
    assert.ok(await q.isVisible('form[data-newsletter] input[type="email"]'));
    // vo vloženom režime sa reklama nežiada (pauseAdRequests) a nezobrazuje
    await q.goto(`http://localhost:${PORT + 1}/dph/?embed=1`);
    assert.strictEqual(await q.evaluate(() => window.adsbygoogle.pauseAdRequests), 1);
    assert.strictEqual(await q.isVisible('.ad-slot'), false);
    assert.strictEqual(await q.isVisible('.newsletter'), false);
    await q.close();
    tmpServer.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  // ---------------- SEO ----------------
  const titulky = new Set(), popisy = new Set();
  for (const s of cfg.stranky) {
    await t(`SEO: /${s.slug} – title, description, canonical, H1, štruktúrované dáta, obrázok`, async () => {
      await p.goto(url(s.slug));
      const m = await p.evaluate(() => ({
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        robots: document.querySelector('meta[name="robots"]')?.content,
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        og: document.querySelector('meta[property="og:image"]')?.content,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(x => x.textContent),
        obrBezAlt: document.querySelectorAll('img:not([alt])').length,
        inputBezLabel: [...document.querySelectorAll('input, select')].filter(i =>
          !i.closest('label') && !document.querySelector(`label[for="${i.id}"]`) && !i.getAttribute('aria-label')).map(i => i.id)
      }));
      assert.strictEqual(m.lang, 'sk');
      assert.strictEqual(m.h1, 1, 'počet H1');
      assert.ok(m.title.length >= 25 && m.title.length <= 75, `dĺžka title ${m.title.length}: ${m.title}`);
      assert.ok(m.desc && m.desc.length >= 70 && m.desc.length <= 165, `dĺžka description ${m.desc && m.desc.length}`);
      assert.ok(!titulky.has(m.title), 'duplicitný title'); titulky.add(m.title);
      assert.ok(!popisy.has(m.desc), 'duplicitný description'); popisy.add(m.desc);
      assert.strictEqual(m.canonical, D + '/' + (s.slug ? s.slug + '/' : ''));
      assert.strictEqual(/noindex/.test(m.robots), !!s.noindex);
      assert.deepStrictEqual(m.obrBezAlt, 0);
      assert.deepStrictEqual(m.inputBezLabel, [], 'polia bez popisu');
      for (const j of m.ld) JSON.parse(j);   // platný JSON-LD
      if (!s.noindex) {
        assert.ok(m.ld.length >= 1, 'chýbajú štruktúrované dáta');
        const ogSubor = path.join(dir, m.og.replace(D, ''));
        assert.ok(fs.existsSync(ogSubor), 'chýba OG obrázok ' + ogSubor);
      }
    });
  }

  await t('SEO: sitemap.xml obsahuje všetky indexované stránky a nič navyše', async () => {
    const xml = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
    const loc = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(x => x[1]).sort();
    const ocakavane = cfg.stranky.filter(s => !s.noindex).map(s => D + '/' + (s.slug ? s.slug + '/' : '')).sort();
    assert.deepStrictEqual(loc, ocakavane);
  });

  await t('SEO: robots.txt, manifest, favicon a ikony sú dostupné', async () => {
    for (const f of ['/robots.txt', '/site.webmanifest', '/favicon.svg', '/assets/icons/icon-48.png', '/assets/icons/apple-touch-icon.png', '/assets/icons/icon-512.png']) {
      const odp = await p.goto(BASE + f);
      assert.strictEqual(odp.status(), 200, f);
    }
  });

  await t('Odvody SZČO: mikroodvod pri príjme 6 000 €', async () => {
    await p.goto(url('odvody-szco'));
    await p.fill('#prijem', '6000');
    assert.strictEqual(await text(p, '#r-sp'), E(131.34));
  });

  await t('DPH: 1 000 € + 5 % = 1 050 €', async () => {
    await p.goto(url('dph'));
    await p.fill('#suma', '1000'); await p.click('[data-rate="5"]');
    assert.strictEqual(await text(p, '#res-value'), E(1050));
  });

  await b.close();
  server.close();
  console.log(`\n${ok} testov prešlo, ${chyby.length} zlyhalo`);
  process.exit(chyby.length ? 1 : 0);
})();

function near(a, b, eps = 0.011) { assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`); }
