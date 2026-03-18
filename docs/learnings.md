# Learnings

Reusable implementation patterns discovered while building apps from this template.
To add a new learning, append a section following the format below.

---

## GCS Artifact Publish with Workload Identity Federation

Publish immutable versioned app artifacts from GitHub Actions to GCS using keyless Workload Identity Federation auth, avoiding long-lived service account keys.

### Problem

The publish workflow validated and snapshotted artifacts but never uploaded them to a platform-consumable location. The platform repo had no stable discovery path for app artifacts, blocking first deploy. Additionally, authenticating GitHub Actions to GCP without storing long-lived JSON keys required Workload Identity Federation, which has several non-obvious configuration pitfalls.

### Reusable Pattern

- **Immutable versioned artifacts:** Store tarball and manifest at `gs://<bucket>/<app-id>/versions/<commit-sha>/`. Each version is a complete, self-contained set: `runtime.tar.gz`, `checksums.txt`, and `manifest.json`.
- **Packaging scripts:** Use a shell script (`scripts/package-artifacts.sh`) for tarball creation and checksums, and a Node script (`scripts/generate-manifest.mjs`) for manifest generation with schema field validation.
- **WIF auth in CI:** Use `google-github-actions/auth@v2` with three non-secret repo variables (`GCS_ARTIFACT_BUCKET`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`). No JSON keys stored as secrets.
- **Ownership boundary:** App repo publishes to immutable versioned paths. Platform repo owns promotion (writing channel pointers like `channels/prod/manifest.json`) and deployment. Keep promotion logic out of app repos.

### Risk and Rollout Notes

- **WIF audience mismatch:** The `google-github-actions/auth` action sends the provider resource path (with `https://iam.googleapis.com/` prefix) as the OIDC audience. The GCP WIF provider must be configured with "Allowed audiences" matching this exact value.
- **Provider ID alignment:** The WIF provider ID in GCP must match the suffix of the `GCP_WORKLOAD_IDENTITY_PROVIDER` variable. Mismatches produce "pool or provider does not exist" errors.
- **Bucket permissions:** The service account needs `Storage Object Creator` for uploads and `Storage Object Viewer` for the verify step.
- **Deleted pool recovery:** GCP soft-deletes WIF pools. Recreating with the same ID fails; use "Show deleted pools" to undelete instead.
- **Concurrent CI runs:** Snapshot commits can race when multiple workflow runs push to the same branch. Use `git pull --rebase` and `continue-on-error: true` to prevent blocking artifact publish.

---

## Client Auth Runtime Contract Pattern

Deliver client-side Google authentication consistently across a bundled React app runtime and a static docs-shell runtime in the same repository.

### Problem

A single auth requirement had to work across two different frontend execution models: Vite-bundled React app code (`src/`) and static docs shell assets (`docs/shared/`). A naive env-only approach fits app runtime but does not cleanly cover static docs hosting.

### Reusable Pattern

Use one auth provider/policy model but split runtime config delivery by surface: app runtime reads `VITE_*` values directly, while docs runtime reads a generated browser global (`window.__CARD_AUTH_RUNTIME__`) from a checked-in docs asset path. Keep allowlist policy logic aligned between surfaces (same match rules, separate policy sets).

### Risk and Rollout Notes

- Generated docs auth runtime files can accidentally carry machine-local values if workflow contracts are unclear; keep generation documented and review staged files carefully.
- Client-side gating is not a replacement for server-side authorization on sensitive docs; treat this as phase-1 access control.
- Keep fail-closed behavior for missing/invalid auth config and preserve explicit local bypass controls for developer productivity.

---

## Artifact Manifest Contract Alignment

Align app and platform repositories on one machine-readable artifact manifest contract to avoid drift between docs examples and published metadata.

### Problem

The app repo and platform repo both documented the artifact manifest, but in slightly different shapes. The app example included a top-level `contract_version` field while platform documentation only used `compatibility.platform_contract_version`. Without a canonical schema, these subtle mismatches can survive reviews and break downstream automation.

### Reusable Pattern

Define one canonical JSON Schema and make app repos validate their local manifest examples against that schema. Keep a vendored schema copy in app repos when direct remote schema fetch is not yet practical.

### Risk and Rollout Notes

- During transition, app repos can drift if schema updates are not mirrored; include a canonical-source comment in vendored copies.
- Standardize on one version field location to prevent dual-source ambiguity in parsers.
- Follow up with CI schema validation to enforce contract alignment automatically.

---

## Canonical App Directory Structure

Single-app repositories should include top-level `src/` and `design-tokens/` directories as standard app-owned structure.

### Problem

The template repository did not clearly reflect app-local runtime source and token ownership. Teams migrating from monorepo layouts had to infer whether `src/` and token assets should live at repo root or in nested paths.

### Reusable Pattern

For single-app repositories, keep app runtime source under root-level `src/` and semantic visual tokens under root-level `design-tokens/`. This keeps boundaries clear and avoids path-coupling to monorepo conventions like `apps/<app>/`.

### Risk and Rollout Notes

- Existing app repos may already use alternate structures and should migrate gradually.
- Template updates should preserve compatibility for teams adopting incrementally.
- Docs and tree snippets must be kept synchronized when structure changes.

---

## Init App Token Replacement Gaps

The app bootstrap script (`scripts/init_app.sh`) can leave template tokens behind in key files after initialization, requiring manual cleanup.

### Problem

After running app initialization with card values, several files still contained `app-template` or `Template App` strings. This required manual cleanup in files like `README.md` and other generated content.

### Reusable Pattern

Add a post-init verification step that scans for known template tokens and fails if any are still present. Keep the list focused on intended replacements and allowlist expected template-only files.

### Risk and Rollout Notes

- Stricter token checks may flag existing repos with historical template wording.
- Introduce checks in warning mode first, then enforce once false positives are resolved.
- Keep a small allowlist for intentional references to the canonical template project.

---

## Pull Request Template Standardization

Add a repository pull request template so required PR sections are consistently present and aligned with agent and team conventions.

### Problem

The repository required PRs to follow sections such as Why, Todo Mapping, Validation, and Deploy/Ops notes, but no `.github/pull_request_template.md` existed. Without a template, submitters could miss required context and reviews would depend on manual reminders.

### Reusable Pattern

When PR conventions are mandated by rules or policy, enforce them with a checked-in PR template that includes all required sections and clear N/A guidance.

### Risk and Rollout Notes

- Template-only rollout is low risk and immediately improves PR consistency.
- Keep section names synchronized with `.cursor/rules/pr-conventions.mdc` if rules evolve.
- Require `N/A` rather than blank sections to preserve reviewer signal quality.

---

## Template Feedback Loop

Use this entry pattern when an implementation decision in a real app should be generalized and pushed back to the canonical app template.

### Problem

While building the first app from this template, teams often discover reusable patterns (workflow steps, docs conventions, contract clarifications) that are not captured centrally. Without a dedicated lane, those insights get buried in PRs or todo notes.

### Reusable Pattern

Record each reusable insight in a learnings entry with enough context and rationale that another app team can adopt it without reading app-specific code history.

### Risk and Rollout Notes

- Identify the exact template file(s) affected.
- State the default behavior that should be standardized.
- Capture migration or rollout notes for existing app repos.
- Call out compatibility risks with current app repos.

---

## Testing Suite Rollout Pattern

Introduce app testing in staged buckets so PR confidence improves immediately while regression depth grows without slowing merge velocity.

### Problem

A single "run everything everywhere" test strategy made local debugging and CI reliability hard. Smoke, publish validation, regression, and prod monitoring had different goals but were not clearly separated in configuration and reporting.

### Reusable Pattern

Split tests by execution bucket: PR smoke (fast), main publish checks (release safety), regression (deeper coverage), and prod monitor (availability). Keep Playwright specs tagged by intent (`@smoke`, `@regression`, `@prod-monitor`) and map each to explicit workflow triggers.

### Risk and Rollout Notes

- CI startup dependencies (emulators, browser downloads) can cause flaky timeouts if not preinstalled.
- Loopback host mismatch (`127.0.0.1` vs `localhost`) can break local runs on some systems.
- Treat scheduled suites as opt-in/manual during stabilization, then re-enable cron when stable.

---

## Firebase Analytics Integration Pattern

Add Firebase Analytics to an authenticated app with environment-gated initialization, per-page-load event deduplication, and dev console logging for pre-deploy verification.

### Problem

The app had Firebase initialized for authentication but no analytics. The measurement ID was present in the Firebase config but `getAnalytics()` was never called, so no data appeared in Firebase Analytics or GA4 dashboards. Adding analytics required decisions across multiple dimensions: which SDK to use, when to initialize, how to avoid polluting production data during development, how to deduplicate high-frequency UI events, and how to verify instrumentation locally without deploying.

### Reusable Pattern

- **Single analytics module:** Encapsulate all analytics logic in one module (`src/analytics/analytics.ts`) that owns initialization, environment gating, event deduplication, and named track functions.
- **Pre-auth initialization:** Call `getAnalytics(app)` immediately after `initializeApp()`, before the auth gate renders. This captures the full funnel: page view, sign-in, feature usage, conversion. Set `setUserId()` after successful auth to link pre-auth events retroactively.
- **Production-only with dev console logging:** Gate analytics on `import.meta.env.DEV` and auth bypass flags. In dev mode, log events to the browser console instead of sending to Firebase. Vite dead-code-eliminates the dev paths from production builds.
- **Per-page-load deduplication:** Use an in-memory `Set<string>` keyed by event name. High-frequency interactions fire once per page load. Conversion events use two names: one that always fires (volume) and one that deduplicates (conversion rate).
- **Firebase SDK over gtag.js:** When Firebase is already in the app, use the Firebase SDK for analytics rather than adding a separate gtag.js script. Both write to the same GA4 property.
- **Hardcoded event names:** Each event has an explicit string constant in the analytics module, not derived from DOM elements or button text.

### Risk and Rollout Notes

- **Custom dimensions require manual GA4 registration:** Event parameters automatically flow to BigQuery but must be registered in GA4 Admin to appear in console reports. Registration is not retroactive in the console.
- **BigQuery export is not retroactive:** Enable early in Firebase Console. Only captures events from the enable date forward.
- **GA4 parameter limits:** 100-character string value limit, 25 parameters per event, 500 distinct event names per property.
- **Bundle size:** The `firebase/analytics` module adds ~20-30 KB. For apps already using Firebase, this is marginal.

---

## Vite Env Build-Time Contract

`VITE_*` environment variables must exist in `.env.local` (local dev), GitHub repository secrets (CI), and the workflow `env:` block (build step mapping). Missing any leg causes silent production failures.

### Problem

Vite inlines `import.meta.env.VITE_*` values at build time as static string replacements. If a variable is present in `.env.local` but not passed to the CI build step, the production bundle receives `undefined` for that value. This creates bugs that only manifest in production: local works but production breaks, missing optional values silently fail, and secret propagation is a manual multi-step process with no automated check.

### Reusable Pattern

- **Single source of truth:** Treat `.env.example` as the canonical list of all `VITE_*` variables. Every variable listed there must exist in three places: `.env.example` (documentation), `.env.local` (local development), and GitHub repository secrets (CI builds).
- **Explicit workflow mapping:** In the CI workflow's build step, explicitly map every `VITE_*` variable from secrets to environment, including optional ones.
- **New variable checklist:** When adding a new `VITE_*` variable: (1) add to `.env.example`, (2) add real value to `.env.local`, (3) create GitHub repository secret, (4) map the secret in the workflow `env:` block.
- **GitHub secrets for all VITE_ values:** Even non-sensitive identifiers like project IDs should be stored as repository secrets for consistency.

### Risk and Rollout Notes

- **No build-time validation:** Vite does not error on missing `VITE_*` values. A CI check or runtime startup validation is the only way to catch gaps.
- **Secret rotation:** When rotating credentials, both `.env.local` and GitHub secrets must be updated. Forgetting the GitHub secret causes the next production build to ship with stale or empty values.
- **Debugging difficulty:** Because values are inlined at build time, inspecting the production bundle is the only way to confirm what values were actually baked in.
