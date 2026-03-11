# card

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
- `.github/workflows/ci.yml` - pull request checks with impact-routed smoke suites.
- `.github/workflows/publish-artifact.yml` - main-branch publish checks, artifact packaging, and GCS upload.
- `.github/workflows/nightly-checks.yml` - scheduled regression and production monitor suites.
- `docs/architecture.md` - app boundaries, handoff contract, and template invariants.
- `docs/artifact-manifest.example.json` - app artifact metadata shape consumed by platform.
- `docs/artifact-manifest.schema.json` - canonical machine-readable schema for artifact manifest validation.
- `docs/index.html` + `docs/shared/` - canonical docs shell and reusable template.
- `scripts/` - docs generation/sync plus contract/artifact and test-status scripts.
- `tests/e2e/` - Playwright suites tagged for smoke, regression, and prod-monitor runs.

```text
card/
├── .cursor/
│   └── rules/
│       ├── architecture-pointer.mdc
│       ├── branch-safety-reminder.mdc
│       ├── pr-conventions.mdc
│       ├── repo-hygiene.mdc
│       ├── template-learnings.mdc
│       └── todo-conventions.mdc
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       ├── nightly-checks.yml
│       └── publish-artifact.yml
├── design-tokens/
│   └── colors.json
├── docs/
│   ├── index.html
│   ├── architecture.md
│   ├── architecture.html
│   ├── artifact-manifest.example.json
│   ├── artifact-manifest.schema.json
│   ├── priorities/
│   │   └── index.html
│   ├── learnings/
│   │   ├── catalog.json
│   │   └── entries/
│   │       ├── artifact-manifest-contract-alignment.html
│   │       ├── canonical-app-directory-structure.html
│   │       ├── client-auth-runtime-contract-pattern.html
│   │       ├── gcs-artifact-publish-with-wif.html
│   │       ├── init-app-token-replacement-gaps.html
│   │       ├── pull-request-template-standardization.html
│   │       ├── template-feedback-loop.html
│   │       └── testing-suite-rollout-pattern.html
│   ├── requirements/
│   │   ├── catalog.json
│   │   ├── index.html
│   │   ├── index.md
│   │   └── projects/
│   │       ├── card-authentication-access-control.html
│   │       ├── card-docs-shell-ux-refresh.html
│   │       ├── card-foundation.html
│   │       ├── greeting-card-designer.html
│   │       └── requirements-project.template.html
│   ├── test-status/
│   │   ├── catalog.json
│   │   ├── checks/
│   │   ├── playwright/
│   │   ├── reports/
│   │   └── summaries/
│   ├── testing/
│   │   ├── catalog.json
│   │   ├── test-lineup.html
│   │   └── testing-infrastructure.html
│   └── shared/
│       ├── auth-runtime.js
│       ├── docs-auth-gate.js
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
├── public/
│   ├── _redirects
│   └── docs/
│       └── index.html
├── scripts/
│   ├── build_card.sh
│   ├── checks/
│   │   ├── artifact-check.mjs
│   │   └── contract-check.mjs
│   ├── copy-playwright-report-to-docs.sh
│   ├── generate-manifest.mjs
│   ├── generate_docs_auth_runtime.mjs
│   ├── generate_docs_pages.py
│   ├── init_app.sh
│   ├── package-artifacts.sh
│   ├── requirements-docs.txt
│   ├── sync_docs.sh
│   └── test-status/
│       └── generate-suite-report.mjs
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── CardCanvas.tsx
│   ├── ControlsPanel.tsx
│   ├── auth/
│   │   ├── accessPolicy.ts
│   │   ├── AuthGate.tsx
│   │   └── runtimeConfig.ts
│   ├── constants.ts
│   ├── index.css
│   ├── main.tsx
│   ├── theme/
│   │   ├── colors.css
│   │   └── colors.ts
│   ├── types.ts
│   └── vite-env.d.ts
├── tests/
│   └── e2e/
│       ├── card-app/
│       │   └── card-app.spec.ts
│       └── docs-shell/
│           └── docs-shell.spec.ts
├── todo/
│   └── todo.md
├── .env.example
├── .firebaserc
├── .gitignore
├── check-color-tokens.mjs
├── documentation.html
├── eslint.config.js
├── firebase.json
├── index.html
├── package-lock.json
├── package.json
├── playwright.app.config.ts
├── playwright.docs.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
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
npm ci
npx playwright install --with-deps
npm run local:docs:serve
npm run lint
npm run test:e2e:docs:smoke
npm run test:e2e:docs:smoke:local
npm run test:e2e:app:smoke
PLAYWRIGHT_ALL_BROWSERS=1 npm run test:e2e:docs:regression
npm run check:contract -- pr-checks
npm run check:artifact -- pr-checks
python3 scripts/generate_docs_pages.py
bash scripts/sync_docs.sh
firebase serve --port 5001
```

### Authentication configuration (phase 1)

Create local auth config from `.env.example`:

```bash
cp .env.example .env.local
```

Required values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Optional values:

- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Local bypass:

- `VITE_AUTH_BYPASS=true` disables auth locally.
- Query parameter `authBypass=1` can bypass auth for local test/debug routes.

Docs shell runtime config:

- `npm run local:docs:serve` now runs `npm run docs:prepare` first.
- `docs:prepare` generates `docs/shared/auth-runtime.js` from `.env.local` so
  docs auth config is loaded automatically for local hosting.
- Docs gate still supports host/deploy runtime injection through
  `window.__CARD_AUTH_RUNTIME__`.

When running docs smoke against an already running local server, use:

```bash
npm run test:e2e:docs:smoke:local
```

This targets `http://localhost:5002`, which is the common local hosting URL when `firebase serve --port 5001` is used.

For broader browser coverage on regression runs (Chromium + Firefox + WebKit):

```bash
PLAYWRIGHT_ALL_BROWSERS=1 npm run test:e2e:docs:regression
PLAYWRIGHT_ALL_BROWSERS=1 npm run test:e2e:app -- --grep "@regression"
```

Run Playwright checks from your own terminal environment:

```bash
npx playwright install
npm run test:e2e:app:smoke
npm run test:e2e:docs:smoke
```

If browser download is blocked in restricted/sandboxed environments, install and execute
Playwright locally in your terminal to validate e2e behavior.

## Initialize a new app copy

Use the bootstrap script right after copying this repository:

```bash
bash scripts/init_app.sh --app-id card --app-name "Card" --firebase-project your-firebase-project-id
```

Useful options:

- `--docs-base-path /card/docs` (defaults to `/<app-id>/docs`)
- `--repo-name card-app` (defaults to `<app-id>-app`)
- `--bucket your-artifact-bucket` (fills manifest URI examples)
- `--skip-docs` (skip regenerate/sync if you only want token replacement)

## New app bootstrap playbook

Use this sequence when creating a real app repo from the template:

1. Create the new repository on GitHub (for example `card-app`).
2. Copy this template into a new local folder.
3. Set app-specific values:
   - `bash scripts/init_app.sh --app-id card --app-name "Card" --firebase-project your-firebase-project-id`
4. Point local git remote to the new repo:
   - `git remote set-url origin git@github.com:<org-or-user>/card-app.git`
5. Verify and push:
   - `git remote -v`
   - `git status`
   - `git push -u origin main`

## GCS artifact publish prerequisites

The publish workflow requires three GitHub repository variables:

| Variable | Purpose |
|---|---|
| `GCS_ARTIFACT_BUCKET` | GCS bucket name for artifact storage |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Federation provider resource name |
| `GCP_SERVICE_ACCOUNT` | GCP service account email with `roles/storage.objectCreator` on the bucket |

These are non-secret identifiers configured as repository variables (Settings > Secrets and variables > Actions > Variables).

GCP setup required outside this repo:

1. Create a GCS bucket for artifacts.
2. Create a service account with write access to the bucket.
3. Configure Workload Identity Federation to allow GitHub Actions OIDC tokens from this repo to impersonate the service account.

First deploy flow:

1. Merge to `main` — publish workflow packages, uploads, and verifies immutable artifacts at `gs://<bucket>/card/versions/<sha>/`.
2. Platform repo promotes and deploys using the versioned manifest at the immutable path.

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

## Learnings feedback loop

Use `docs/learnings/` for reusable insights discovered while building real apps from this template.

- `todo/todo.md` tracks execution priorities and project tasks.
- `docs/learnings/` captures reusable patterns that should be backported to the canonical template.
- When a learning is backported, update `docs/learnings/catalog.json` metadata with `backported` and `templateRef`.

## Docs shell contract

The docs shell assets in `docs/shared/` are the canonical UI pattern for app docs:

- App docs root: `/<app>/docs/` (or `/docs` for local/dev usage).
- Optional local parity: add hosting redirects so `/<app>/docs` resolves to `/docs` in emulator runs.
- Required tabs: `test-status`, `priorities`, `learnings`, `requirements`, `testing`, `architecture`.
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
