# Zarábanie: čo je pripravené a ako to zapnúť

Všetko sa zapína v súbore **`tools/site.config.js`** v časti `zarabanie`. Po každej zmene spustite:

```bash
node tools/build.js
```

Kým niečo nevyplníte, na webe sa to nezobrazí. Žiadne prázdne reklamné rámčeky ani nefunkčné tlačidlá. Na stránkach bez partnera sa namiesto reklamy zobrazuje užitočný tip s odkazom na inú kalkulačku.

| Prvok | Kde sa zobrazí | Čo treba |
|---|---|---|
| **Google AdSense** | pod výsledkom kalkulačky a na konci textu, plus `ads.txt` | schválený účet AdSense |
| **Partnerské odkazy** | box pod kalkulačkou na stránkach podľa témy | účet v affiliate sieti alebo u partnera |
| **Newsletter** | box „Upozorníme vás na zmeny v roku 2027“ na každej kalkulačke | účet v e-mailovej službe |
| **Podpora (káva)** | odkaz v pätičke | účet Buy Me a Coffee / Ko-fi |
| **Meranie** | neviditeľné, sleduje použitie kalkulačiek a kliknutia | účet Umami / Plausible / GA4 |
| **Stránka pre inzerentov** | `/reklama/` | váš e-mail v `kontaktReklama` |
| **Zdieľanie** | pod každou kalkulačkou | funguje hneď |
| **Vloženie na iné weby** | `/vlozit/` | funguje hneď |

---

## 1. Google AdSense (pasívny príjem z návštevnosti)

1. Najprv spustite web na vlastnej doméne a nechajte ho pár týždňov rásť. AdSense schvaľuje weby s vlastným obsahom a návštevnosťou.
2. Požiadajte o účet na adsense.google.com a do `adsense.client` vložte kód vydavateľa (`ca-pub-…`).
3. Spustite build: vloží sa skript AdSense do hlavičky a vytvorí sa súbor **`ads.txt`**, bez ktorého AdSense obmedzuje príjmy.
4. Po schválení vytvorte v AdSense dve reklamné jednotky (typ *Obsahová / responzívna*) a ich ID vložte do `slotPodKalkulackou` a `slotVObsahu`. Bez nich môžete zapnúť **automatické reklamy** priamo v AdSense.
5. **Súhlas s cookies (povinné v EÚ):** v AdSense zapnite *Ochrana súkromia a správy → Správa GDPR*. Google zobrazí certifikovaný banner a o súhlas sa postará sám.

Vo vloženej kalkulačke na cudzom webe sa reklama nikdy nezobrazuje. AdSense to v rámci na cudzích stránkach nedovoľuje.

## 2. Partnerské (affiliate) odkazy (najvyšší zárobok na návštevu)

Provízia za jednu registráciu alebo objednávku býva oveľa vyššia ako príjem z tisícok zobrazení reklamy. Najviac zarábajú témy, pri ktorých sa ľudia rozhodujú o peniazoch:

| Stránky | Vhodní partneri |
|---|---|
| `dph`, `e-faktura-2027`, `odvody-szco` | fakturačné a účtovné programy (e-faktúra od 2027 je veľká téma), online účtovníci, podnikateľské účty |
| `hypoteka`, `sporenie` | finanční sprostredkovatelia, porovnávače hypoték, sporiace účty, investičné platformy |
| `cista-mzda`, `minimalna-mzda`, `priplatky` | pracovné portály, personálne agentúry, kurzy a vzdelávanie |
| `materska`, `danovy-bonus`, `pn` | detské e-shopy, poistenie, sporenie pre deti |

**Kde hľadať partnerov:** slovenské a české affiliate siete (napr. Dognet, eHUB), priamo partnerské programy konkrétnych firiem (hľadajte na ich webe „partnerský program“ alebo „affiliate“), prípadne im napíšte. Odkaz na stránku `/reklama/` im pomôže zorientovať sa.

Partner sa pridáva do `partneri` (príklad je priamo v konfigurácii). Box je automaticky označený **„Reklama · partner“** a odkaz má `rel="sponsored nofollow"`, ako vyžaduje Google aj zákon o ochrane spotrebiteľa.

## 3. Newsletter (najcennejšie dlhodobé aktívum)

Zoznam e-mailov ľudí, ktorí chcú vedieť o zmenách v roku 2027, patrí vám a nezávisí od Google. Neskôr môžete posielať novinky s partnerskými ponukami (vždy označenými).

1. Založte si účet v e-mailovej službe s bezplatným štartom (napr. MailerLite, Ecomail, Brevo, Mailchimp).
2. Vytvorte formulár na prihlásenie a pozrite sa do jeho HTML kódu. Adresu z `action="…"` vložte do `newsletter.akcia`, názov poľa pre e-mail do `pole` a prípadné skryté polia (`<input type="hidden" …>`) do `skrytePolia`.
3. V službe zapnite **potvrdenie prihlásenia e-mailom (double opt-in)** a v zásadách ochrany súkromia doplňte názov služby.

## 4. Podpora

Do `podpora.url` vložte odkaz na Buy Me a Coffee, Ko-fi alebo Patreon. Zobrazí sa v pätičke. Pri bezplatných nástrojoch ľudia občas radi prispejú.

## 5. Meranie: čo zarába a čo nie

Bez merania neviete, ktoré kalkulačky a partneri fungujú. Web odosiela tieto udalosti:

| Udalosť | Kedy |
|---|---|
| `kalkulacka_pouzita` | návštevník prvýkrát zmení hodnotu v kalkulačke |
| `zdielanie` (sposob) | klik na Zdieľať výsledok / Facebook / WhatsApp / X / e-mail / Vložiť |
| `obnoveny_vysledok` | niekto otvoril zdieľaný odkaz s výsledkom |
| `partner_klik` (partner) | klik na partnerský odkaz (porovnajte s províziami) |
| `newsletter_prihlasenie` | odoslanie formulára newslettera |
| `podpora_klik` | klik na podporu |
| `vlozenie_kod_skopirovany` | niekto skopíroval kód na vloženie kalkulačky |
| `vlozena_kalkulacka_zobrazena` (hostitel) | zobrazenie kalkulačky vloženej na inom webe, aj s jeho doménou |

**Odporúčanie:** **Umami Cloud** (bezplatný plán) alebo Plausible. Neukladajú cookies, takže nepotrebujú súhlas a nespomaľujú web. GA4 je podporované tiež, ale spúšťa sa až po súhlase cez banner Google.

## 6. Priamy predaj reklamy

Keď bude mať web návštevnosť, priamy sponzor jednej kalkulačky (napr. banka na hypotéke) zaplatí často viac ako AdSense za celý web. Stránka `/reklama/` už popisuje formy spolupráce a vaše zásady, doplňte len e-mail do `kontaktReklama`.

---

## Zdieľanie a vloženie na iné weby (rast návštevnosti a odkazov)

- **Zdieľať výsledok:** vytvorí odkaz s vyplnenými hodnotami. Kto ho otvorí, uvidí rovnaký výpočet (napr. „pozri, koľko budem mať na materskej“). Na mobile sa otvorí systémové zdieľanie, na počítači sa odkaz skopíruje.
- **Facebook, WhatsApp, X, e-mail:** bežné zdieľanie stránky s pekným náhľadovým obrázkom.
- **Vložiť na web (`/vlozit/`):** blogy, účtovníci, realitky či mamičkovské weby si kalkulačku vložia jedným kódom. Výška sa prispôsobí automaticky a vo vloženej kalkulačke nie je reklama. Pod kalkulačkou je **odkaz na váš web**, a práve takéto odkazy Google najviac oceňuje. Každá vložená kalkulačka vám tak dlhodobo prináša návštevnosť aj lepšie pozície.

**Ako vloženie rozšíriť:** napíšte 20 až 30 slovenským účtovným kanceláriám, mzdovým firmám, blogom o financiách a rodičovským webom a ponúknite im kalkulačku zadarmo. Stačí poslať odkaz na `/vlozit/`.

---

## Realistický odhad (orientačne)

| Mesačná návštevnosť | AdSense | Partneri (pri 0,5 – 2 % konverzií) | Spolu |
|---|---|---|---|
| 5 000 | 5 – 25 € | 10 – 80 € | **15 – 100 €** |
| 20 000 | 20 – 100 € | 50 – 300 € | **70 – 400 €** |
| 50 000 | 50 – 250 € | 150 – 800 € | **200 – 1 000 €** |

Ide o hrubý odhad. Skutočné čísla veľmi závisia od témy (hypotéky a podnikanie zarábajú najviac), ročného obdobia (január je najsilnejší) a výšky provízií konkrétnych partnerov.
