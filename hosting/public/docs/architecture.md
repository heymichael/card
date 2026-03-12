# Architecture

## Purpose

`card` is the canonical starter for a single app repository in the Haderach ecosystem.
It owns app implementation, app CI, app docs, and artifact publication contracts.
It does not own platform promotion, platform deployment, or cross-app orchestration.

## Repository Tree (ASCII)

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
│   ├── analytics-strategy.md
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

## Ownership Boundaries

### This app repository owns

- App business logic and runtime behavior.
- App CI checks (lint, test, build, contract validation).
- App docs authoring plus docs-shell experience at app scope.
- Versioned artifact packaging and manifest publication.

### External platform owns

- Promotion decisions from published app versions to environments.
- Global deployment orchestration and environment rollout.
- Cross-app smoke tests and route collision protection.
- Global host/routing policy for production domains.

## Canonical Release Flow

Canonical end-to-end flow across app + platform:

1. App feature branch
2. App PR CI
3. Merge app `main`
4. App artifact/version publish
5. Platform promotion (select artifact version for an environment)
6. Platform deploy
7. Platform smoke checks

This repository implements and validates steps 1-4. Steps 5-7 are outside this repository and run in the platform control plane.

## App Delivery Contract

Each app repo publishes immutable versioned artifacts plus metadata.
Platform consumes this metadata to promote a specific version by environment.

### Artifact format

- Runtime artifact: `runtime.tar.gz` — compressed `dist/` directory from Vite build.
- Docs artifact: `docs.tar.gz` — compressed `hosting/public/docs/` directory after generation and sync.
- Packaging script: `scripts/package-artifacts.sh` creates both tarballs and computes SHA-256 checksums.

### GCS artifact paths

Immutable versioned artifacts are stored at:

```text
gs://<bucket>/card/versions/<commit-sha>/
  runtime.tar.gz
  docs.tar.gz
  checksums.txt
  manifest.json
```

Channel pointers (e.g. `channels/prod/manifest.json`) are owned and written by the
platform repository during promotion.

### Manifest

See `docs/artifact-manifest.schema.json` for the canonical machine-readable schema.
See `docs/artifact-manifest.example.json` for a reference instance.

Manifests are generated by `scripts/generate-manifest.mjs` during the publish workflow.
Each manifest includes `app_id`, semantic version with build metadata, commit SHA,
publication timestamp, GCS URIs for both tarballs, a SHA-256 runtime checksum,
and the platform contract version.

### Publish workflow

`publish-artifact.yml` triggers on merge to `main` or manual dispatch. It runs the
full validation suite, packages artifacts, authenticates to GCP via Workload Identity
Federation, uploads immutable versioned artifacts to GCS, and verifies upload.

Promotion (selecting which version to deploy to an environment) is owned by the
platform repository.

### Required GitHub configuration

Repository variables (not secrets — these are non-sensitive identifiers):

| Variable | Purpose |
|---|---|
| `GCS_ARTIFACT_BUCKET` | GCS bucket name for artifact storage |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name for OIDC auth |
| `GCP_SERVICE_ACCOUNT` | GCP service account email for GCS writes |

### Platform app registry reference

App registration and route mapping are owned by the platform repository.
Use the platform `docs/app-registry.example.json` contract to coordinate `app_id`,
`route_prefix`, artifact discovery source, and docs route mapping.

## Docs and Routing Model (App Scope)

This template assumes app-local docs are served at one base path (for example `/docs` in local hosting, or `/<app>/docs` in integrated platform hosting).
For local route-parity convenience, hosting may add optional redirects so `/<app>/docs` resolves to `/docs` during emulator runs.
This local redirect pattern is a developer convenience for URL parity and is not identical to integrated platform routing behavior in production.

- `docs/index.html` is the docs shell entrypoint.
- `docs/shared/` contains canonical shell assets and page template.
- Required tabs: `test-status`, `priorities`, `learnings`, `requirements`, `testing`, `architecture`.
- Architecture tab target is always `architecture.html` (rendered from `architecture.md`).

## Source-to-Served Docs Contract

For docs parity and deterministic output:

- Authoring/generation source of truth: `docs/`.
- Learnings source of truth: `docs/learnings/catalog.json` and `docs/learnings/entries/*.html`.
- Generated pages from markdown:
  - `docs/architecture.md` -> `docs/architecture.html`
  - `todo/todo.md` -> `docs/priorities/index.html`
- Served/deploy copy after sync: `hosting/public/docs/` (full mirror of `docs/`).

## Learnings Feedback Loop Contract

Use `docs/learnings/` to capture reusable implementation insights discovered in app repos.

- Keep project execution tracking in `todo/todo.md`.
- Keep reusable template feedback in `docs/learnings/`.
- When a learning is backported to the canonical template, update catalog metadata:
  - `backported: true`
  - `templateRef: <commit-sha or PR reference>`

## Testing Ownership

This app repo owns app-specific testing depth and CI signals.

- `docs/testing/` documents app testing strategy and lineup.
- `docs/test-status/` holds report metadata and placeholder report/check artifacts.
- Playwright suites live in `tests/e2e/` with tags for smoke, regression, and prod monitor.
- CI workflows map those tags to PR (`pr-checks`), main publish (`main-publish-checks`), and nightly suites (`scheduled-regression`, `prod-monitor`).
- Smoke checks default to Chromium-only for speed; regression jobs set `PLAYWRIGHT_ALL_BROWSERS=1` to run Chromium, Firefox, and WebKit.
- Non-Playwright contract and artifact checks run via `scripts/checks/`.
- Snapshot generation for the Test Status docs tab runs via `scripts/test-status/generate-suite-report.mjs`.

Platform still performs post-deploy cross-app smoke checks after promotion/deploy.

## Security and Indexing Defaults

Default indexing policy is deny-by-default for template docs:

- HTML pages include `<meta name="robots" content="noindex, nofollow, noarchive" />`.
- Hosting adds `X-Robots-Tag: noindex, nofollow, noarchive`.
- Any indexing allowlist should be explicit and documented.

## Authentication Contract (Phase 1)

Authentication for this phase is client-side and fail-closed.

- Auth provider: Firebase Authentication with Google provider only.
- Shared session scope: this app/docs pair only (no cross-app SSO).
- Authorization policy: separate app and docs allowlists.
- Initial allowlist policy:
  - allowed domains: `haderach.ai` for app and docs
  - allowed users: `michael@haderachi.ai`, `michael@heretic.fund`,
    `mariam@heretic.fund`, `mariam@heretic.ventures`, `alexmader@gmail.com`
- Matching rules: case-insensitive exact email and exact domain checks.
- Unauthorized behavior: stay signed in, show blocked screen with generic
  contact-administrator guidance, and allow sign-out.
- Transient auth errors: show retry flow and keep access blocked.
- Session policy: Firebase default local persistence.

### Runtime Config Inputs

- App runtime reads Firebase config from `VITE_*` variables.
- Local bypass is supported with `VITE_AUTH_BYPASS=true` (or `authBypass=1` query
  parameter for local test/debug convenience).
- Docs shell reads runtime auth config from `window.__CARD_AUTH_RUNTIME__`.
- Local docs flow generates `docs/shared/auth-runtime.js` from `.env.local` via
  `node scripts/generate_docs_auth_runtime.mjs` (used by `npm run docs:prepare`
  and `npm run local:docs:serve`).
- Production behavior on missing/invalid config is fail-closed.

### Platform Assumptions

- No IAP in this phase.
- Server-side docs auth is deferred to a later phase.

## Analytics

Analytics uses the Firebase SDK (`firebase/analytics`) for client-side event collection. Events flow to Firebase Console, GA4 Console, and BigQuery (if export is enabled) from a single instrumentation point.

- Analytics initializes before the auth gate to capture pre-login events (page views, sign-in interactions).
- Production only — analytics is skipped in local dev and auth-bypass modes.
- Feature events are deduplicated once per page load via an in-memory Set.
- User identity is linked via `setUserId()` after successful authentication.
- Full strategy, event specification, and future evolution paths are documented in `docs/analytics-strategy.md`.

## Local Parity Prep

For local hosting parity around docs:

1. Prepare docs outputs and local auth runtime from source:
   `npm run docs:prepare`
2. Run Hosting emulator from repo root:
   `firebase serve --port 5001`

Notes:

- On macOS, port `5000` is commonly occupied by AirPlay Receiver, so this repo defaults hosting emulator config to `5001`.
- `firebase serve --port 5001` may report `Local server: http://localhost:5002` if `5001` is already in use.
- For docs smoke tests against a running local host server, prefer `E2E_BASE_URL=http://localhost:5002` (use `localhost` over `127.0.0.1` to avoid IPv4/IPv6 loopback mismatch).

## Template Customization Checklist

When creating a real app repo from this template:

1. Run bootstrap initialization:
   `bash scripts/init_app.sh --app-id <app-id> --app-name "<App Name>" --firebase-project <project-id>`
2. Set the docs base path in `docs/index.html`.
3. Replace placeholder workflow logic in `.github/workflows/ci.yml` and `.github/workflows/publish-artifact.yml`.
4. Publish artifacts using `docs/artifact-manifest.example.json` as contract baseline.
5. Keep `README.md` and this architecture tree synchronized when structure changes.
