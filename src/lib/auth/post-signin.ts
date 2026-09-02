/**
 * Where to land after sign-in: /check, the checker inside the app, for
 * everybody.
 *
 * An explicit destination (?redirectTo= / ?next=) still always wins.
 *
 * This used to send returning users to /dashboard and brand-new users to
 * /extension. Both were wrong once the checker became the product. A new
 * account was pointed at a frozen browser extension as its first experience,
 * and a returning one at a stats page, when the reason anyone signs up is to
 * keep checking and the checks-left count lives on the checker itself.
 *
 * There is no longer a new-user branch. There is one product, so there is one
 * destination. It is /check rather than / because / renders the marketing
 * layout, and landing a signed-in user there gives them a page with no way
 * back into their own account's navigation.
 */

export const DEFAULT_SIGNIN_DEST = '/check'

export function postSignInDestination(requested: string): string {
  return requested
}
