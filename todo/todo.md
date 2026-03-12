Todo: card

Open items

1. [Med] [BUG] Logout from unauthorized screen does not reset auth state
2. [Med] Create automated authentication testing plan
3. [Med] Adopt taskmd for task management, remove priorities pipeline
4. [Low] Standardize technical documentation (API reference, generation, docs site integration)
5. [Low] Add contract versioning protocol docs alignment with platform (post-first-deploy)
6. [Low] Enforce docs source-to-served sync in CI
7. [Low] Add defensive try-catch around analytics initialization

Completed items

- [2026-03-12] Define analytics pre-deploy testing strategy (PR #8)
- [2026-03-12] Add analytics (PR #8)
- [2026-03-11] Wire main-branch artifact publish to GCS for platform deployment (PR #5)
- [2026-03-11] Add authentication (PR #4)
- [2026-03-11] Add tests and testing framework (PR #3)
- [2026-03-10] Create and store Phase 2 onboarding prompt for card app platform integration (PR #1)

---

### 1. [Med] [BUG] Logout from unauthorized screen does not reset auth state

**Purpose:** After signing in with a non-whitelisted account, the user sees the unauthorized screen. Clicking "Sign out" and then "Sign in" should re-open the Google auth popup so the user can try a different account. Instead, it immediately returns to the unauthorized screen without showing the popup, as if the previous session's auth state was not fully cleared.

**Approach:**

- Reproduce in an incognito window: sign in with a non-whitelisted Google account → unauthorized screen → click log out → click log in → observe it skips the Google popup and goes straight back to unauthorized.
- Investigate `AuthGate.tsx` and `docs-auth-gate.js` sign-out handlers to confirm `signOut()` fully clears Firebase auth state before the `onAuthStateChanged` listener re-fires.
- Likely fix: ensure the sign-out completes and the auth state listener correctly transitions to `signed_out` before allowing a new sign-in attempt. May need to guard against the listener firing with stale user state during the sign-out→sign-in transition.

### 2. [Med] Create automated authentication testing plan

**Purpose:** Define a repeatable automated testing strategy for app/docs auth behavior so future auth changes can ship safely with clear CI coverage expectations.

**Approach:** Document auth testing scope across unit, integration, and e2e layers (allowlist match rules, login/unauthorized flows, bypass behavior, and failure states), decide which checks run on PR vs nightly, and map each test area to existing scripts/workflows.

### 3. [Med] Adopt taskmd for task management, remove priorities pipeline

**Purpose:** Replace the manual `todo/todo.md` + generate/sync priorities pipeline with taskmd (one markdown file per task, YAML frontmatter, CLI/web dashboard). This simplifies the repo, removes the regeneration requirement on every todo change, and gives the agent richer per-task context with structured metadata (priority, status, dependencies, effort, tags).

**Approach:**

- Install taskmd (`brew install driangle/tap/taskmd`) and run `taskmd init` in the repo.
- Migrate the open items from `todo/todo.md` into individual task files under `tasks/`.
- Record completed items as done tasks or note them and remove (history lives in git).
- Replace `.cursor/rules/todo-conventions.mdc` with a new rule pointing the agent at `tasks/` with status-based filtering (only read `pending`/`in-progress` tasks for context).
- Remove `docs/priorities/index.html` and `hosting/public/docs/priorities/` (and `hosting/public/card/docs/priorities/`).
- Strip the priorities generation logic from `scripts/generate_docs_pages.py`.
- Remove the "Priorities" tab from `docs-shell.js` and `docs-shell-page.template.html`.
- Update `docs/architecture.md` and `README.md` ASCII trees and references.
- Run sync to clean up hosted copies.
- Delete `todo/todo.md` once migration is verified.

### 4. [Low] Standardize technical documentation (API reference, generation, docs site integration)

**Purpose:** Define a standard for technical documentation so the card app (and template) have consistent, engineer-friendly API docs. Today `documentation.html` uses a good content format (API reference layout, function signatures, file-based organization, tags, props/state tables) but is hand-maintained standalone HTML with no search, sidebar, or deep links. Standardize so docs either are generated from source (TypeDoc/JSDoc) or are integrated into a docs framework with search, sidebar, and deep links.

**Approach:**

- **Content standard (keep):** API reference layout (Field | Type | Description), function signatures with typed params and short descriptions, file-based sections, tags (interface, type alias, function component), props/state tables—align with TypeDoc/JSDoc/Storybook-style expectations.
- **Delivery standard (improve):** Decide and document: (a) generate from source (e.g. TypeDoc/JSDoc) so API docs stay in sync, or (b) keep hand-written but integrate into a docs framework (Docusaurus, MkDocs, Storybook, or existing docs shell) with search, sidebar, and deep links to symbols.
- Document the standard in learnings or architecture; apply to `documentation.html` / card app; propose template change for the canonical app template.

### 5. [Low] Add contract versioning protocol docs alignment with platform (post-first-deploy)

**Purpose:** Document how app manifest contract versions evolve over time so app/platform behavior is explicit when moving beyond `platform_contract_version: "v1"`, while deferring implementation details until after the first successful deploy.

**Approach:** After first deploy, update platform `docs/architecture.md` with a Contract Versioning Protocol section (breaking vs non-breaking changes, bump process, compatibility guarantees, and deprecation window), then add a concise pointer in this app repo's `docs/architecture.md`/`README.md` to that platform-owned protocol as the source of truth.

### 6. [Low] Enforce docs source-to-served sync in CI

**Purpose:** Prevent drift between `docs/` and `hosting/public/docs/` by making the existing generate-and-sync workflow a required CI gate.

**Approach:** Add CI steps that run `python3 scripts/generate_docs_pages.py` and `bash scripts/sync_docs.sh`, then fail if `git diff --exit-code` is non-empty so PRs cannot merge with stale served docs output.

### 7. [Low] Add defensive try-catch around analytics initialization

**Purpose:** `getAnalytics(app)` in `initAnalytics()` currently has no error handling. If it throws (e.g. in a restricted browser context, aggressive privacy settings, or a future SDK change), the error propagates through `getFirebaseAppInstance()` and could disrupt the auth flow. Analytics should degrade gracefully — never block the app.

**Approach:** Wrap the `getAnalytics(app)` call in `src/analytics/analytics.ts` with a try-catch that logs a `console.warn` on failure and leaves the `analytics` variable `null`, so all subsequent `trackOnce`/`trackAlways` calls silently no-op via the existing `if (!analytics) return` guard.
