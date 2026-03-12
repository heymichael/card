Todo: card

Open items

1. [High] Add analytics
2. [High] Define analytics pre-deploy testing strategy
3. [Med] [BUG] Logout from unauthorized screen does not reset auth state
4. [Med] Create automated authentication testing plan
5. [Low] Standardize technical documentation (API reference, generation, docs site integration)
6. [Low] Add contract versioning protocol docs alignment with platform (post-first-deploy)
7. [Low] Enforce docs source-to-served sync in CI

Completed items

- [2026-03-11] Wire main-branch artifact publish to GCS for platform deployment (PR #5)
- [2026-03-11] Add authentication (PR #4)
- [2026-03-11] Add tests and testing framework (PR #3)
- [2026-03-10] Create and store Phase 2 onboarding prompt for card app platform integration (PR #1)

---

### 1. [High] Add analytics

**Purpose:** Track user engagement and conversion through the card app funnel: page view → sign-in → feature usage → card export. Enable reporting on session engagement, download volume, conversion rate, and feature usage among converters.

**Approach:**

- Use Firebase SDK (`firebase/analytics`). Decision rationale and full strategy documented in `docs/analytics-strategy.md`.
- Initialize `getAnalytics(app)` before the auth gate so pre-login events (page_view, sign_in_clicked) are captured.
- Set `setUserId(analytics, user.uid)` after successful authentication.
- Production only — skip analytics init in local dev and auth-bypass modes.
- Deduplicate feature events once per page load via in-memory Set. Conversion events: `card_exported` fires every time (volume), `card_conversion` fires once per page load (conversion rate).
- Auth events: `sign_in_clicked`, `sign_in_succeeded`, `sign_in_denied` (with `email`), `sign_in_failed` (with `error`), `sign_out_clicked`.
- Feature events: `photo_added`, `photo_removed`, `bg_color_changed` (`color`), `headline_text_edited`, `message_text_edited`, `font_size_changed` (`block`), `font_family_changed` (`block`, `font`), `text_color_changed` (`block`), `text_alignment_changed` (`block`, `alignment`), `element_repositioned` (`element`), `photo_resized`, `safe_margins_toggled` (`state`), `positions_reset`, `text_block_switched` (`block`).
- Conversion events: `card_exported` and `card_conversion` both include `headline_text` and `message_text`.
- Register custom dimensions in GA4 Admin → Custom definitions for any parameters needed in console reports.
- Enable BigQuery export in Firebase Console for raw event-level querying.

### 2. [High] Define analytics pre-deploy testing strategy

**Purpose:** Establish a reliable way to verify analytics events are firing correctly before deploying analytics changes to production, without polluting production data.

**Approach:** Evaluate GA4 DebugView (debug-tagged events visible in real time, excluded from production reports), browser DevTools network inspection (watch `google-analytics.com/g/collect` requests), and one-off production Realtime checks. Document the chosen verification workflow so analytics changes can be validated with confidence pre-deploy.

### 3. [Med] [BUG] Logout from unauthorized screen does not reset auth state

**Purpose:** After signing in with a non-whitelisted account, the user sees the unauthorized screen. Clicking "Sign out" and then "Sign in" should re-open the Google auth popup so the user can try a different account. Instead, it immediately returns to the unauthorized screen without showing the popup, as if the previous session's auth state was not fully cleared.

**Approach:**

- Reproduce in an incognito window: sign in with a non-whitelisted Google account → unauthorized screen → click log out → click log in → observe it skips the Google popup and goes straight back to unauthorized.
- Investigate `AuthGate.tsx` and `docs-auth-gate.js` sign-out handlers to confirm `signOut()` fully clears Firebase auth state before the `onAuthStateChanged` listener re-fires.
- Likely fix: ensure the sign-out completes and the auth state listener correctly transitions to `signed_out` before allowing a new sign-in attempt. May need to guard against the listener firing with stale user state during the sign-out→sign-in transition.

### 4. [Med] Create automated authentication testing plan

**Purpose:** Define a repeatable automated testing strategy for app/docs auth behavior so future auth changes can ship safely with clear CI coverage expectations.

**Approach:** Document auth testing scope across unit, integration, and e2e layers (allowlist match rules, login/unauthorized flows, bypass behavior, and failure states), decide which checks run on PR vs nightly, and map each test area to existing scripts/workflows.

### 5. [Low] Standardize technical documentation (API reference, generation, docs site integration)

**Purpose:** Define a standard for technical documentation so the card app (and template) have consistent, engineer-friendly API docs. Today `documentation.html` uses a good content format (API reference layout, function signatures, file-based organization, tags, props/state tables) but is hand-maintained standalone HTML with no search, sidebar, or deep links. Standardize so docs either are generated from source (TypeDoc/JSDoc) or are integrated into a docs framework with search, sidebar, and deep links.

**Approach:**

- **Content standard (keep):** API reference layout (Field | Type | Description), function signatures with typed params and short descriptions, file-based sections, tags (interface, type alias, function component), props/state tables—align with TypeDoc/JSDoc/Storybook-style expectations.
- **Delivery standard (improve):** Decide and document: (a) generate from source (e.g. TypeDoc/JSDoc) so API docs stay in sync, or (b) keep hand-written but integrate into a docs framework (Docusaurus, MkDocs, Storybook, or existing docs shell) with search, sidebar, and deep links to symbols.
- Document the standard in learnings or architecture; apply to `documentation.html` / card app; propose template change for the canonical app template.

### 6. [Low] Add contract versioning protocol docs alignment with platform (post-first-deploy)

**Purpose:** Document how app manifest contract versions evolve over time so app/platform behavior is explicit when moving beyond `platform_contract_version: "v1"`, while deferring implementation details until after the first successful deploy.

**Approach:** After first deploy, update platform `docs/architecture.md` with a Contract Versioning Protocol section (breaking vs non-breaking changes, bump process, compatibility guarantees, and deprecation window), then add a concise pointer in this app repo's `docs/architecture.md`/`README.md` to that platform-owned protocol as the source of truth.

### 7. [Low] Enforce docs source-to-served sync in CI

**Purpose:** Prevent drift between `docs/` and `hosting/public/docs/` by making the existing generate-and-sync workflow a required CI gate.

**Approach:** Add CI steps that run `python3 scripts/generate_docs_pages.py` and `bash scripts/sync_docs.sh`, then fail if `git diff --exit-code` is non-empty so PRs cannot merge with stale served docs output.
