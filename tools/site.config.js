// Jediné miesto, kde sa nastavuje doména, názov webu a SEO údaje stránok.
// Po zmene spustite: node tools/build.js

module.exports = {
  // Doména webu (bez lomky na konci). Pri zmene spustite node tools/build.js
  domena: 'https://spocitajsi.renak.eu',
  nazov: 'SpočítajSi',
  popis: 'Bezplatné slovenské kalkulačky s aktuálnymi sadzbami: mzda, dane, odvody, dávky, hypotéka.',
  farba: '#0b6bcb',
  // Overovací kód z Google Search Console (meta tag, len hodnota content="..."); prázdne = nevkladá sa
  googleVerifikacia: '',
  bingVerifikacia: '',

  // ===================== ZARÁBANIE =====================
  // Všetko je vypnuté, kým nevyplníte údaje. Prázdna hodnota = prvok sa na webe nezobrazí.
  zarabanie: {
    // 1) Google AdSense. client = 'ca-pub-…'. Ak vyplníte aj ID reklamných jednotiek,
    //    reklama sa zobrazí na pripravených miestach; bez nich fungujú automatické reklamy Google.
    adsense: {
      client: '',
      slotPodKalkulackou: '',   // jednotka pod výsledkom kalkulačky (najlepšie zarába)
      slotVObsahu: ''           // jednotka pri konci textu
    },

    // 2) Partnerské (affiliate) odkazy. Box sa zobrazí pod kalkulačkou na stránkach v zozname `stranky`.
    //    Odkaz je automaticky označený ako reklama (rel="sponsored"), ako vyžaduje Google aj zákon.
    //    Príklad:
    //    { id: 'fakturacia', stranky: ['dph', 'e-faktura-2027', 'odvody-szco'],
    //      nadpis: 'Fakturačný program pripravený na e-faktúru 2027',
    //      text: 'Vystavte e-faktúru za pár sekúnd. Prvý mesiac zadarmo.',
    //      tlacidlo: 'Vyskúšať zadarmo', url: 'https://partner.sk/?ref=VAS-KOD' }
    partneri: [],

    // 3) Newsletter: zoznam e-mailov je najcennejšie aktívum webu (upozornenie na zmeny 2027).
    //    Funguje s formulárom ľubovoľnej služby (Ecomail, MailerLite, Mailchimp, Brevo):
    //    akcia = adresa, kam formulár odosiela (action), pole = názov poľa pre e-mail.
    newsletter: {
      akcia: '',
      pole: 'email',
      skrytePolia: {}            // napr. { 'u': '123', 'id': 'abc' } podľa služby
    },

    // 4) Dobrovoľná podpora (Buy Me a Coffee, Ko-fi, Patreon…)
    podpora: { url: '', text: 'Pomohla vám kalkulačka? Kúpte nám kávu ☕' },

    // 5) Meranie návštevnosti a kliknutí (čo zarába a čo nie).
    //    typ: 'umami' (zadarmo, bez cookies), 'plausible' (bez cookies) alebo 'ga4' (vyžaduje súhlas s cookies).
    //    umami: id = Website ID, skript = adresa tracker skriptu (napr. https://cloud.umami.is/script.js)
    //    plausible: id = vaša doména bez https://;  ga4: id = 'G-XXXXXXX'
    analytika: { typ: '', id: '', skript: '' },

    // 6) Kontakt pre inzerentov (stránka /reklama/)
    kontaktReklama: '[E-MAIL PRE INZERENTOV]'
  },

  // Dátum poslednej vecnej kontroly obsahu (zobrazuje sa na stránkach a v dátach pre Google)
  aktualizovane: '2026-11-21',

  zdroje: {
    fs: { nazov: 'Finančná správa SR', url: 'https://www.financnasprava.sk/' },
    sp: { nazov: 'Sociálna poisťovňa', url: 'https://www.socpoist.sk/' },
    mpsvr: { nazov: 'Ministerstvo práce, sociálnych vecí a rodiny SR', url: 'https://www.employment.gov.sk/' },
    upsvr: { nazov: 'Ústredie práce, sociálnych vecí a rodiny', url: 'https://www.upsvr.gov.sk/' },
    nbs: { nazov: 'Národná banka Slovenska', url: 'https://nbs.sk/' },
    slovlex: { nazov: 'Slov-Lex – zbierka zákonov SR', url: 'https://www.slov-lex.sk/' },
    vszp: { nazov: 'Všeobecná zdravotná poisťovňa', url: 'https://www.vszp.sk/' }
  },

  // Poradie = poradie v pätičke a v rozcestníku
  stranky: [
    {
      slug: '', nazov: 'Domov', menu: false,
      title: 'Kalkulačky 2026 a 2027 – mzda, PN, materská, hypotéka, DPH',
      description: 'Bezplatné slovenské kalkulačky: čistá mzda, PN, materská, hypotéka, odvody živnostníka, DPH, príplatky, stravné a minimálna mzda 2026 a 2027.',
      typ: 'home'
    },
    {
      slug: 'cista-mzda', tip: "<strong>Máte deti?</strong> Pozrite si, koľko vám patrí na <a href=\"/danovy-bonus/\">daňovom bonuse</a>, a ak pracujete cez víkend, spočítajte si <a href=\"/priplatky/\">príplatky</a>.", badge: 'Najpoužívanejšia', nazov: 'Čistá mzda', menu: true,
      title: 'Výpočet čistej mzdy 2026 – kalkulačka z hrubej na čistú',
      description: 'Čistá mzda 2026 z hrubej aj naopak: odvody 14,4 %, nové daňové pásma, nezdaniteľná časť, daňový bonus na deti a cena práce. Výpočet okamžite a zadarmo.',
      typ: 'app', kategoria: 'Mzda a dane', obrazok: 'Čistá mzda 2026', podtitul: 'Z hrubej na čistú aj naopak',
      zdroje: ['fs', 'sp', 'slovlex'], suvisiace: ['minimalna-mzda', 'danovy-bonus', 'nezdanitelna-cast', 'priplatky']
    },
    {
      slug: 'hypoteka', tip: "<strong>Porovnajte ponuky bánk.</strong> Rozdiel 0,3 percentuálneho bodu pri úvere 150 000 € na 30 rokov znamená približne 26 € mesačne a viac ako 9 000 € za celé obdobie.", nazov: 'Hypotéka', menu: true,
      title: 'Hypotekárna kalkulačka 2026 – výpočet splátky hypotéky',
      description: 'Vypočítajte mesačnú splátku hypotéky, celkové úroky a splátkový kalendár po rokoch. Aktuálne úroky hypoték na Slovensku a limity NBS.',
      typ: 'app', kategoria: 'Úvery a sporenie', obrazok: 'Hypotekárna kalkulačka', podtitul: 'Splátka, úroky, splátkový kalendár',
      zdroje: ['nbs'], suvisiace: ['sporenie', 'cista-mzda']
    },
    {
      slug: 'pn', tip: "<strong>Čakáte bábätko?</strong> Spočítajte si <a href=\"/materska/\">materskú a rodičovský príspevok</a> na rok 2026 aj 2027.", badge: 'Limity 2026 aj 2027', nazov: 'PN (nemocenská)', menu: true, menuNazov: 'PN',
      title: 'Kalkulačka PN 2026 a 2027 – výpočet nemocenskej z platu',
      description: 'Koľko dostanete na PN? Výpočet náhrady príjmu od zamestnávateľa (prvých 14 dní) a nemocenského od 15. dňa podľa pravidiel 2026 aj 2027.',
      typ: 'app', kategoria: 'Dávky', obrazok: 'PN kalkulačka 2026 / 2027', podtitul: 'Náhrada príjmu a nemocenské',
      zdroje: ['sp', 'slovlex'], suvisiace: ['materska', 'cista-mzda']
    },
    {
      slug: 'materska', badge: 'Limity 2026 aj 2027', nazov: 'Materská a rodičovský', menu: true, menuNazov: 'Materská',
      title: 'Materská kalkulačka 2026 a 2027 – výpočet materskej dávky',
      description: 'Výpočet materskej 2026 a 2027: 75 % denného vymeriavacieho základu, maximum 2 329,90 € (2027: 2 476,70 €) mesačne, celková suma a rodičovský príspevok.',
      typ: 'app', kategoria: 'Dávky', obrazok: 'Materská 2026 / 2027', podtitul: 'Materské a rodičovský príspevok',
      zdroje: ['sp', 'upsvr', 'slovlex'], suvisiace: ['pn', 'danovy-bonus']
    },
    {
      slug: 'odvody-szco', tip: "<strong>Fakturujete?</strong> Od 1. 1. 2027 musia platitelia DPH vystavovať e-faktúry. Prečítajte si <a href=\"/e-faktura-2027/\">čo treba urobiť</a>.", badge: 'Nové pravidlá od 7/2026', nazov: 'Odvody SZČO',
      title: 'Odvody SZČO 2026 – kalkulačka odvodov živnostníka od 1. 7.',
      description: 'Koľko zaplatí živnostník do Sociálnej a zdravotnej poisťovne? Nové pásma od 1. 7. 2026, mikroodvod 131,34 €, minimálne odvody 425,03 € a výhľad na 2027.',
      typ: 'app', kategoria: 'Podnikanie', obrazok: 'Odvody živnostníka 2026', podtitul: 'Mikroodvod a nové pásma od 1. 7.',
      zdroje: ['sp', 'vszp', 'slovlex'], suvisiace: ['dph', 'e-faktura-2027', 'cista-mzda']
    },
    {
      slug: 'dph', tip: "<strong>Fakturujete s DPH?</strong> Od 1. 1. 2027 musia platitelia DPH vystavovať e-faktúry. Pozrite si <a href=\"/e-faktura-2027/\">nášho sprievodcu e-faktúrou</a>.", nazov: 'DPH',
      title: 'DPH kalkulačka 2026 – výpočet DPH zo sumy (23 %, 19 %, 5 %)',
      description: 'Výpočet DPH zo sumy aj k cene: pripočítanie a odpočítanie DPH pri slovenských sadzbách 23 %, 19 % a 5 %. Vzorce a príklady.',
      typ: 'app', kategoria: 'Podnikanie', obrazok: 'DPH kalkulačka', podtitul: '23 %, 19 % a 5 %',
      zdroje: ['fs', 'slovlex'], suvisiace: ['e-faktura-2027', 'odvody-szco']
    },
    {
      slug: 'minimalna-mzda', badge: '972 € od 2027', nazov: 'Minimálna mzda',
      title: 'Minimálna mzda 2026 a 2027 – 915 € a 972 €, stupne a v čistom',
      description: 'Minimálna mzda 2026 je 915 € (5,259 €/h), v roku 2027 stúpne na 972 € (5,586 €/h). Koľko je v čistom, cena práce a minimálne mzdy podľa stupňov náročnosti.',
      typ: 'article', kategoria: 'Mzda a dane', obrazok: 'Minimálna mzda 2026 a 2027', podtitul: '915 € → 972 €',
      zdroje: ['mpsvr', 'slovlex'], suvisiace: ['priplatky', 'cista-mzda'], publikovane: '2026-11-21'
    },
    {
      slug: 'priplatky', nazov: 'Príplatky',
      title: 'Príplatky 2026 a 2027 – sobota, nedeľa, noc, sviatok, nadčas',
      description: 'Príplatok za sobotu 2,63 €, nedeľu 5,26 € a nočnú prácu 2,10 € za hodinu (2027: 2,79 € / 5,59 € / 2,23 €). Kalkulačka príplatkov za víkend, sviatok a nadčas.',
      typ: 'app', kategoria: 'Mzda a dane', obrazok: 'Príplatky 2026 / 2027', podtitul: 'Sobota, nedeľa, noc, sviatok',
      zdroje: ['mpsvr', 'slovlex'], suvisiace: ['minimalna-mzda', 'cista-mzda']
    },
    {
      slug: 'danovy-bonus', badge: 'Nové', nazov: 'Daňový bonus',
      title: 'Daňový bonus na dieťa 2026 – kalkulačka, výška a podmienky',
      description: 'Daňový bonus na dieťa 2026: 100 € do 15 rokov a 50 € od 15 do 18 rokov. Kalkulačka s limitom zo základu dane a krátením pri vyššom príjme.',
      typ: 'app', kategoria: 'Mzda a dane', obrazok: 'Daňový bonus na dieťa 2026', podtitul: '100 € a 50 € mesačne',
      zdroje: ['fs', 'slovlex'], suvisiace: ['cista-mzda', 'nezdanitelna-cast', 'materska']
    },
    {
      slug: 'nezdanitelna-cast', badge: 'Nové', nazov: 'Nezdaniteľná časť',
      title: 'Nezdaniteľná časť základu dane 2026 – výška a výpočet',
      description: 'Nezdaniteľná časť na daňovníka 2026 je 5 966,73 € ročne (497,23 € mesačne). Kalkulačka krátenia pri vyššom príjme a úspora na dani.',
      typ: 'app', kategoria: 'Mzda a dane', obrazok: 'Nezdaniteľná časť 2026', podtitul: '497,23 € mesačne',
      zdroje: ['fs', 'slovlex'], suvisiace: ['cista-mzda', 'danovy-bonus']
    },
    {
      slug: 'cestovne-nahrady', badge: 'Nové sumy od 1. 12. 2026', nazov: 'Cestovné náhrady',
      title: 'Cestovné náhrady 2026 – stravné od 1. 12. 2026 a náhrada za km',
      description: 'Stravné na pracovnej ceste 9,80 / 14,60 / 21,70 € od 1. 12. 2026, krátenie za jedlo a náhrada za vlastné auto 0,313 €/km + PHM. Kalkulačka cestovných náhrad.',
      typ: 'app', kategoria: 'Mzda a dane', obrazok: 'Cestovné náhrady 2026', podtitul: 'Stravné a kilometrovné',
      zdroje: ['mpsvr', 'slovlex'], suvisiace: ['priplatky', 'cista-mzda']
    },
    {
      slug: 'sporenie', tip: "<strong>Hľadáte lepší úrok?</strong> Sporiace účty a termínované vklady bánk sa líšia aj o niekoľko percentuálnych bodov.", nazov: 'Sporenie a úroky',
      title: 'Úroková kalkulačka sporenia – zložené úročenie po zdanení',
      description: 'Koľko nasporíte? Úroková kalkulačka so zloženým úročením, pravidelnými mesačnými vkladmi a 19 % daňou z úrokov podľa slovenského zákona.',
      typ: 'app', kategoria: 'Úvery a sporenie', obrazok: 'Sporenie a úroky', podtitul: 'Zložené úročenie po zdanení',
      zdroje: ['fs', 'nbs'], suvisiace: ['hypoteka']
    },
    {
      slug: 'e-faktura-2027', tip: "<strong>Hľadáte fakturačný program s podporou e-faktúry?</strong> Pred výberom si overte, či program spolupracuje s certifikovaným poskytovateľom e-faktúr.", badge: 'Od 1. 1. 2027', nazov: 'E-faktúra 2027',
      title: 'E-faktúra od 1. 1. 2027 – čo musí urobiť živnostník a firma',
      description: 'Povinná e-faktúra od 1. januára 2027: koho sa týka, čo je e-faktúra, bezplatné riešenie Finančnej správy, pokuty a kontrolný zoznam krok za krokom.',
      typ: 'article', kategoria: 'Podnikanie', obrazok: 'E-faktúra od 1. 1. 2027', podtitul: 'Čo musíte urobiť',
      zdroje: ['fs', 'slovlex'], suvisiace: ['dph', 'odvody-szco'], publikovane: '2026-11-20'
    },
    {
      slug: 'o-nas', nazov: 'O nás a metodika', menu: false,
      title: 'O nás a metodika výpočtov',
      description: 'Kto stojí za kalkulačkami SpočítajSi, z akých zákonov a zdrojov vychádzajú výpočty, ako často ich aktualizujeme a ako nás kontaktovať.',
      typ: 'page', zdroje: ['fs', 'sp', 'mpsvr', 'nbs', 'slovlex']
    },
    {
      slug: 'vlozit', nazov: 'Vložiť kalkulačku na web', menu: false,
      title: 'Kalkulačky na váš web zadarmo – vloženie jedným kódom',
      description: 'Vložte bezplatnú kalkulačku čistej mzdy, PN, materskej, DPH či hypotéky na svoj web alebo blog. Jeden riadok kódu, automatická výška, vždy aktuálne sadzby.',
      typ: 'page'
    },
    {
      slug: 'reklama', nazov: 'Reklama a spolupráca', menu: false,
      title: 'Reklama a spolupráca – oslovte ľudí, ktorí riešia financie',
      description: 'Reklamné možnosti na SpočítajSi: sponzorovaný box pri kalkulačke, partnerské odkazy a články pre ľudí, ktorí práve riešia mzdu, dane, hypotéku či podnikanie.',
      typ: 'page'
    },
    {
      slug: 'ochrana-sukromia', nazov: 'Ochrana súkromia', menu: false,
      title: 'Ochrana súkromia a cookies',
      description: 'Zásady ochrany osobných údajov a používania cookies na webe SpočítajSi.',
      typ: 'page', noindex: true
    }
  ]
};
