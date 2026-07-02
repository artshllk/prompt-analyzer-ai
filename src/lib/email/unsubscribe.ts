import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed one-click unsubscribe links.
 *
 * The link carries user id + scope + HMAC signature, so it works
 * without a session (email clients open links logged out) and cannot
 * be forged to unsubscribe someone else.
 */

export type UnsubscribeScope = 'weekly' | 'tips' | 'all'

function secret(): string | null {
  return process.env.EMAIL_SECRET ?? null
}

export function signUnsubscribe(userId: string, scope: UnsubscribeScope): string | null {
  const key = secret()
  if (!key) return null
  return createHmac('sha256', key).update(`${userId}:${scope}`).digest('hex')
}

export function verifyUnsubscribe(userId: string, scope: UnsubscribeScope, sig: string): boolean {
  const expected = signUnsubscribe(userId, scope)
  if (!expected || sig.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export function unsubscribeUrl(userId: string, scope: UnsubscribeScope): string | null {
  const sig = signUnsubscribe(userId, scope)
  if (!sig) return null
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://deepclario.com'
  return `${base}/api/email/unsubscribe?uid=${userId}&scope=${scope}&sig=${sig}`
}
