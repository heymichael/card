Todo: card

Open items

1. [Med] Standardize technical documentation (API reference, generation, docs site integration)
2. [Med] Add tests and testing framework
3. [Med] Add authentication
4. [Med] Add analytics
5. [Med] Add contract versioning protocol docs alignment with platform (post-first-deploy)

Completed items

- [2026-03-10] Create and store Phase 2 onboarding prompt for card app platform integration (PR #1)

---

### 1. [Med] Standardize technical documentation (API reference, generation, docs site integration)

**Purpose:** Define a standard for technical documentation so the card app (and template) have consistent, engineer-friendly API docs. Today `documentation.html` uses a good content format (API reference layout, function signatures, file-based organization, tags, props/state tables) but is hand-maintained standalone HTML with no search, sidebar, or deep links. Standardize so docs either are generated from source (TypeDoc/JSDoc) or are integrated into a docs framework with search, sidebar, and deep links.

**Approach:**

- **Content standard (keep):** API reference layout (Field | Type | Description), function signatures with typed params and short descriptions, file-based sections, tags (interface, type alias, function component), props/state tables—align with TypeDoc/JSDoc/Storybook-style expectations.
- **Delivery standard (improve):** Decide and document: (a) generate from source (e.g. TypeDoc/JSDoc) so API docs stay in sync, or (b) keep hand-written but integrate into a docs framework (Docusaurus, MkDocs, Storybook, or existing docs shell) with search, sidebar, and deep links to symbols.
- Document the standard in learnings or architecture; apply to `documentation.html` / card app; propose template change for the canonical app template.

### 2. [Med] Add tests and testing framework

**Purpose:** Introduce a testing framework and tests for the card app so behavior is validated automatically and regressions are caught in CI.

**Approach:** Choose and add a testing framework (e.g. unit/component tests and optionally e2e). Wire tests into the existing CI workflow; document test layout and how to run tests in README/architecture.

### 3. [Med] Add authentication

**Purpose:** Enable authenticated access to the card app (and optionally docs) so only authorized users can use the app.

**Approach:** Decide auth mechanism (e.g. Firebase Auth, IAP, platform SSO). Implement sign-in/sign-out, gate app entry and/or docs as needed, document auth flow and any secrets/env in architecture or deploy notes.

### 4. [Med] Add analytics

**Purpose:** Capture usage analytics (e.g. page views, feature usage) to inform product and prioritization decisions.

**Approach:** Choose an analytics solution (e.g. Firebase Analytics, GA, or platform-provided). Integrate with the app and any docs routes; document what is collected and how to configure/disable in docs or privacy notes.

### 5. [Med] Add contract versioning protocol docs alignment with platform (post-first-deploy)

**Purpose:** Document how app manifest contract versions evolve over time so app/platform behavior is explicit when moving beyond `platform_contract_version: "v1"`, while deferring implementation details until after the first successful deploy.

**Approach:** After first deploy, update platform `docs/architecture.md` with a Contract Versioning Protocol section (breaking vs non-breaking changes, bump process, compatibility guarantees, and deprecation window), then add a concise pointer in this app repo's `docs/architecture.md`/`README.md` to that platform-owned protocol as the source of truth.
