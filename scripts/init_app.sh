#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_ID=""
APP_NAME=""
REPO_NAME=""
FIREBASE_PROJECT=""
BUCKET="REPLACE_BUCKET"

usage() {
  cat <<'EOF'
Initialize this template for a real app repository.

Usage:
  bash scripts/init_app.sh --app-id <id> --app-name "<Name>" [options]

Required:
  --app-id <id>               App identifier (kebab-case), e.g. card
  --app-name "<Name>"         Display name, e.g. "Card"

Optional:
  --repo-name <name>          Repo display/root name, default: <app-id>-app
  --firebase-project <id>     Sets .firebaserc default project id
  --bucket <name>             Sets artifact example bucket, default: REPLACE_BUCKET
  -h, --help                  Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-id)
      APP_ID="${2:-}"
      shift 2
      ;;
    --app-name)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --repo-name)
      REPO_NAME="${2:-}"
      shift 2
      ;;
    --firebase-project)
      FIREBASE_PROJECT="${2:-}"
      shift 2
      ;;
    --bucket)
      BUCKET="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$APP_ID" || -z "$APP_NAME" ]]; then
  echo "Missing required arguments --app-id and/or --app-name." >&2
  usage
  exit 1
fi

if [[ ! "$APP_ID" =~ ^[a-z0-9-]+$ ]]; then
  echo "--app-id must be kebab-case (lowercase letters, numbers, hyphens)." >&2
  exit 1
fi

if [[ -z "$REPO_NAME" ]]; then
  REPO_NAME="${APP_ID}-app"
fi

export ROOT APP_ID APP_NAME REPO_NAME FIREBASE_PROJECT BUCKET

python3 - <<'PY'
import json
import os
import re
from pathlib import Path

root = Path(os.environ["ROOT"])
app_id = os.environ["APP_ID"]
app_name = os.environ["APP_NAME"]
repo_name = os.environ["REPO_NAME"]
firebase_project = os.environ.get("FIREBASE_PROJECT", "")
bucket = os.environ.get("BUCKET", "REPLACE_BUCKET")


def replace_text(path: Path, transform) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    updated = transform(text)
    path.write_text(updated, encoding="utf-8")


replace_text(
    root / "README.md",
    lambda t: re.sub(r"^#\s+.+$", f"# {repo_name}", t, count=1, flags=re.M),
)

replace_text(
    root / "docs" / "architecture.md",
    lambda t: t.replace("`app-template`", f"`{repo_name}`").replace("app-template/", f"{repo_name}/"),
)

replace_text(
    root / "hosting" / "public" / "index.html",
    lambda t: t.replace("template app", app_name.lower()).replace("Template app", app_name),
)

if firebase_project:
    firebaserc_path = root / ".firebaserc"
    firebaserc = json.loads(firebaserc_path.read_text(encoding="utf-8"))
    firebaserc.setdefault("projects", {})["default"] = firebase_project
    firebaserc_path.write_text(json.dumps(firebaserc, indent=2) + "\n", encoding="utf-8")
PY

echo "Initialized template:"
echo "  app_id=${APP_ID}"
echo "  app_name=${APP_NAME}"
echo "  repo_name=${REPO_NAME}"
if [[ -n "$FIREBASE_PROJECT" ]]; then
  echo "  firebase_project=${FIREBASE_PROJECT}"
fi
