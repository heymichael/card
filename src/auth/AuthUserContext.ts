import { createContext, useContext } from 'react'
import type { NavApp } from '@haderach/shared-ui'

export interface AuthUser {
  email: string
  photoURL?: string
  displayName?: string
  accessibleApps: NavApp[]
  signOut: () => void
}

export const AuthUserContext = createContext<AuthUser | null>(null)

export function useAuthUser(): AuthUser {
  const ctx = useContext(AuthUserContext)
  if (!ctx) throw new Error('useAuthUser must be used within AuthGate')
  return ctx
}
