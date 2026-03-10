#!/usr/bin/env bash
# Build card app from repo root into hosting/public/card.
# Run from repo root.
set -e
script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"
npm ci --no-audit --no-fund
npm run build

target_dir="$repo_root/hosting/public/card"
mkdir -p "$target_dir"
rm -rf "$target_dir"/*
cp -R "$repo_root/dist/card/." "$target_dir/"

echo "Card build artifacts copied to hosting/public/card"
