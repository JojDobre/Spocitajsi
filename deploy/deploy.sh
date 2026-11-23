#!/usr/bin/env bash
# Aktualizácia webu SpočítajSi na VPS: stiahne poslednú verziu z GitHubu a obnoví nginx.
# Spustenie (ako root):  bash /var/www/spocitajsi.renak.eu/deploy/deploy.sh
# Prepnutie vetvy:       BRANCH=main bash /var/www/spocitajsi.renak.eu/deploy/deploy.sh
# Na serveri nič neupravujte ručne – každá aktualizácia prepíše súbory podľa GitHubu.
set -euo pipefail

REPO="https://github.com/JojDobre/spocitajsi.git"
DIR="/var/www/spocitajsi.renak.eu"
# vetva sa pamätá v repozitári; pri prvom spustení sa použije premenná BRANCH alebo main
BRANCH="${BRANCH:-$(git -C "$DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"

if [ ! -d "$DIR/.git" ]; then
  echo "→ Klonujem $REPO ($BRANCH) do $DIR"
  git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
  PRED=""
else
  PRED="$(git -C "$DIR" rev-parse HEAD)"
  git -C "$DIR" fetch -q --depth 1 origin "$BRANCH"
  git -C "$DIR" checkout -q -B "$BRANCH" FETCH_HEAD
  git -C "$DIR" reset -q --hard FETCH_HEAD
  git -C "$DIR" clean -q -fd
fi
PO="$(git -C "$DIR" rev-parse HEAD)"

if [ "$PRED" = "$PO" ] && [ "${1:-}" != "--vynutit" ]; then
  echo "$(date '+%d.%m.%Y %H:%M') bez zmeny ($(git -C "$DIR" log -1 --format=%h))"
  exit 0
fi

# hlavičky pre nginx sú súčasťou repozitára – skopírujeme aktuálnu verziu
install -m 644 "$DIR/deploy/nginx/spocitajsi-headers.conf" /etc/nginx/snippets/spocitajsi-headers.conf

nginx -t -q
systemctl reload nginx

echo "$(date '+%d.%m.%Y %H:%M') ✓ nasadené: $(git -C "$DIR" log -1 --format='%h %s')"
