#!/usr/bin/env bash
# Sync app docs sources into hosting/public/docs and hosting/public/card/docs.
# Run from repo root.
# Both paths serve the same content so /card/docs/... works with static servers
# (Firebase redirects /card/docs -> /docs, but npx serve does not).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$ROOT/docs"
DST="$ROOT/hosting/public/docs"
CARD_DOCS="$ROOT/hosting/public/card/docs"

if [[ ! -d "$SRC" ]]; then
  echo "Missing docs source directory: $SRC"
  exit 1
fi

mkdir -p "$DST"
rm -rf "$DST"/*
cp -R "$SRC"/. "$DST"/

mkdir -p "$CARD_DOCS"
rm -rf "$CARD_DOCS"/*
cp -R "$SRC"/. "$CARD_DOCS"/

echo "Synced docs -> hosting/public/docs and hosting/public/card/docs"
