# Analytics Strategy

## Purpose

This document captures the analytics architecture decisions, implementation spec, and future evolution paths for the card app. It serves as a reference for understanding what was chosen, why, and what alternatives exist if the analytics solution needs to evolve.

## Analytics Landscape: Firebase Analytics, GA4, gtag.js, and GTM

### Firebase Analytics and GA4 are the same data system

Firebase Analytics and Google Analytics 4 (GA4) share the same underlying data store. When a Firebase project has analytics enabled, a GA4 property is automatically created and linked. Events collected via the Firebase SDK appear in both the Firebase Console and the GA4 Console.

| Aspect | Firebase Console | GA4 Console |
|---|---|---|
| URL | console.firebase.google.com | analytics.google.com |
| Focus | App-centric: events, user properties, retention, A/B testing | Marketing-centric: acquisition, funnels, audiences, attribution |
| Data | Same GA4 property | Same GA4 property |
| Integration | Firebase services (Remote Config, Crashlytics, Cloud Messaging) | Google Ads, Search Console, BigQuery |

Instrumenting once with the Firebase SDK makes the data available in both consoles. There is no need to choose one console over the other — use whichever view is more useful for a given question.

### Four instrumentation options

#### 1. Firebase SDK (`firebase/analytics`)

The Firebase JavaScript SDK includes an analytics module. After calling `initializeApp()`, calling `getAnalytics(app)` activates automatic event collection and exposes `logEvent()` for custom events.

- **When to use:** The app already uses Firebase (auth, hosting, etc.). One SDK, one initialization flow, tight integration with Firebase services.
- **Bundle impact:** ~20–30 KB for the analytics module.
- **Custom events:** `logEvent(analytics, 'event_name', { key: 'value' })`.

#### 2. gtag.js

Google's standalone JavaScript tag for sending data to GA4. A `<script>` tag loads the library with a measurement ID; events are sent via `gtag('event', 'event_name', { key: 'value' })`.

- **When to use:** The app has no Firebase backend. You want analytics without pulling in the Firebase SDK. Also useful for vanilla HTML pages (e.g., a docs shell) that don't use npm.
- **Relationship to Firebase SDK:** Both are on-ramps to the same GA4 property. Using both in the same app sends duplicate events. Choose one.

#### 3. Google Tag Manager (GTM)

A tag management system that sits between the app and third-party services. The app pushes events into a client-side data layer (`dataLayer.push({ event: '...' })`); GTM watches the data layer and routes events to configured destinations (GA4, Google Ads, Facebook Pixel, etc.) based on rules defined in the GTM web interface.

- **When to use:** Multiple third-party analytics/marketing tags need management. Non-developers (e.g., marketing teams) need to add or change tracking without code deploys. Complex trigger rules are needed (e.g., "if A and B happened, send C").
- **Capabilities:** GTM can compose, transform, and conditionally route events. It supports compound triggers, variable transformations, and tag sequencing.
- **Tradeoff:** Adds a layer of indirection. Logic is split between app code (data layer pushes) and the GTM web interface (trigger/tag configuration). For developer-driven apps, keeping all logic in code is simpler and more testable.

#### 4. Measurement Protocol

A REST API for sending events from a backend server to GA4. Used for server-side actions with no browser context (webhooks, cron jobs, backend processes).

- **When to use:** Tracking events that originate server-side, not in a user's browser.
- **Not relevant for:** Client-side web apps like this one.

### All options are client-side (except Measurement Protocol)

Firebase SDK, gtag.js, and GTM all run entirely in the browser. JavaScript sends events from the user's browser directly to Google's collection endpoints. The hosting infrastructure (Firebase Hosting, CDN, custom server) has no effect on analytics collection. Switching to a CDN does not require changing the analytics approach.

## Decision: Firebase SDK

**Chosen approach:** Firebase SDK (`firebase/analytics`).

**Rationale:**

- Firebase is already initialized in the app for authentication. Adding analytics is one additional import and function call.
- Single SDK and single initialization flow. No extra script tags, no separate configuration.
- Tight integration with Firebase services if A/B testing, Remote Config, or Cloud Messaging are added later.
- The app is developer-driven with a small, authenticated user base. GTM's UI-based tag management adds overhead with no benefit. gtag.js would be redundant alongside the existing Firebase SDK.
- Data flows to Firebase Console, GA4 Console, and BigQuery (if enabled) with no additional instrumentation.

**When to reconsider:**

- If the app needs to send events to multiple third-party services simultaneously (e.g., GA4 + Google Ads + a third-party tool), GTM becomes worthwhile.
- If a non-developer team needs to manage tracking rules without code deploys, GTM's web interface is the right tool.
- If the app moves away from Firebase entirely, gtag.js is the standalone alternative.
- If server-side event tracking is needed (e.g., backend processing events), the Measurement Protocol supplements client-side collection.

## Data Flow

```text
logEvent(analytics, 'card_exported', { headline_text: '...' })
        │
        ▼
   Firebase SDK (client-side, in browser)
        │
        ▼
   GA4 Property (G-ZSFF6D5HPB)
        │
        ├──► Firebase Console → Analytics
        ├──► GA4 Console (analytics.google.com)
        └──► BigQuery (if export enabled)
```

All three destinations receive the same data from a single instrumentation point. BigQuery export must be enabled manually in Firebase Console → Project Settings → Integrations → BigQuery.

### Data flow with GTM

If GTM is introduced later, the data flow changes on the ingestion side but not the output side:

```text
Your code
        │
        ▼
   dataLayer.push({ event: 'card_exported', ... })
        │
        ▼
   GTM (client-side, in browser)
        │  ← requires configuring a GA4 tag + triggers in GTM UI
        ▼
   GA4 Property (G-ZSFF6D5HPB)
        │
        ├──► Firebase Console → Analytics  (may show limited data without Firebase SDK)
        ├──► GA4 Console (analytics.google.com)
        └──► BigQuery (if export enabled)
```

Key differences from the Firebase SDK flow:

- **Ingestion requires explicit configuration on both ends.** Your code must push events into the data layer (replacing `logEvent()` calls), and GTM must have a GA4 tag configured with triggers specifying which events to forward. Neither leg is automatic.
- **Output side is unchanged.** Once events reach the GA4 property, downstream delivery to Firebase Console, GA4 Console, and BigQuery works identically regardless of whether events arrived via the Firebase SDK or GTM.
- **Firebase Console integration may degrade.** If the Firebase SDK is no longer used for analytics (replaced by GTM), the Analytics section in the Firebase Console may show limited or no data depending on how the GA4 property link is configured. The GA4 Console and BigQuery are unaffected.

### BigQuery considerations

- **Free:** Export itself has no cost. BigQuery free tier covers 10 GB storage and 1 TB of queries per month.
- **Not retroactive:** Only captures events from the day export is enabled. Enable early.
- **Raw data:** No thresholding or sampling. Every event with all parameters is stored as individual rows.
- **Schema:** Events land in `events_*` (daily) and `events_intraday_*` (streaming) tables with `event_params` as a repeated record of key-value pairs.

## Custom Dimensions Registration

Custom event parameters automatically flow to BigQuery with no configuration. However, to see parameter values in Firebase/GA4 console dashboards (not just event counts), each parameter must be registered as a custom dimension:

**GA4 Console → Admin → Custom definitions → Create custom dimension:**

- Dimension name: human-readable label for reports (e.g., "Export Format")
- Scope: Event (for event parameters) or User (for user properties)
- Event parameter: the exact key from code (e.g., `format`)

**Limits:**

| Type | Free limit |
|---|---|
| Event-scoped custom dimensions (text) | 50 |
| User-scoped custom dimensions (text) | 25 |
| Custom metrics (numeric) | 50 |

Registration is not retroactive in the console — parameter values are only indexed for reports from the registration date forward. BigQuery always has everything regardless of registration.

## Event Specification

### Automatic events (no code required)

These are collected by the Firebase SDK automatically once `getAnalytics(app)` is called:

| Event | Description |
|---|---|
| `page_view` | Every page load |
| `session_start` | New session begins (30-minute inactivity timeout) |
| `first_visit` | First time a user visits |
| `user_engagement` | User has the app in foreground |

### Auth events (once per page load)

Analytics initializes before the auth gate so these pre-login events are captured.

| Event | Parameters |
|---|---|
| `sign_in_clicked` | _(none)_ |
| `sign_in_succeeded` | _(none)_ |
| `sign_in_denied` | `email`: the rejected email address |
| `sign_in_failed` | `error`: the error message |
| `sign_out_clicked` | _(none)_ |

### App feature events (once per page load)

Deduplicated via an in-memory Set that resets on page load. Each event fires at most once per app open, regardless of how many times the user interacts with that control.

| Event | Parameters |
|---|---|
| `photo_added` | _(none)_ |
| `photo_removed` | _(none)_ |
| `bg_color_changed` | `color`: hex value |
| `headline_text_edited` | _(none)_ |
| `message_text_edited` | _(none)_ |
| `font_size_changed` | `block`: headline or message |
| `font_family_changed` | `block`, `font`: the selected font name |
| `text_color_changed` | `block`: headline or message |
| `text_alignment_changed` | `block`, `alignment`: left, center, or right |
| `element_repositioned` | `element`: headline, message, or photo |
| `photo_resized` | _(none)_ |
| `safe_margins_toggled` | `state`: on or off |
| `positions_reset` | _(none)_ |
| `text_block_switched` | `block`: headline or message |

### Conversion events

| Event | Parameters | Dedup |
|---|---|---|
| `card_exported` | `headline_text`, `message_text` | Every time (volume tracking) |
| `card_conversion` | `headline_text`, `message_text` | First export per page load (conversion tracking) |

### User identity

After successful authentication, `setUserId(analytics, user.uid)` links all events (including pre-auth events from the same page load) to the Firebase Auth user ID. Pre-auth events are associated retroactively via the consistent `user_pseudo_id`.

### Environment policy

Analytics initializes in production only. Local development and auth-bypass modes skip `getAnalytics()` entirely to prevent dev/test activity from polluting production data.

## Target Funnel

```text
page_view → sign_in_clicked → sign_in_succeeded → [feature usage] → card_conversion
```

### Key reporting questions

1. **How many sessions engaged the app?** → `session_start` count (automatic).
2. **How many sessions downloaded a card?** → `card_exported` count (volume) or `card_conversion` count (unique sessions).
3. **What features did downloaders use?** → Custom events correlated with sessions that also have `card_exported`.
4. **Conversion rate** → `card_conversion` / `page_view`.

## GA4 Parameter Limits

| Limit | Value |
|---|---|
| Distinct event names per property | 500 |
| Parameters per event | 25 |
| Parameter name length | 40 characters |
| Parameter string value length | 100 characters |
| User properties per property | 25 |

Text exceeding 100 characters is truncated by the SDK before sending.

## Testing Analytics

### Verifying events are firing

- **GA4 DebugView:** Install the Google Analytics Debugger Chrome extension. Debug-tagged events appear in GA4 Console → Admin → DebugView in real time without polluting production reports.
- **Network tab:** In browser DevTools, watch for requests to `google-analytics.com/g/collect`. The request payload contains event names and parameters.
- **GA4 Realtime:** GA4 Console → Realtime shows events from the last 30 minutes. Useful for one-off production verification.

### Processing delays

Standard Firebase/GA4 reports have a 24–48 hour processing delay. The Realtime view shows the last 30 minutes. DebugView is instant.

## Sharing Analytics Data

### Firebase Console access

Project Settings → Users and permissions → Add member with "Viewer" role. Viewers can see all analytics dashboards but cannot modify project settings.

### GA4 Console access

Admin → Account/Property access management → Add user with "Viewer" role. Same data, more powerful exploration tools.

### Looker Studio (for custom dashboards)

Connects to BigQuery. Dashboards can be shared as view-only links (like Google Docs). Viewers don't need BigQuery access. Queries run against the project's BigQuery quota (free tier is sufficient at small scale).

### Scheduled email reports

Both GA4 and Looker Studio support recurring email delivery of report snapshots.

## Future Evolution Paths

### Adding BigQuery export

Enable in Firebase Console → Project Settings → Integrations → BigQuery. No code changes. Enables raw SQL queries over event data with no thresholding. Free at small scale. Enable early since it is not retroactive.

### Adding GTM

If the app later needs multiple analytics/marketing destinations or non-developer tag management:

1. Add the GTM container script to the app's HTML.
2. Replace `logEvent()` calls with `dataLayer.push()` calls.
3. Configure GTM triggers and tags in the GTM web interface to route events to GA4 and other destinations.
4. GTM can compose, transform, and conditionally route events — e.g., "if A and B happened, send C."

### Adding server-side tracking

If backend events need tracking (e.g., server-side card processing):

1. Use the GA4 Measurement Protocol (REST API).
2. Send events via HTTP POST from the backend to GA4's collection endpoint.
3. Requires an API secret configured in GA4 Admin.

### Switching away from Firebase

If Firebase is removed entirely, replace `getAnalytics()` / `logEvent()` with gtag.js. The measurement ID and GA4 property remain the same. Only the client-side instrumentation library changes.
