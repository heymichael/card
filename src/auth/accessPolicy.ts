import { doc, getDoc, getFirestore } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'

interface AllowlistPolicy {
  emails: string[]
  domains: string[]
}

const EMPTY_POLICY: AllowlistPolicy = { emails: [], domains: [] }

function normalizeValue(value: string): string {
  return value.trim().toLowerCase()
}

function parseDomain(email: string): string {
  const atIndex = email.lastIndexOf('@')
  if (atIndex < 0 || atIndex === email.length - 1) {
    return ''
  }
  return email.slice(atIndex + 1).toLowerCase()
}

export async function fetchAllowlist(app: FirebaseApp): Promise<AllowlistPolicy> {
  try {
    const db = getFirestore(app)
    const snap = await getDoc(doc(db, 'allowlists', 'card'))
    if (!snap.exists()) {
      return EMPTY_POLICY
    }
    const data = snap.data()
    const surfaceData = data?.surfaces?.default
    if (!surfaceData) {
      return EMPTY_POLICY
    }
    return {
      emails: Array.isArray(surfaceData.emails) ? surfaceData.emails : [],
      domains: Array.isArray(surfaceData.domains) ? surfaceData.domains : [],
    }
  } catch {
    return EMPTY_POLICY
  }
}

export function isAuthorizedEmail(
  email: string | null | undefined,
  policy: AllowlistPolicy,
): boolean {
  if (!email) {
    return false
  }
  const normalizedEmail = normalizeValue(email)
  const emailDomain = parseDomain(normalizedEmail)
  if (!emailDomain) {
    return false
  }

  const allowedEmails = new Set(policy.emails.map(normalizeValue))
  const allowedDomains = new Set(policy.domains.map(normalizeValue))

  return allowedEmails.has(normalizedEmail) || allowedDomains.has(emailDomain)
}
