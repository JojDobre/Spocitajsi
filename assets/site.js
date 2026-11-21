/*
 * Spoločný skript webu: zdieľanie (aj výsledku cez odkaz), režim vloženia na iný web (?embed=1),
 * načítanie reklám a meranie udalostí. Nastavenia prichádzajú z window.SPOCITAJ (generuje tools/build.js).
 */
(function () {
  'use strict';
  var CFG = window.SPOCITAJ || {};
  var embed = document.documentElement.classList.contains('embed');
  var qs = new URLSearchParams(location.search);

  /* ---------------- Meranie udalostí ---------------- */
  var A = CFG.analytika || {};
  function track(nazov, data) {
    data = data || {};
    data.stranka = CFG.slug || 'domov';
    if (embed) data.vlozene = 1;
    try {
      if (A.typ === 'umami' && window.umami) window.umami.track(nazov, data);
      else if (A.typ === 'plausible' && window.plausible) window.plausible(nazov, { props: data });
      else if (A.typ === 'ga4' && window.gtag) window.gtag('event', nazov, data);
    } catch (e) { /* meranie nesmie rozbiť web */ }
  }
  window.spocitajTrack = track;

  function nacitajSkript(src, attrs) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
    return s;
  }

  if (A.typ === 'umami' && A.id && A.skript) {
    nacitajSkript(A.skript, { 'data-website-id': A.id });
  } else if (A.typ === 'plausible' && A.id) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    nacitajSkript(A.skript || 'https://plausible.io/js/script.tagged-events.js', { 'data-domain': A.id });
  } else if (A.typ === 'ga4' && A.id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Consent mode v2: kým návštevník nesúhlasí (banner Google CMP v AdSense), cookies sa neukladajú
    window.gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
    window.gtag('js', new Date());
    window.gtag('config', A.id);
    nacitajSkript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.id));
  }

  /* ---------------- Reklama (AdSense) ---------------- */
  if (!embed && CFG.adsense) {
    var units = document.querySelectorAll('ins.adsbygoogle');
    for (var i = 0; i < units.length; i++) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blokovač reklám */ }
    }
  }

  /* ---------------- Stav kalkulačky v adrese (zdieľanie výsledku) ---------------- */
  var calc = document.querySelector('.grid.calc');
  function polia() {
    return calc ? Array.prototype.filter.call(calc.querySelectorAll('input[id], select[id]'), function (el) {
      return el.type !== 'hidden';
    }) : [];
  }
  function tlacidla() { return calc ? Array.prototype.slice.call(calc.querySelectorAll('button[aria-pressed]')) : []; }

  function stavDoAdresy() {
    var p = new URLSearchParams();
    polia().forEach(function (el) {
      p.set(el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
    });
    var stlacene = [];
    tlacidla().forEach(function (b, i) { if (b.getAttribute('aria-pressed') === 'true') stlacene.push(i); });
    if (stlacene.length) p.set('_b', stlacene.join('.'));
    return (CFG.url || location.origin + location.pathname) + '?' + p.toString();
  }

  function obnovStav() {
    if (!calc) return;
    var maStav = false;
    if (qs.has('_b')) {
      var btns = tlacidla();
      qs.get('_b').split('.').forEach(function (i) { if (btns[+i]) { btns[+i].click(); maStav = true; } });
    }
    polia().forEach(function (el) {
      if (!qs.has(el.id)) return;
      maStav = true;
      if (el.type === 'checkbox') el.checked = qs.get(el.id) === '1';
      else el.value = qs.get(el.id);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (maStav) track('obnoveny_vysledok');
  }
  obnovStav();

  if (calc) {
    var pouzite = false;
    calc.addEventListener('input', function () {
      if (!pouzite) { pouzite = true; track('kalkulacka_pouzita'); }
    });
  }

  /* ---------------- Zdieľanie ---------------- */
  function oznam(el, text) {
    var povodny = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', povodny);
    el.textContent = text;
    setTimeout(function () { el.textContent = povodny; }, 2200);
  }
  function kopiruj(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(t); }
    return Promise.resolve();
  }
  window.spocitajKopiruj = kopiruj;

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-share]') : null;
    if (el) {
      var sposob = el.getAttribute('data-share');
      track('zdielanie', { sposob: sposob });
      if (sposob === 'vysledok') {
        e.preventDefault();
        var odkaz = stavDoAdresy();
        if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
          navigator.share({ title: document.title, url: odkaz }).catch(function () {});
        } else {
          kopiruj(odkaz).then(function () { oznam(el, 'Odkaz s výsledkom skopírovaný ✓'); });
        }
      }
      return;
    }
    var partner = e.target.closest ? e.target.closest('a[data-partner]') : null;
    if (partner) track('partner_klik', { partner: partner.getAttribute('data-partner') });
    var podpora = e.target.closest ? e.target.closest('a[data-podpora]') : null;
    if (podpora) track('podpora_klik');
  });

  var nl = document.querySelector('form[data-newsletter]');
  if (nl) nl.addEventListener('submit', function () { track('newsletter_prihlasenie'); });

  /* ---------------- Režim vloženia na iný web ---------------- */
  if (embed) {
    // odkazy otvárať mimo rámca
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      a.target = '_blank'; a.rel = 'noopener';
    });
    var znacka = document.createElement('p');
    znacka.className = 'embed-badge';
    znacka.innerHTML = 'Kalkulačka od <a href="' + (CFG.url || '/') + '" target="_blank" rel="noopener">' +
      (CFG.nazov || 'SpočítajSi') + '</a> · aktuálne sadzby';
    (document.querySelector('main .wrap') || document.body).appendChild(znacka);

    var posledna = 0;
    var posliVysku = function () {
      var v = Math.ceil(document.documentElement.getBoundingClientRect().height);
      if (Math.abs(v - posledna) < 2) return;
      posledna = v;
      try { window.parent.postMessage({ typ: 'spocitajsi:vyska', vyska: v }, '*'); } catch (e) { /* nič */ }
    };
    posliVysku();
    if (window.ResizeObserver) new ResizeObserver(posliVysku).observe(document.body);
    window.addEventListener('load', posliVysku);
    track('vlozena_kalkulacka_zobrazena', { hostitel: document.referrer ? new URL(document.referrer).hostname : '' });
  }
})();
