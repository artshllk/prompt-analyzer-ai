/**
 * Where to land after sign-in. An explicit destination (?redirectTo= /
 * ?next=) always wins; otherwise brand-new users go straight to the
 * playground (the fastest path to a first rewrite) and returning users
 * get the dashboard. "New" uses the same one-hour window as the welcome
 * email in src/app/auth/callback/route.ts, so magic links clicked a
 * while after signup still count.
 */

export const DEFAULT_SIGNIN_DEST = '/dashboard'
const NEW_USER_WINDOW_MS = 60 * 60 * 1000

export function postSignInDestination(
  requested: string,
  createdAt: string | null | undefined,
): string {
  if (requested !== DEFAULT_SIGNIN_DEST) return requested
  if (!createdAt) return requested
  const isNew = Date.now() - new Date(createdAt).getTime() < NEW_USER_WINDOW_MS
  return isNew ? '/playground' : requested
}
