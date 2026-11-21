// Spustenie: node tests/calc.test.js
const assert = require('assert');
const C = require('../assets/calc.js');

let ok = 0;
function t(name, fn) { fn(); ok++; console.log('✓ ' + name); }
const near = (a, b, eps = 0.02) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

t('Daň – príklad Finančnej správy (ZD 60 000 € → 8 356,83 + 4 004,17)', () => {
  near(C.danProgresivna(60000, C.P.pasmaRocne), 8356.83 + 4004.17);
});

t('NČZD – plná, krátená, nulová a spojitá na hraniciach', () => {
  near(C.nczdMesacne(1000), 497.23);
  near(C.nczdMesacne(2173.59), 497.23);
  near(C.nczdMesacne(2173.60), 497.23, 0.05);
  near(C.nczdMesacne(3000), 1221.76 - 1000);
  near(C.nczdMesacne(3665.28), 0);
  near(C.nczdMesacne(5000), 0);
});

t('Čistá mzda 1 500 € bez detí', () => {
  const r = C.cistaMzda(1500);
  near(r.sp, 141);       // 9,4 %
  near(r.zp, 75);        // 5 %
  near(r.zd, 1284);
  near(r.nczd, 497.23);
  near(r.dan, (1284 - 497.23) * 0.19);
  near(r.cista, 1500 - 141 - 75 - (1284 - 497.23) * 0.19);
  near(r.cenaPrace, 1500 * (1 + 0.244 + 0.008 + 0.11));
});

t('Maximálny vymeriavací základ obmedzí sociálne poistenie', () => {
  const r = C.cistaMzda(20000);
  near(r.sp, 16764 * 0.094);
  near(r.zp, 1000);
});

t('Daňový bonus – 1 dieťa do 15 rokov, nízka mzda je limitovaná 29 %', () => {
  const r = C.cistaMzda(500, { deti: { do15: 1 } });
  near(r.bonus, Math.min(100, 0.29 * r.zd));
});

t('Daňový bonus – krátenie nad hranicou 2 286 €', () => {
  const r = C.cistaMzda(3000, { deti: { do15: 1 } });
  near(r.bonus, Math.max(0, 100 - (r.zd - 2286) / 10));
});

t('Hrubá z čistej je inverzia čistej', () => {
  const h = C.hrubaZCistej(1200);
  near(C.cistaMzda(h).cista, 1200);
});

t('DPH 23 % oboma smermi', () => {
  assert.deepStrictEqual(C.dph(100, 23, 'pridat'), { bezDPH: 100, dph: 23, sDPH: 123 });
  assert.deepStrictEqual(C.dph(123, 23, 'odobrat'), { bezDPH: 100, dph: 23, sDPH: 123 });
});

t('SZČO – pásma sociálneho poistenia', () => {
  assert.strictEqual(C.odvodySZCO({ prijem: 2500 }).sp, 0);
  assert.strictEqual(C.odvodySZCO({ prijem: 8000 }).sp, 131.34);
  assert.strictEqual(C.odvodySZCO({ prijem: 15000 }).sp, 303.11); // minimum
  near(C.odvodySZCO({ prijem: 15000 }).zp, 121.92);         // minimum ZP
  near(C.odvodySZCO({ prijem: 100000, vydavky: 20000 }).sp, (80000 / 12 / 1.486) * 0.3315, 0.05);
  assert.strictEqual(C.spPodlaFondov(396.24), 131.34);   // mikroodvod
  assert.strictEqual(C.spPodlaFondov(16764), 5557.26);   // maximum
});

t('Formátovanie eur', () => {
  assert.strictEqual(C.eur(1234.5), '1 234,50 €');
  assert.strictEqual(C.cislo('1 234,5'), 1234.5);
});

// ---------- Nemocenské dávky ----------
t('DVZ – strop 100,2083 € a zaokrúhlenie nahor na 4 desatinné miesta', () => {
  assert.strictEqual(C.dvz(1200), 39.4521);          // príklad aksamec.sk: 1 200 € → 39,4521
  assert.strictEqual(C.dvz(10000), 100.2083);
  assert.strictEqual(C.dvz(3048), 100.2083);         // 2 × 1 524 € = presne strop
});

t('Materské – oficiálne maximá 2 254,70 € / 2 329,90 €', () => {
  const r = C.materske(10000);
  assert.strictEqual(r.mesiac30, 2254.70);
  assert.strictEqual(r.mesiac31, 2329.90);
  assert.strictEqual(r.denne, 75.1562);
});

t('Materské – príklad 1 200 € (887,70 € / 917,30 €)', () => {
  const r = C.materske(1200);
  assert.strictEqual(r.mesiac30, 887.70);
  assert.strictEqual(r.mesiac31, 917.30);
  assert.strictEqual(r.dni, 238);
});

t('PN – maximum nemocenského 1 653,50 € za 30 dní platených Sociálnou poisťovňou', () => {
  const r = C.pn(10000, 44);                         // 14 dní zamestnávateľ + 30 dní SP
  assert.strictEqual(r.dniSP, 30);
  assert.strictEqual(r.nemocenske, 1653.50);
  const r31 = C.pn(10000, 45);
  assert.strictEqual(r31.nemocenske, 1708.60);
});

t('PN – rozdelenie dní 3 / 11 / zvyšok a sadzby 25 % a 55 %', () => {
  const r = C.pn(1500, 20);
  assert.deepStrictEqual([r.dni1, r.dni2, r.dniSP], [3, 11, 6]);
  const d = C.dvz(1500);
  near(r.nahrada1, 3 * d * 0.25);
  near(r.nahrada2, 11 * d * 0.55);
  near(r.nemocenske, 6 * d * 0.55, 0.1);
  const kratka = C.pn(1500, 2);
  assert.deepStrictEqual([kratka.dni1, kratka.dni2, kratka.dniSP, kratka.nemocenske], [2, 0, 0, 0]);
});

// ---------- Hypotéka a sporenie ----------
t('Hypotéka – anuitná splátka 150 000 € / 3,9 % / 30 rokov ≈ 707,49 €', () => {
  const r = C.hypoteka(150000, 3.9, 30);
  near(r.splatka, 707.49);
  assert.strictEqual(r.pocetSplatok, 360);
  assert.strictEqual(r.rocne.length, 30);
  near(r.rocne[29].zostatok, 0, 1);
  const istinaSpolu = r.rocne.reduce((a, x) => a + x.istina, 0);
  near(istinaSpolu, 150000, 1);
});

t('Hypotéka – nulový úrok', () => {
  near(C.hypoteka(12000, 0, 1).splatka, 1000);
});

t('Sporenie – bez úroku sa suma rovná vkladom, daň 19 % z úroku', () => {
  const a = C.sporenie(1000, 100, 0, 2);
  assert.strictEqual(a.konecnaSuma, 3400);
  const b = C.sporenie(10000, 0, 3, 1);
  near(b.dan, b.urokHruby * 0.19, 0.06);
  near(b.urokHruby, 10000 * (Math.pow(1 + 0.03 / 12, 12) - 1), 1.5);
  const bezDane = C.sporenie(10000, 0, 3, 1, false);
  assert.strictEqual(bezDane.dan, 0);
});

// ---------- Cestovné náhrady ----------
t('Stravné – pásma a hranica 5 hodín', () => {
  assert.strictEqual(C.stravne(4.9).stravne, 0);
  assert.strictEqual(C.stravne(5).stravne, 9.80);
  assert.strictEqual(C.stravne(12).stravne, 9.80);
  assert.strictEqual(C.stravne(12.5).stravne, 14.60);
  assert.strictEqual(C.stravne(19).stravne, 21.70);
  assert.strictEqual(C.stravne(8, {}, C.CN.stravneDo30112026).stravne, 9.30);
});

t('Stravné – krátenie z najvyššieho pásma a zaokrúhlenie nahor', () => {
  // 13 h, obed: 14,60 − 40 % × 21,70 = 14,60 − 8,68 = 5,92
  assert.strictEqual(C.stravne(13, { obed: true }).stravne, 5.92);
  // 20 h, raňajky: 21,70 − 5,425 = 16,275 → 16,28
  assert.strictEqual(C.stravne(20, { ranajky: true }).stravne, 16.28);
  // 8 h, obed: 9,80 − 8,68 = 1,12
  assert.strictEqual(C.stravne(8, { obed: true }).stravne, 1.12);
  // krátenie nesmie ísť do mínusu
  assert.strictEqual(C.stravne(8, { obed: true, vecera: true }).stravne, 0);
  assert.strictEqual(C.stravne(20, { ranajky: true, obed: true, vecera: true }).stravne, 0);
});

t('Náhrada za auto – každý začatý km × 0,313 € + PHM', () => {
  const r = C.nahradaAuto(100.2, 6.5, 1.55);
  near(r.zakladna, 101 * 0.313);
  near(r.phm, 100.2 * 0.065 * 1.55);
});

// ---------- Minimálna mzda a príplatky ----------
t('Minimálne mzdové nároky 2026 podľa tabuľky MPSVR', () => {
  assert.deepStrictEqual(C.minimalneNaroky().map(x => x.mesacne), [915, 1031, 1147, 1263, 1379, 1495]);
  assert.deepStrictEqual(C.minimalneNaroky().map(x => x.hodinove), [5.259, 5.925, 6.592, 7.259, 7.925, 8.592]);
});

t('Minimálne mzdové nároky 2027 (972 € + (k − 1) × 580 €)', () => {
  assert.deepStrictEqual(C.minimalneNaroky(2027).map(x => x.mesacne), [972, 1088, 1204, 1320, 1436, 1552]);
  assert.deepStrictEqual(C.minimalneNaroky(2027).map(x => x.hodinove), [5.586, 6.253, 6.92, 7.586, 8.253, 8.92]);
});

t('Príplatky 2026 – presné sumy za hodinu (zaokrúhlené zobrazenie 2,63 / 5,26 / 2,10 €)', () => {
  assert.strictEqual(C.priplatokHodina('sobota'), 2.6295);
  assert.strictEqual(C.priplatokHodina('nedela'), 5.259);
  assert.strictEqual(C.priplatokHodina('noc'), 2.1036);
  assert.strictEqual(C.priplatokHodina('nocRizikova'), 2.6295);
  assert.strictEqual(C.priplatokHodina('sobota', true), 2.3666);
  assert.strictEqual(C.priplatokHodina('nedela', true), 4.7331);
  assert.strictEqual(C.priplatokHodina('noc', true), 1.8407);
  // riziková noc nemá stanovenú zníženú sadzbu
  assert.strictEqual(C.priplatokHodina('nocRizikova', true), 2.6295);
});

t('Príplatky 2027 – podľa tabuľky (2,793 / 5,586 / 2,2344 / 2,5137 / 5,0274 / 1,9551 €)', () => {
  assert.strictEqual(C.priplatokHodina('sobota', false, 2027), 2.793);
  assert.strictEqual(C.priplatokHodina('nedela', false, 2027), 5.586);
  assert.strictEqual(C.priplatokHodina('noc', false, 2027), 2.2344);
  assert.strictEqual(C.priplatokHodina('sobota', true, 2027), 2.5137);
  assert.strictEqual(C.priplatokHodina('nedela', true, 2027), 5.0274);
  assert.strictEqual(C.priplatokHodina('noc', true, 2027), 1.9551);
  // príklad podnikajte.sk: 5 h v nedeľu = 27,93 €
  assert.strictEqual(C.priplatky({ nedela: 5 }, 0, false, false, 2027).nedela, 27.93);
});

t('Príplatky – súčet za mesiac zaokrúhľuje až výsledok', () => {
  const r = C.priplatky({ sobota: 8, nedela: 8, noc: 10, sviatok: 8, nadcas: 4 }, 8);
  assert.strictEqual(r.sobota, 21.04);   // 8 × 2,6295 = 21,036
  assert.strictEqual(r.nedela, 42.07);   // 8 × 5,259 = 42,072
  assert.strictEqual(r.noc, 21.04);      // 10 × 2,1036 = 21,036
  near(r.sviatok, 64); near(r.nadcas, 8);
  near(r.spolu, 21.04 + 42.07 + 21.04 + 64 + 8);
});

// ---------- Rok 2027 pri dávkach ----------
t('Dávky 2027 – strop DVZ 106,5206 € a oficiálne maximá', () => {
  assert.strictEqual(C.dvz(10000, 2027), 106.5206);
  const m = C.materske(10000, 34, 2027);
  assert.strictEqual(m.mesiac30, 2396.80);
  assert.strictEqual(m.mesiac31, 2476.70);
  assert.strictEqual(C.pn(10000, 44, 2027).nemocenske, 1757.60);
  assert.strictEqual(C.pn(10000, 45, 2027).nemocenske, 1816.20);
  // bez zadania roka platí 2026
  assert.strictEqual(C.dvz(10000), 100.2083);
});

t('NČZD ročne – 5 966,73 € / krátenie / nula pri 43 983,32 €', () => {
  assert.strictEqual(C.nczdRocne(20000), 5966.73);
  assert.strictEqual(C.nczdRocne(26083.13), 5966.73);
  near(C.nczdRocne(30000), 14661.11 - 10000);
  assert.strictEqual(C.nczdRocne(43983.32), 0);
  assert.strictEqual(C.nczdRocne(3000), 3000);   // nie viac ako základ dane
});

console.log(`\n${ok} testov prešlo`);
