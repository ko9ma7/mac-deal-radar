#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -d .git ]]; then echo 'Git clone or bootstrap the repo first.' >&2; exit 1; fi
git pull --ff-only origin main
node scripts/collect.mjs
git add assets/deals.json data/custom-sources.json
if git diff --cached --quiet; then echo 'No updates to publish.'; exit 0; fi
git commit -m 'data: update MacBook deal feed from PC'
git push origin main
echo 'Pushed. GitHub Actions will deploy the refreshed data.'
