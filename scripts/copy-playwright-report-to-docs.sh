#!/usr/bin/env bash
# Copy Playwright HTML reports into docs snapshot for a given suite.
# Usage: bash scripts/copy-playwright-report-to-docs.sh [suite]
# Example: bash scripts/copy-playwright-report-to-docs.sh pr-checks
# Run after: npm run test:e2e:app:smoke && npm run test:e2e:docs:smoke
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUITE="${1:-pr-checks}"

DST="$ROOT/docs/test-status/playwright/$SUITE"
mkdir -p "$DST/docs" "$DST/app"

if [[ -d "$ROOT/playwright-report/docs" ]]; then
  cp -R "$ROOT/playwright-report/docs/." "$DST/docs/"
  echo "Copied docs report to $DST/docs/"
fi
if [[ -d "$ROOT/playwright-report/app" ]]; then
  cp -R "$ROOT/playwright-report/app/." "$DST/app/"
  echo "Copied app report to $DST/app/"
fi

echo "Run 'bash scripts/sync_docs.sh' to update hosting/public/docs"
