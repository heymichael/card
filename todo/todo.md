Todo: app template baseline

Open items

1. [High] Define first app requirements baseline
2. [Med] Wire real app CI and artifact publish pipeline
3. [Low] Replace template branding and docs base path

Completed items

_(none)_

## Details

**1. Define first app requirements baseline**

Purpose: Establish a concrete requirements record before implementation starts so app scope, acceptance checks, and constraints are explicit.

Approach: Copy `docs/requirements/projects/requirements-project.template.html` to a project-specific file, fill in required fields and requirement IDs, add catalog entry in `docs/requirements/catalog.json`, and verify list/detail rendering in the docs shell.

**2. Wire real app CI and artifact publish pipeline**

Purpose: Replace placeholder automation with production-ready checks that guard merges and publish immutable artifacts for platform promotion.

Approach: Update `.github/workflows/ci.yml` to run actual lint/test/build commands on pull requests and `.github/workflows/publish-artifact.yml` to publish runtime/docs artifacts plus manifest on pushes to `main`.

**3. Replace template branding and docs base path**

Purpose: Ensure this repository reflects the target app identity and route contract instead of template labels.

Approach: Update app name and wording in `README.md`, `docs/architecture.md`, and `docs/index.html`; set `baseDocsPath` to the app's integrated docs route; regenerate docs and sync to hosting output.

## Build-first then canonicalize checklist

Use this checklist while building the first real app from this template.

### Phase 1 - Build first app

- [ ] Keep a running "template drift" log with every app-specific change you make.
- [ ] Wire real CI commands in `.github/workflows/ci.yml` (lint, tests, build, docs checks).
- [ ] Wire real artifact packaging and publish in `.github/workflows/publish-artifact.yml`.
- [ ] Confirm manifest payload matches `docs/artifact-manifest.example.json`.
- [ ] Validate docs shell tabs and deep links work for real app routes.

### Phase 2 - Stabilize app handoff

- [ ] Verify canonical flow end-to-end through app step 4 (feature branch -> PR CI -> merge -> publish).
- [ ] Confirm platform can consume published manifest/artifacts without app-source access.
- [ ] Verify noindex defaults remain correct in both page meta and hosting headers.
- [ ] Document required secrets/env vars and required IAM roles for publish.

### Phase 3 - Re-template into canonical app repo

- [ ] Remove app-specific names, IDs, paths, and secrets from docs/workflow examples.
- [ ] Keep only reusable defaults; move app-specific decisions to examples or placeholders.
- [ ] Update `README.md` and `docs/architecture.md` with final canonical contracts.
- [ ] Regenerate/sync docs and verify `docs/` equals `hosting/public/docs/` for served content.
- [ ] Smoke-test bootstrap experience by cloning into a second "new app" repo.

### Exit criteria for canonical template

- [ ] A new app can be bootstrapped with only identity/path/secret replacements.
- [ ] CI and publish scaffolds run cleanly after minimal app-specific command wiring.
- [ ] Artifact manifest contract is stable and accepted by platform promotion flow.
- [ ] Docs shell behavior is consistent and requires no structural rewrites per app.
