import { createHash, randomBytes } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const TOKEN_PREFIX = 'dc_'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Generate a new opaque token. Prefix lets us recognize it visually + scrub
 *  it from logs. ~36 bytes base64 = ~48 chars entropy. */
function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString('base64url')
}

/** Issue a token for the currently-authenticated user. Returns the plaintext
 *  token exactly once - caller must show it to the user immediately, we only
 *  store the hash. */
export async function issueTokenForCurrentUser(label = 'Browser extension'): Promise<
  { token: string; tokenId: string } | null
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const token = generateToken()
  const token_hash = hashToken(token)

  const { data, error } = await supabase
    .from('api_tokens')
    .insert({ user_id: user.id, token_hash, label })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[api-tokens] insert failed:', error)
    return null
  }
  return { token, tokenId: data.id }
}

export interface ValidatedToken {
  userId: string
  tokenId: string
  /**
   * null means we proved who they are and could NOT read their entitlement.
   *
   * It used to be `?? 'free'`, which made a failed read indistinguishable
   * from a genuine free account. During a Postgres outage every caller
   * resolved as free and the free quota fails open, so an outage handed out
   * unlimited billed calls. Somebody we cannot identify is not a free user.
   */
  tier: 'free' | 'pro' | null
}

/** Validate a Bearer token from a public endpoint. Uses the service-role
 *  client because the caller is unauthenticated. Returns null on any
 *  malformed/unknown/revoked token. Updates last_used_at fire-and-forget. */
export async function validateToken(rawToken: string): Promise<ValidatedToken | null> {
  if (!rawToken || !rawToken.startsWith(TOKEN_PREFIX)) return null
  const token_hash = hashToken(rawToken)

  const supabase = await createServiceClient()
  const { data: tokenRow, error } = await supabase
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', token_hash)
    .is('revoked_at', null)
    .maybeSingle()

  if (error || !tokenRow) return null

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', tokenRow.user_id)
    .maybeSingle()

  // Touch last_used_at without blocking the request.
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)
    .then(() => {})

  return {
    userId: tokenRow.user_id,
    tokenId: tokenRow.id,
    // A read error is not a free account. See the note on `tier` above.
    tier: profileErr ? null : ((profile?.tier as 'free' | 'pro') ?? 'free'),
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}
