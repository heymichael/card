---
name: brand-guidelines
description: Apply Haderach brand colors, typography, and token conventions when generating or modifying UI code. Use when creating components, styling elements, choosing colors, or working with the design system.
---

# Haderach Brand Guidelines

## Token Architecture

Haderach uses a two-tier Tailwind v4 token system. All tokens are defined in CSS `@theme` blocks — no JS config files.

### Tier 1: Platform chrome (shared-ui)

Defined in `@haderach/shared-ui/theme` (from `haderach-home` repo). These style the global UI shell (nav, tooltips, dropdowns) and are **identical across all apps**. Never redefine these in app-level `@theme` blocks.

| Token | Tailwind class | Purpose |
|-------|---------------|---------|
| `--color-chrome-bg` | `bg-chrome-bg` | Nav/popover background |
| `--color-chrome-border` | `border-chrome-border` | Nav and dropdown borders |
| `--color-chrome-text` | `text-chrome-text` | Default nav text |
| `--color-chrome-text-strong` | `text-chrome-text-strong` | Tooltip text, button labels |
| `--color-chrome-text-hover` | `text-chrome-text-hover` | Hover/active text |
| `--color-chrome-text-muted` | `text-chrome-text-muted` | Secondary nav text |
| `--color-chrome-subtle` | `bg-chrome-subtle` | Subtle hover backgrounds |
| `--color-chrome-hover` | `bg-chrome-hover` | Hover/tooltip backgrounds |
| `--color-chrome-avatar` | `bg-chrome-avatar` | Avatar fallback circle |

### Tier 2: App tokens (this app)

Defined in `src/index.css` `@theme` block. Card uses a warm cream/gold palette with hex values. Tokens follow a semantic naming convention: `{category}.{scope}.{property}`.

**Surfaces:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-surface-app-bg` | `bg-surface-app-bg` | `#ffffff` |
| `--color-surface-panel-bg` | `bg-surface-panel-bg` | `#ffffff` |
| `--color-surface-control-muted` | `bg-surface-control-muted` | `#f7f4f0` |
| `--color-surface-control-hover-subtle` | `bg-surface-control-hover-subtle` | `#e9e5d8` |
| `--color-surface-canvas-stage-area` | `bg-surface-canvas-stage-area` | `#ffffff` |

**Text:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-text-app-default` | `text-text-app-default` | `#696864` |
| `--color-text-panel-title` | `text-text-panel-title` | `#45413b` |
| `--color-text-panel-label` | `text-text-panel-label` | `#696864` |
| `--color-text-control-default` | `text-text-control-default` | `#696864` |
| `--color-text-interactive-active` | `text-text-interactive-active` | `#988c52` |
| `--color-text-muted-code` | `text-text-muted-code` | `#696864` |
| `--color-text-hint` | `text-text-hint` | `#9d9d9d` |

**Borders:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-border-panel-default` | `border-border-panel-default` | `#deddd5` |
| `--color-border-control-default` | `border-border-control-default` | `#deddd5` |
| `--color-border-control-hover` | `border-border-control-hover` | `#9d9d9d` |
| `--color-border-hint` | `border-border-hint` | `#deddd5` |
| `--color-divider-default` | `border-divider-default` | `#deddd5` |

**Accent / interactive:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-accent-interactive-primary` | `bg-accent-interactive-primary` | `#cba85a` (gold) |
| `--color-accent-interactive-soft-hover` | `bg-accent-interactive-soft-hover` | `#e9e5d8` |
| `--color-accent-interactive-soft-active` | `bg-accent-interactive-soft-active` | `#f3eec5` |
| `--color-focus-ring-primary` | `ring-focus-ring-primary` | `rgba(203, 168, 90, 0.18)` |

**Buttons:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-button-primary-text` | `text-button-primary-text` | `#0f0f0f` |
| `--color-button-primary-bg-hover` | `bg-button-primary-bg-hover` | `#988c52` |
| `--color-button-primary-bg-active` | `bg-button-primary-bg-active` | `#696864` |

**Auth:**

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `--color-auth-card-bg` | `bg-auth-card-bg` | `#ffffff` |
| `--color-auth-card-border` | `border-auth-card-border` | `#deddd5` |
| `--color-auth-card-shadow` | — | `rgba(15, 15, 15, 0.08)` |
| `--color-auth-button-bg` | `bg-auth-button-bg` | `#cba85a` |
| `--color-auth-button-text` | `text-auth-button-text` | `#0f0f0f` |
| `--color-auth-error` | `text-auth-error` | `#a9442a` |

### Canvas tokens (JS only)

`src/theme/colors.ts` exports constants for Konva canvas rendering. These cannot use CSS variables.

```typescript
COLOR_TOKENS.cardBackgroundDefault   // #F3EEC5
COLOR_TOKENS.cardTextHeadlineDefault // #45413B
COLOR_TOKENS.cardTextMessageDefault  // #696864
COLOR_TOKENS.cardBorderPreview       // #9D9D9D
COLOR_TOKENS.cardGuidesStroke        // rgba(239, 62, 54, 0.4)
COLOR_TOKENS.cardSelectionStroke     // #CBA85A
```

## Typography

All apps use **Geist Sans** as the sole typeface. Font files are loaded by `@haderach/shared-ui/theme`.

```
--font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, sans-serif;
```

Weights available: 400 (regular), 500 (medium), 600 (semibold).

## Color System

- Card uses **hex** values (not oklch) for its app tokens — this is intentional for the warm cream/gold palette.
- The gold accent (`#cba85a`) is the primary interactive color.
- `check-color-tokens.mjs` enforces no raw color literals in source files (except `src/index.css` and `src/theme/colors.ts`).
- `design-tokens/colors.json` is the semantic reference document for the token vocabulary.

## Rules

1. **Always use Tailwind token classes** (`bg-surface-app-bg`, `text-text-panel-title`, `border-border-control-default`) or `var(--color-*)` references. Never use raw hex/rgba in components.
2. **Never redefine `chrome-*` tokens** in `src/index.css`. They are owned by shared-ui.
3. **Use shared-ui components** (Button, Input, Card, etc.) from `@haderach/shared-ui` for standard UI elements.
4. **Canvas rendering** uses `COLOR_TOKENS` from `src/theme/colors.ts` — these are the only place raw color literals are allowed.
5. **GlobalNav is self-contained** — it uses only chrome tokens. Do not pass app-level token classes to it.
6. **Run `node check-color-tokens.mjs`** after changes to verify no raw color literals leaked in.

## Source of Truth

- Platform chrome tokens: `@haderach/shared-ui/theme` (owned by `haderach-home` repo)
- App tokens: `src/index.css` `@theme` block
- Canvas tokens: `src/theme/colors.ts`
- Token reference: `design-tokens/colors.json`
- Shared components: `@haderach/shared-ui` (imported via `file:` protocol)
