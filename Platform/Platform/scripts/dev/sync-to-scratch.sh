#!/usr/bin/env bash
# ينسخ مصدر المنصة إلى مجلد عمل خارج المستودع: node_modules المتتبَّعة هنا ثنائيات Windows فلا تعمل على Linux.
# الاستخدام: scripts/dev/sync-to-scratch.sh <مجلد-الهدف>   ثم داخل الهدف (مرة واحدة): npm ci
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="${1:?usage: sync-to-scratch.sh <dest>}"
mkdir -p "$DEST"
for d in web server shared scripts tests seed config; do rm -rf "${DEST:?}/$d"; done
(cd "$SRC" && tar --exclude=node_modules --exclude=dist --exclude=backups --exclude='data/platform.db*' --exclude='*.log' -cf - .) | tar -xf - -C "$DEST"
echo "synced -> $DEST"
