# Nasadenie na VPS (analyzer.renak.eu)

Web je statický: nginx servíruje hotové HTML súbory z repozitára. Na serveri netreba Node.js, Docker ani databázu. Všetky príkazy spúšťajte ako `root`.

DNS je už nastavené: `analyzer.renak.eu` smeruje na 72.62.155.178.

## Prvé nasadenie

**1. Stiahnutie webu**
```bash
git clone --depth 1 --branch main https://github.com/JojDobre/spocitajsi.git /var/www/spocitajsi
```

**2. Konfigurácia nginx** (súbor sa kopíruje, nie odkazuje, lebo certbot doň dopíše HTTPS)
```bash
install -m 644 /var/www/spocitajsi/deploy/nginx/spocitajsi-headers.conf /etc/nginx/snippets/spocitajsi-headers.conf
```
```bash
cp /var/www/spocitajsi/deploy/nginx/analyzer.renak.eu.conf /etc/nginx/sites-available/analyzer.renak.eu
```
```bash
ln -s /etc/nginx/sites-available/analyzer.renak.eu /etc/nginx/sites-enabled/analyzer.renak.eu
```
```bash
nginx -t && systemctl reload nginx
```

**3. Kontrola cez HTTP** (má vrátiť `HTTP/1.1 200 OK`)
```bash
curl -sI http://analyzer.renak.eu/ | head -1
```

**4. HTTPS certifikát** (Let's Encrypt, presmerovanie HTTP → HTTPS)
```bash
certbot --nginx -d analyzer.renak.eu --redirect
```
Ak `certbot` chýba: `apt install -y certbot python3-certbot-nginx`.

**5. Overenie**
```bash
curl -sI https://analyzer.renak.eu/ | head -1
```
```bash
curl -sI https://analyzer.renak.eu/pn.html | grep -iE "^HTTP|^location"
```
Prvý príkaz má vrátiť `200`, druhý `301` s `location: /pn/`.

## Aktualizácia webu

Po každej zmene na GitHube:
```bash
bash /var/www/spocitajsi/deploy/deploy.sh
```

**Automatická aktualizácia** (voliteľné, každých 15 minút skontroluje GitHub a pri zmene nasadí):
```bash
echo '*/15 * * * * root bash /var/www/spocitajsi/deploy/deploy.sh >> /var/log/spocitajsi-deploy.log 2>&1' > /etc/cron.d/spocitajsi
```

Súbory v `/var/www/spocitajsi` na serveri ručne neupravujte, aktualizácia ich prepíše podľa GitHubu. Zmeny robte v repozitári: upravte súbory, spustite `node tools/build.js` a zmeny odošlite na GitHub.

## Čo nginx konfigurácia robí

- čisté adresy `/pn/`, presmerovanie `/pn` → `/pn/` a starých `/pn.html` → `/pn/`, vlastná stránka 404,
- skrýva neverejné súbory (`/tools/`, `/tests/`, `/deploy/`, `.git`, `*.md`),
- gzip kompresia, ročná cache pre `/assets/` (CSS a JS majú verziu v adrese), hodinová pre `embed.js`,
- bezpečnostné hlavičky, **bez** `X-Frame-Options`, aby sa kalkulačky dali vložiť na iné weby,
- `Access-Control-Allow-Origin: *` pre `embed.js`.

Konfigurácia je otestovaná na nginx 1.24 (rovnaká verzia ako Ubuntu 24.04).

## Odstránenie

```bash
rm /etc/nginx/sites-enabled/analyzer.renak.eu /etc/nginx/sites-available/analyzer.renak.eu /etc/nginx/snippets/spocitajsi-headers.conf /etc/cron.d/spocitajsi
```
```bash
systemctl reload nginx
```
