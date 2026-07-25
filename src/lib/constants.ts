/**
 * Shared app-wide constants. Keep external URLs here so a listing change
 * is a one-line edit, not a sitewide grep.
 */

/**
 * The published extension's Chrome ID.
 *
 * Not a secret. It is the last path segment of the public store URL, visible
 * to anyone who visits the listing, and it is derived from the signing key so
 * it never changes for a given published extension.
 *
 * It lives here as a plain constant precisely BECAUSE it is not a secret. It
 * spent its life as NEXT_PUBLIC_EXTENSION_ID_STORE, which was never set in
 * production, and the connect page reads that variable to know who to talk to.
 * Unset meant the page had nobody to ask, so it told every user "we could not
 * find the extension" no matter what they had installed - the one-click
 * connect never ran for anyone. A public, permanent value does not belong in
 * an environment variable that fails silently when absent.
 */
export const CHROME_EXTENSION_ID = 'akkjhoehkejonponamhpgjhffbnpogel'

/** Live Chrome Web Store listing for the Deepclario extension. */
export const CHROME_STORE_URL =
  `https://chromewebstore.google.com/detail/deepclario-improve-your-a/${CHROME_EXTENSION_ID}`
