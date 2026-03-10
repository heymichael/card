# app-template

Canonical starter repository for app teams deployed through the Haderach platform.

This repository is intentionally app-scoped. It owns app code, app CI, app docs, and artifact publish metadata. Platform promotion, deploy orchestration, and cross-app smoke checks are owned by the master platform repository.

## What this repo is responsible for

- App implementation and runtime behavior.
- App CI (lint, tests, and build validation).
- App docs authoring and docs-shell parity surfaces.
- App artifact packaging and manifest publication.

## What this repo is not responsible for

- Platform routing topology and global promotion decisions.
- Environment deployment orchestration for `haderach.ai`.
- Cross-app smoke checks after platform deployment.

## Repository layout

- `hosting/public/` - app-hosted static content and served docs mirror.
- `firebase.json` - hosting defaults (including deny-by-default indexing headers).
- `.github/workflows/ci.yml` - starter pull request CI placeholder workflow.
- `.github/workflows/publish-artifact.yml` - starter main-branch artifact publish placeholder workflow.
- `docs/architecture.md` - app boundaries, handoff contract, and template invariants.
- `docs/artifact-manifest.example.json` - app artifact metadata shape consumed by platform.
- `docs/index.html` + `docs/shared/` - canonical docs shell and reusable template.
- `scripts/` - docs generation and source-to-served sync helpers.

```text
app-template/
├── .cursor/
│   └── rules/
│       ├── architecture-pointer.mdc
│       ├── branch-safety-reminder.mdc
│       ├── pr-conventions.mdc
│       ├── repo-hygiene.mdc
│       └── todo-conventions.mdc
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish-artifact.yml
├── docs/
│   ├── index.html
│   ├── architecture.md
│   ├── architecture.html
│   ├── artifact-manifest.example.json
│   ├── priorities/
│   │   └── index.html
│   ├── requirements/
│   │   ├── catalog.json
│   │   └── projects/
│   │       ├── app-template-foundation.html
│   │       └── requirements-project.template.html
│   ├── test-status/
│   │   ├── catalog.json
│   │   ├── checks/
│   │   ├── reports/
│   │   └── summaries/
│   ├── testing/
│   │   ├── catalog.json
│   │   ├── test-lineup.html
│   │   └── testing-infrastructure.html
│   └── shared/
│       ├── docs-shell.css
│       ├── docs-shell-page.template.html
│       └── docs-shell.js
├── hosting/
│   └── public/
│       ├── assets/
│       │   └── landing/
│       │       └── logo.svg
│       ├── index.html
│       └── robots.txt
├── scripts/
│   ├── generate_docs_pages.py
│   ├── requirements-docs.txt
│   └── sync_docs.sh
├── todo/
│   └── todo.md
├── .firebaserc
├── .gitignore
├── firebase.json
└── README.md
```

## Local development

Prerequisites:

- Node.js + npm
- Firebase CLI
- Python 3 (for docs generation)

Suggested commands:

```bash
npm --version
python3 --version
firebase --version
python3 -m pip install -r scripts/requirements-docs.txt
python3 scripts/generate_docs_pages.py
bash scripts/sync_docs.sh
firebase emulators:start --only hosting --project REPLACE_WITH_FIREBASE_PROJECT_ID --config firebase.json
```

## App-to-platform handoff model

This template aligns to the canonical release flow:

1. App feature branch
2. App PR CI
3. Merge app `main`
4. App artifact/version publish
5. Platform promotion (outside this repo)
6. Platform deploy (outside this repo)
7. Platform smoke checks (outside this repo)

The integration boundary is the app artifact manifest consumed by platform.

## Docs shell contract

The docs shell assets in `docs/shared/` are the canonical UI pattern for app docs:

- App docs root: `/<app>/docs/` (or `/docs` for local/dev usage).
- Required tabs: `test-status`, `priorities`, `requirements`, `testing`, `architecture`.
- Architecture tab points to `architecture.html` (rendered from `architecture.md`).

Template tokens used by `docs/shared/docs-shell-page.template.html`:

- `__APP_NAME__` (for example `Card`)
- `__DOCS_BASE_PATH__` (for example `/card/docs`)

## Template bootstrap checklist

When copying this repo for a new app:

1. Set app identity:
   - Update app/repo naming in `README.md` and `docs/architecture.md`.
   - Set docs shell labels and `baseDocsPath` in `docs/index.html`.
2. Configure CI and artifact publish:
   - Replace placeholder steps in `.github/workflows/ci.yml` and `.github/workflows/publish-artifact.yml`.
   - Wire secrets/permissions needed for your artifact destination.
3. Seed docs content:
   - Update `docs/requirements/catalog.json` and project pages.
   - Update `docs/testing/catalog.json` and testing docs.
   - Update `docs/test-status/catalog.json` report metadata.
4. Generate and sync docs:
   - `python3 scripts/generate_docs_pages.py`
   - `bash scripts/sync_docs.sh`
5. Verify local behavior:
   - Validate docs tabs, deep links, and list/detail/back behavior.
   - Confirm noindex defaults remain in place.

See `docs/architecture.md` and `docs/artifact-manifest.example.json` for canonical contracts.
