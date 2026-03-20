import { doc, getDoc, getFirestore } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'

const APP_ID = 'card'

const APP_GRANTING_ROLES: Record<string, string[]> = {
  card: ['admin', 'member', 'card_member'],
  stocks: ['admin', 'member', 'stocks_member'],
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function fetchUserRoles(app: FirebaseApp, email: string): Promise<string[]> {
  try {
    const db = getFirestore(app)
    const snap = await getDoc(doc(db, 'users', normalizeEmail(email)))
    if (!snap.exists()) {
      return []
    }
    const data = snap.data()
    return Array.isArray(data.roles) ? data.roles : []
  } catch {
    return []
  }
}

export function hasAppAccess(userRoles: string[], appId: string = APP_ID): boolean {
  const grantingRoles = APP_GRANTING_ROLES[appId] ?? []
  return userRoles.some((role) => grantingRoles.includes(role))
}
