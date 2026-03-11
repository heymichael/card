# Platform Deploy Handoff — card app

## Artifact Location

- **Bucket:** `gs://haderach-app-artifacts`
- **Path pattern:** `card/versions/<commit-sha>/`
- **Files per version:**
  - `runtime.tar.gz` — compressed Vite build output (static app bundle)
  - `docs.tar.gz` — compressed static docs site
  - `checksums.txt` — SHA-256 checksums for both tarballs
  - `manifest.json` — machine-readable metadata for this version

## Manifest Schema

Each `manifest.json` follows the schema at `docs/artifact-manifest.schema.json` in the card repo.

Example manifest:

```json
{
  "app_id": "card",
  "version": "0.0.0+build.19",
  "commit_sha": "1ba576df0a8c133c129c1c6c89fd45447d476fff",
  "published_at": "2026-03-11T23:04:39.123Z",
  "artifact": {
    "runtime_uri": "gs://haderach-app-artifacts/card/versions/1ba576df.../runtime.tar.gz",
    "docs_uri": "gs://haderach-app-artifacts/card/versions/1ba576df.../docs.tar.gz",
    "checksum_sha256": "<sha256-of-runtime-tarball>"
  },
  "compatibility": {
    "platform_contract_version": "v1"
  }
}
```

## App Identity

- `app_id`: `card`
- Suggested route prefix: `/card/` (app) and `/card/docs/` (docs)

## What to Serve

- **runtime.tar.gz** contents: static files from a Vite build. Extract and serve at the app route prefix.
- **docs.tar.gz** contents: static docs site with shell, tabs, and auth gate. Extract and serve at the docs route prefix.

## Auth Requirements

The deployed app and docs require Firebase Authentication (Google provider, client-side).

### App runtime

Needs these environment variables baked in at build time or injected at serve time:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### Docs runtime

Reads auth config from `window.__CARD_AUTH_RUNTIME__`. The platform must inject a script that sets this global before the docs shell loads. Shape:

```js
window.__CARD_AUTH_RUNTIME__ = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};
```

If this global is missing or malformed, the docs shell fails closed (blocks access).

## Platform Responsibilities

1. **Version selection:** Decide which commit SHA to deploy. Options:
   - Manual input (commit SHA provided to a deploy workflow)
   - Maintain a `channels/prod/manifest.json` pointer in the bucket
   - Event-driven (card repo triggers platform via webhook or repository dispatch)
2. **Download artifacts:** Read `manifest.json` for the selected version, download `runtime.tar.gz` and `docs.tar.gz` from the GCS URIs.
3. **Extract and serve:** Unpack tarballs and host at the appropriate route prefixes.
4. **Inject auth config:** Provide production Firebase config to both app and docs runtimes.
5. **Rollback:** Redeploy a prior version by selecting its commit SHA. All versions are immutable.

## GCS Access

The platform's deploy service account needs `Storage Object Viewer` on `gs://haderach-app-artifacts` to read and download artifacts.

## Publish Cadence

Every merge to `main` in the card repo triggers artifact publication. New versions appear at `card/versions/<new-sha>/` automatically.
