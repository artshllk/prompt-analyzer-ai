/**
 * Where to land after sign-in.
 *
 * ===================================================================
 * THIS VALIDATES. IT USED TO BE `return requested`.
 * ===================================================================
 *
 * A real user clicked the link in their sign-in email and landed on a 404.
 * The session was established correctly, so clicking "Open app" showed them
 * signed in a moment later, which made it look like a glitch rather than a
 * broken link.
 *
 * The cause was our own documentation. `.claude/architecture/auth.md` told the
 * operator to set the Supabase email template to
 * `{{ .SiteURL }}/auth/callback?...&next=/dashboard`, and /dashboard was
 * deleted when the checker became the product. Every sign-in email sent since
 * then carries a destination that does not exist.
 *
 * The doc is fixed too, but a doc fix does not help: links already sitting in
 * inboxes still say /dashboard, and nothing we deploy reaches them. The only
 * durable fix is here, where the destination is decided.
 *
 * SO `next` IS UNTRUSTED INPUT. It arrives from a URL that anybody can edit
 * and that our own past instructions got wrong. It is validated against the
 * routes that actually exist, and anything else falls back to the checker.
 * That also closes an open redirect: `?next=https://evil.example.com` was
 * previously returned verbatim and handed to `NextResponse.redirect`.
 */

/** The checker inside the app. One product, one destination. */
export const DEFAULT_SIGNIN_DEST = '/check'

/**
 * Destinations a signed-in person can be sent to.
 *
 * Deliberately a list, not a pattern. A regex over "does it start with a
 * slash" would have happily kept sending people to /dashboard, because the
 * problem was never the shape of the string.
 */
const ALLOWED = new Set([
  '/check',
  '/detector',
  '/history',
  '/settings',
  '/playground',
  '/extension/connect',
])

/**
 * Retired routes, mapped rather than refused.
 *
 * Somebody holding an old email should land somewhere useful, not on a
 * fallback that quietly ignores where they were going.
 */
const MOVED: Record<string, string> = {
  '/dashboard': DEFAULT_SIGNIN_DEST,
  '/app': DEFAULT_SIGNIN_DEST,
  '/extension': '/extension/connect',
}

export function postSignInDestination(requested: string | null | undefined): string {
  if (!requested) return DEFAULT_SIGNIN_DEST

  // Reject anything that could leave the site: absolute URLs, protocol
  // relative URLs, and backslash tricks browsers normalise to slashes.
  if (!requested.startsWith('/') || requested.startsWith('//') || requested.includes('\\')) {
    return DEFAULT_SIGNIN_DEST
  }

  // Compare the path only. A query string or fragment is carried through on
  // an allowed route, but never decides whether the route is allowed.
  const path = requested.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (MOVED[path]) return MOVED[path]
  if (ALLOWED.has(path)) return requested
  return DEFAULT_SIGNIN_DEST
}
