#!/usr/bin/env bash
# يبني فرع deploy/platform (ما ينشره Vercel) من آخر commit — بدون checkout للمستودع الكبير.
# المحتوى: Platform/Platform بدون node_modules/dist/data/backups + Platform/exchange/rashed في exchange/rashed.
#   bash Platform/Platform/scripts/deploy-branch.sh [--push]
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
BRANCH=deploy/platform
SRC=$(git rev-parse --short HEAD)
export GIT_INDEX_FILE=$(mktemp)
trap 'rm -f "$GIT_INDEX_FILE"' EXIT
rm -f "$GIT_INDEX_FILE"

git read-tree --empty
git read-tree --prefix= "HEAD:Platform/Platform"
git read-tree --prefix=exchange/rashed/ "HEAD:Platform/exchange/rashed"
for p in node_modules dist data backups; do git rm -r -q --cached --ignore-unmatch "$p"; done
git ls-files --cached | grep -E '\.log$' | xargs -r git rm -q --cached --
TREE=$(git write-tree)

PARENT=$(git rev-parse -q --verify "refs/remotes/origin/$BRANCH" || true)
if [[ -n "$PARENT" && "$(git rev-parse "$PARENT^{tree}")" == "$TREE" ]]; then
  echo "deploy/platform is already up to date ($SRC)"; exit 0
fi
COMMIT=$(git commit-tree "$TREE" ${PARENT:+-p "$PARENT"} -m "Deploy snapshot of Platform from $SRC")
git update-ref "refs/heads/$BRANCH" "$COMMIT"
echo "deploy/platform -> $(git rev-parse --short "$COMMIT") ($(git ls-tree -r --name-only "$COMMIT" | wc -l) files, from $SRC)"
[[ "${1:-}" == "--push" ]] && git push -q origin "$BRANCH" && echo pushed
exit 0
