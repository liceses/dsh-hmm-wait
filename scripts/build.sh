#!/usr/bin/env bash
# dsh-hmm-wait build entry (dsh plugin toolchain compatible):
#   bash scripts/build.sh
# Type-checks, emits declarations (tsc), then bundles host + client (tsdown).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[dsh-hmm-wait] tsc (declarations + typecheck)…"
npm run typecheck
tsc -p tsconfig.build.json

echo "[dsh-hmm-wait] tsdown (host + client bundles)…"
npx tsdown
