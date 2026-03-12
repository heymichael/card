import { getAnalytics, logEvent, setUserId, type Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'

let analytics: Analytics | null = null
const isDev = import.meta.env.DEV || import.meta.env.VITE_AUTH_BYPASS === 'true'
const firedEvents = new Set<string>()

function devLog(action: string, eventName: string, params?: Record<string, string>): void {
  const detail = params ? ` ${JSON.stringify(params)}` : ''
  console.log(`[analytics] ${action}: ${eventName}${detail}`)
}

export function initAnalytics(app: FirebaseApp): void {
  if (isDev) {
    console.log('[analytics] dev mode — events will be logged to console only')
    return
  }
  analytics = getAnalytics(app)
}

export function setAnalyticsUser(uid: string): void {
  if (isDev) {
    devLog('setUserId', uid)
    return
  }
  if (!analytics) return
  setUserId(analytics, uid)
}

function trackOnce(eventName: string, params?: Record<string, string>): void {
  if (firedEvents.has(eventName)) {
    if (isDev) devLog('skipped (dedup)', eventName, params)
    return
  }
  firedEvents.add(eventName)
  if (isDev) {
    devLog('event', eventName, params)
    return
  }
  if (!analytics) return
  logEvent(analytics, eventName, params)
}

function trackAlways(eventName: string, params?: Record<string, string>): void {
  if (isDev) {
    devLog('event', eventName, params)
    return
  }
  if (!analytics) return
  logEvent(analytics, eventName, params)
}

// ── Auth events ──

export function trackSignInClicked(): void {
  trackOnce('sign_in_clicked')
}

export function trackSignInSucceeded(): void {
  trackOnce('sign_in_succeeded')
}

export function trackSignInDenied(email: string): void {
  trackOnce('sign_in_denied', { email })
}

export function trackSignInFailed(error: string): void {
  trackOnce('sign_in_failed', { error })
}

export function trackSignOutClicked(): void {
  trackOnce('sign_out_clicked')
}

// ── Feature events ──

export function trackPhotoAdded(): void {
  trackOnce('photo_added')
}

export function trackPhotoRemoved(): void {
  trackOnce('photo_removed')
}

export function trackBgColorChanged(color: string): void {
  trackOnce('bg_color_changed', { color })
}

export function trackHeadlineTextEdited(): void {
  trackOnce('headline_text_edited')
}

export function trackMessageTextEdited(): void {
  trackOnce('message_text_edited')
}

export function trackFontSizeChanged(block: string): void {
  trackOnce('font_size_changed', { block })
}

export function trackFontFamilyChanged(block: string, font: string): void {
  trackOnce('font_family_changed', { block, font })
}

export function trackTextColorChanged(block: string): void {
  trackOnce('text_color_changed', { block })
}

export function trackTextAlignmentChanged(block: string, alignment: string): void {
  trackOnce('text_alignment_changed', { block, alignment })
}

export function trackElementRepositioned(element: string): void {
  trackOnce('element_repositioned', { element })
}

export function trackPhotoResized(): void {
  trackOnce('photo_resized')
}

export function trackSafeMarginsToggled(state: string): void {
  trackOnce('safe_margins_toggled', { state })
}

export function trackPositionsReset(): void {
  trackOnce('positions_reset')
}

export function trackTextBlockSwitched(block: string): void {
  trackOnce('text_block_switched', { block })
}

// ── Conversion events ──

export function trackCardExported(headlineText: string, messageText: string): void {
  trackAlways('card_exported', {
    headline_text: headlineText.slice(0, 100),
    message_text: messageText.slice(0, 100),
  })
}

export function trackCardConversion(headlineText: string, messageText: string): void {
  trackOnce('card_conversion', {
    headline_text: headlineText.slice(0, 100),
    message_text: messageText.slice(0, 100),
  })
}
