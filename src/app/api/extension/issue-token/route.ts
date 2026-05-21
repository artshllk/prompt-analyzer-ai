import { NextResponse } from 'next/server'
import { issueTokenForCurrentUser } from '@/lib/db/api-tokens'

/**
 * Issue a new extension token for the signed-in user. The plaintext token
 * is returned exactly once — the page shows it to the user, then it's gone.
 * We store only the SHA-256 hash, so even a full DB dump doesn't grant
 * extension access.
 */
export async function POST() {
  const result = await issueTokenForCurrentUser('Browser extension')
  if (!result) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }
  return NextResponse.json({ token: result.token, tokenId: result.tokenId })
}
