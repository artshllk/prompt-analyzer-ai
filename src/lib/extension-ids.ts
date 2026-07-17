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

/** The published Web Store build. */
const STORE_ID = process.env.NEXT_PUBLIC_EXTENSION_ID_STORE || ''

/** A locally loaded unpacked build, for development. */
const DEV_ID = process.env.NEXT_PUBLIC_EXTENSION_ID_DEV || ''

export const EXTENSION_IDS: string[] = [STORE_ID, DEV_ID].filter(Boolean)
