export type AuthSurface = 'app' | 'docs'

const APP_ALLOWED_EMAILS = [
  'michael@haderachi.ai',
  'michael@heretic.fund',
  'mariam@heretic.fund',
  'mariam@heretic.ventures',
  'alexmader@gmail.com',
]

const DOCS_ALLOWED_EMAILS = [
  'michael@haderachi.ai',
  'michael@heretic.fund',
  'mariam@heretic.fund',
  'mariam@heretic.ventures',
  'alexmader@gmail.com',
]

const APP_ALLOWED_DOMAINS = ['haderach.ai']
const DOCS_ALLOWED_DOMAINS = ['haderach.ai']

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

function getPolicy(surface: AuthSurface): { emails: string[]; domains: string[] } {
  if (surface === 'docs') {
    return { emails: DOCS_ALLOWED_EMAILS, domains: DOCS_ALLOWED_DOMAINS }
  }
  return { emails: APP_ALLOWED_EMAILS, domains: APP_ALLOWED_DOMAINS }
}

export function isAuthorizedEmail(email: string | null | undefined, surface: AuthSurface): boolean {
  if (!email) {
    return false
  }
  const normalizedEmail = normalizeValue(email)
  const emailDomain = parseDomain(normalizedEmail)
  if (!emailDomain) {
    return false
  }

  const policy = getPolicy(surface)
  const allowedEmails = new Set(policy.emails.map(normalizeValue))
  const allowedDomains = new Set(policy.domains.map(normalizeValue))

  return allowedEmails.has(normalizedEmail) || allowedDomains.has(emailDomain)
}
