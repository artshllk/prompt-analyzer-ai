/**
 * Chrome extension IDs the connect page is allowed to hand a token to.
 *
 * A page can only message an extension by ID, and the ID is derived from
 * the signing key - so the Web Store build and a locally loaded unpacked
 * build have different ones. The page tries each in turn and uses whichever
 * answers, which is what lets the same flow work in development and in
 * production without a build flag.
 *
 * This list is not a security boundary. The real gate is the extension's
 * own `externally_connectable` in the manifest: it decides which origins
 * may talk to it, and Chrome enforces that. Being in this list only means
 * "the page will offer a token to this extension"; the extension still has
 * to be listening, and it only listens to deepclario.com.
 *
 * NEXT_PUBLIC_ because the messaging happens in the browser, on the page.
 * Set NEXT_PUBLIC_EXTENSION_ID_DEV to your unpacked ID (chrome://extensions
 * shows it) to test the flow locally.
 */

import { CHROME_EXTENSION_ID } from './constants'

/**
 * The published Web Store build.
 *
 * Defaults to the real published ID rather than an empty string, and that is
 * the whole fix. This used to be NEXT_PUBLIC_EXTENSION_ID_STORE alone, which
 * was never set in Vercel - so in production this list was empty, the connect
 * page had nobody to ping, and every user was told "we could not find the
 * extension" and pushed to the manual code. The one-click flow the 0.9.0 notes
 * announced had never run for anybody.
 *
 * An empty default is the wrong failure for this: it is indistinguishable from
 * "the user has not installed it", so the bug looked like ordinary behaviour
 * and stayed invisible. The env var is kept as an override for a differently
 * signed build; forgetting it now costs nothing.
 */
const STORE_ID = process.env.NEXT_PUBLIC_EXTENSION_ID_STORE || CHROME_EXTENSION_ID

/**
 * A locally loaded unpacked build, for development.
 *
 * Chrome derives an unpacked extension's ID from its own generated key, so it
 * differs from the store build and differs per machine. There is no sensible
 * default; without this set, testing the connect flow against a locally loaded
 * build will always fall back to the manual code, which is correct rather than
 * broken. chrome://extensions shows the ID.
 */
const DEV_ID = process.env.NEXT_PUBLIC_EXTENSION_ID_DEV || ''

export const EXTENSION_IDS: string[] = [STORE_ID, DEV_ID].filter(Boolean)
