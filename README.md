# card

Canonical starter repository for app teams deployed through the Haderach platform.

This repository is intentionally app-scoped. It owns app code, app CI, and artifact publish metadata. Platform promotion, deploy orchestration, and cross-app smoke checks are owned by the platform repository.

## What this repo is responsible for

- App implementation and runtime behavior.
- App CI (lint, tests, and build validation).
- App artifact packaging and manifest publication.

## What this repo is not responsible for

- Platform routing topology and global promotion decisions.
- Environment deployment orchestration for `haderach.ai`.
- Cross-app smoke checks after platform deployment.

## Repository layout

- `hosting/public/` - app-hosted static content.
- `firebase.json` - hosting defaults (including deny-by-default indexing headers).
- `.github/workflows/ci.yml` - pull request checks.
- `.github/workflows/publish-artifact.yml` - main-branch artifact packaging and GCS upload.
- `.github/workflows/nightly-checks.yml` - scheduled regression and production monitor suites.
- `docs/architecture.md` - app boundaries, handoff contract, and template invariants.
- `docs/learnings.md` - reusable implementation patterns.
- `scripts/` - build, artifact packaging, and manifest generation.
- `tests/e2e/` - Playwright suites tagged for smoke, regression, and prod-monitor runs.
- `tasks/` - per-task markdown files managed by [taskmd](https://github.com/driangle/taskmd).

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
│   ├── architecture.md
│   └── learnings.md
├── hosting/
│   └── public/
│       ├── assets/
│       │   └── landing/
│       │       └── logo.svg
│       ├── index.html
│       └── robots.txt
├── public/
│   └── _redirects
├── scripts/
│   ├── build_card.sh
│   ├── generate-manifest.mjs
│   ├── init_app.sh
│   └── package-artifacts.sh
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── CardCanvas.tsx
│   ├── ControlsPanel.tsx
│   ├── analytics/
│   │   └── analytics.ts
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
│       └── card-app/
│           └── card-app.spec.ts
├── tasks/
│   └── *.md (one file per task, managed by taskmd)
├── .env.example
├── .firebaserc
├── .gitignore
├── .taskmd.yaml
├── check-color-tokens.mjs
├── eslint.config.js
├── firebase.json
├── index.html
├── package-lock.json
├── package.json
├── playwright.app.config.ts
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

Suggested commands:

```bash
npm ci
npx playwright install --with-deps
npm run lint
npm run build
npm run test:e2e:app:smoke
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

## GCS artifact publish prerequisites

The publish workflow requires three GitHub repository variables:

| Variable | Purpose |
|---|---|
| `GCS_ARTIFACT_BUCKET` | GCS bucket name for artifact storage |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Federation provider resource name |
| `GCP_SERVICE_ACCOUNT` | GCP service account email with `roles/storage.objectCreator` on the bucket |

These are non-secret identifiers configured as repository variables (Settings > Secrets and variables > Actions > Variables).

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

## Learnings

Use `docs/learnings.md` for reusable insights discovered while building real apps from this template.

See `docs/architecture.md` for canonical ownership boundaries and contracts.
