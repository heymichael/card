#!/usr/bin/env bash
# Package runtime and docs build outputs into versioned tarballs.
# Run from repo root after `npm run build` and `npm run docs:prepare`.
#
# Outputs (under artifacts/publish/):
#   runtime.tar.gz   – compressed dist/ directory
#   docs.tar.gz      – compressed hosting/public/docs/ directory
#   checksums.txt    – sha256 checksums for both tarballs
#
# Environment:
#   COMMIT_SHA  – git commit SHA (defaults to HEAD)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RUNTIME_SRC="$ROOT/dist"
DOCS_SRC="$ROOT/hosting/public/docs"
OUT_DIR="$ROOT/artifacts/publish"

if [[ ! -d "$RUNTIME_SRC" ]]; then
  echo "ERROR: Runtime build output not found at $RUNTIME_SRC — run 'npm run build' first."
  exit 1
fi

if [[ ! -d "$DOCS_SRC" ]]; then
  echo "ERROR: Docs output not found at $DOCS_SRC — run 'npm run docs:prepare' first."
  exit 1
fi

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Packaging runtime artifact..."
tar -czf "$OUT_DIR/runtime.tar.gz" -C "$RUNTIME_SRC" .

echo "Packaging docs artifact..."
tar -czf "$OUT_DIR/docs.tar.gz" -C "$DOCS_SRC" .

echo "Computing checksums..."
cd "$OUT_DIR"
shasum -a 256 runtime.tar.gz docs.tar.gz > checksums.txt

echo "Artifacts written to $OUT_DIR:"
ls -lh "$OUT_DIR"
cat "$OUT_DIR/checksums.txt"
