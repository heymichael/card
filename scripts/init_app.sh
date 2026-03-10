#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_ID=""
APP_NAME=""
DOCS_BASE_PATH=""
REPO_NAME=""
FIREBASE_PROJECT=""
BUCKET="REPLACE_BUCKET"
SKIP_DOCS=0

usage() {
  cat <<'EOF'
Initialize this template for a real app repository.

Usage:
  bash scripts/init_app.sh --app-id <id> --app-name "<Name>" [options]

Required:
  --app-id <id>               App identifier (kebab-case), e.g. card
  --app-name "<Name>"         Display name, e.g. "Card"

Optional:
  --docs-base-path <path>     Docs base path, default: /<app-id>/docs
  --repo-name <name>          Repo display/root name in docs, default: <app-id>-app
  --firebase-project <id>     Sets .firebaserc default project id
  --bucket <name>             Sets artifact example bucket, default: REPLACE_BUCKET
  --skip-docs                 Skip docs regenerate + sync
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
    --docs-base-path)
      DOCS_BASE_PATH="${2:-}"
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
    --skip-docs)
      SKIP_DOCS=1
      shift
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

if [[ -z "$DOCS_BASE_PATH" ]]; then
  DOCS_BASE_PATH="/${APP_ID}/docs"
fi

if [[ -z "$REPO_NAME" ]]; then
  REPO_NAME="${APP_ID}-app"
fi

if [[ "$DOCS_BASE_PATH" != /* ]]; then
  echo "--docs-base-path must start with '/'." >&2
  exit 1
fi

export ROOT APP_ID APP_NAME DOCS_BASE_PATH REPO_NAME FIREBASE_PROJECT BUCKET

python3 - <<'PY'
import json
import os
import re
from pathlib import Path

root = Path(os.environ["ROOT"])
app_id = os.environ["APP_ID"]
app_name = os.environ["APP_NAME"]
docs_base = os.environ["DOCS_BASE_PATH"]
repo_name = os.environ["REPO_NAME"]
firebase_project = os.environ.get("FIREBASE_PROJECT", "")
bucket = os.environ.get("BUCKET", "REPLACE_BUCKET")


def replace_text(path: Path, transform) -> None:
    text = path.read_text(encoding="utf-8")
    updated = transform(text)
    path.write_text(updated, encoding="utf-8")


replace_text(
    root / "README.md",
    lambda t: re.sub(r"^#\\s+.+$", f"# {repo_name}", t, count=1, flags=re.M),
)


def update_docs_index(t: str) -> str:
    t = t.replace("Template App Documents", f"{app_name} Documents")
    t = t.replace('aria-label="Template app docs tabs"', f'aria-label="{app_name} docs tabs"')
    t = t.replace('title="Template app documents"', f'title="{app_name} documents"')
    t = re.sub(
        r'const baseDocsPath = ".*?";',
        f'const baseDocsPath = "{docs_base}";',
        t,
        count=1,
    )
    return t


replace_text(root / "docs" / "index.html", update_docs_index)
replace_text(
    root / "scripts" / "generate_docs_pages.py",
    lambda t: re.sub(
        r'^APP_DISPLAY_NAME\\s*=\\s*".*?"$',
        f'APP_DISPLAY_NAME = "{app_name}"',
        t,
        count=1,
        flags=re.M,
    ),
)

replace_text(
    root / "docs" / "architecture.md",
    lambda t: t.replace("`app-template`", f"`{repo_name}`").replace("app-template/", f"{repo_name}/"),
)

replace_text(
    root / "hosting" / "public" / "index.html",
    lambda t: t.replace("template app", app_name.lower()).replace("Template app", app_name),
)

manifest_path = root / "docs" / "artifact-manifest.example.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["app_id"] = app_id
manifest["artifact"]["runtime_uri"] = f"gs://{bucket}/{app_id}/0.1.0/runtime.tar.gz"
manifest["artifact"]["docs_uri"] = f"gs://{bucket}/{app_id}/0.1.0/docs.tar.gz"
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if firebase_project:
    firebaserc_path = root / ".firebaserc"
    firebaserc = json.loads(firebaserc_path.read_text(encoding="utf-8"))
    firebaserc.setdefault("projects", {})["default"] = firebase_project
    firebaserc_path.write_text(json.dumps(firebaserc, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$SKIP_DOCS" -eq 0 ]]; then
  if [[ -x "$ROOT/.venv/bin/python" ]]; then
    "$ROOT/.venv/bin/python" "$ROOT/scripts/generate_docs_pages.py"
  else
    python3 "$ROOT/scripts/generate_docs_pages.py"
  fi
  bash "$ROOT/scripts/sync_docs.sh"
fi

echo "Initialized template:"
echo "  app_id=${APP_ID}"
echo "  app_name=${APP_NAME}"
echo "  repo_name=${REPO_NAME}"
echo "  docs_base_path=${DOCS_BASE_PATH}"
if [[ -n "$FIREBASE_PROJECT" ]]; then
  echo "  firebase_project=${FIREBASE_PROJECT}"
fi
