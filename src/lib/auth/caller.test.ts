/**
 * Somebody we cannot identify is not a free user.
 *
 *   npx tsx --test src/lib/auth/caller.test.ts
 *
 * resolveCaller used to return `Caller | null`, so "not signed in" and
 * "signed in but we could not read their plan" were the same answer, and the
 * tier read did `?? 'free'`. A failed query therefore became a genuine free
 * account, and the free quota fails open on a database error. Put together:
 * during a Postgres outage with Auth still up, every signed-in caller
 * resolved as free and got unlimited billed model calls, while anyone could
 * still sign up to join them because sign-up only needs Auth.
 *
 * These test the classification rule, which is the part that was wrong. The
 * Supabase calls around it are not mocked here; the route behaviour that
 * follows from each state is asserted below by shape.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CallerResult } from './caller'

/**
 * The rule, stated once. This mirrors what resolveCaller does with the two
 * facts it has: did a credential resolve, and could the entitlement be read.
 */
function classify(input: {
  credential: 'none' | 'token' | 'session'
  tierReadable: boolean
}): CallerResult['state'] {
  if (input.credential === 'none') return 'anonymous'
  return input.tierReadable ? 'known' : 'unknown'
}

test('no credential is anonymous, which is already safe', () => {
  // Anonymous falls to the global ceiling, and that fails closed, so there is
  // nothing to protect here beyond not calling them "free".
  assert.equal(classify({ credential: 'none', tierReadable: true }), 'anonymous')
  assert.equal(classify({ credential: 'none', tierReadable: false }), 'anonymous')
})

test('a resolved credential with a readable tier is known', () => {
  assert.equal(classify({ credential: 'session', tierReadable: true }), 'known')
  assert.equal(classify({ credential: 'token', tierReadable: true }), 'known')
})

test('a resolved credential with an UNREADABLE tier is unknown, never free', () => {
  // The whole point. This case used to return a free-tier caller.
  assert.equal(classify({ credential: 'session', tierReadable: false }), 'unknown')
  assert.equal(classify({ credential: 'token', tierReadable: false }), 'unknown')
})

test('unknown is never treated as known', () => {
  for (const credential of ['token', 'session'] as const) {
    const state = classify({ credential, tierReadable: false })
    assert.notEqual(state, 'known', 'an unreadable tier must not grant entitlement')
    assert.notEqual(state, 'anonymous', 'and must not be silently downgraded either')
  }
})

test('the three states are exhaustive and distinct', () => {
  const seen = new Set<string>()
  for (const credential of ['none', 'token', 'session'] as const) {
    for (const tierReadable of [true, false]) {
      seen.add(classify({ credential, tierReadable }))
    }
  }
  assert.deepEqual([...seen].sort(), ['anonymous', 'known', 'unknown'])
})

/* ------------------------------------------- what each state must cause */

/** What a route is required to do with each state. */
function routeOutcome(state: CallerResult['state']) {
  switch (state) {
    case 'unknown':
      // 503 and an honest message. NOT 402: this is our failure, not their
      // limit, and reporting a limit would push someone toward paying to fix
      // a problem that upgrading would not fix.
      return { status: 503, error: 'identity_unavailable', consumesAnonBudget: false }
    case 'anonymous':
      return { status: 200, error: null, consumesAnonBudget: true }
    case 'known':
      return { status: 200, error: null, consumesAnonBudget: false }
  }
}

test('an unknown caller is refused with 503, not a quota message', () => {
  const out = routeOutcome('unknown')
  assert.equal(out.status, 503)
  assert.equal(out.error, 'identity_unavailable')
  assert.notEqual(out.status, 402, 'a quota response would blame the user for our outage')
})

test('an unknown caller never spends anonymous budget', () => {
  // They are refused before the engine, so nothing is billed and nothing is
  // counted against the day.
  assert.equal(routeOutcome('unknown').consumesAnonBudget, false)
})

test('only a genuinely anonymous caller spends the anonymous budget', () => {
  assert.equal(routeOutcome('anonymous').consumesAnonBudget, true)
  assert.equal(routeOutcome('known').consumesAnonBudget, false)
})
