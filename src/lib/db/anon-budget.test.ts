/**
 * The budget policy: one user action costs one unit.
 *
 *   npx tsx --test src/lib/db/anon-budget.test.ts
 *
 * This is the rule that was wrong in production. consumeAnonRun() ran on
 * every anonymous call with no turn gate, while the quota check three lines
 * below it was correctly gated on the first turn. So a prompt that asked a
 * clarifying question spent two units: one for the question, one for the
 * answer. The ceiling was silently half what it said, and at a cap of 1 no
 * prompt that asked anything could ever complete.
 *
 * The route now asks budgetActionFor() instead of deciding inline, so the
 * rule is a function with a test rather than an if-chain nobody re-reads.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { budgetActionFor, anonDailyCap } from './anon-budget'

/** Replays a conversation and counts what the budget would actually spend. */
function spend(turns: Array<{ signedIn: boolean; turn: number }>) {
  let consumed = 0
  let checked = 0
  for (const t of turns) {
    const action = budgetActionFor(t)
    if (action === 'consume') consumed++
    if (action === 'check') checked++
  }
  return { consumed, checked }
}

test('a prompt that asks a question consumes exactly one unit', () => {
  // The real shape of the bug: turn 0 gets a clarifying question, the user
  // clicks a reading, turn 1 produces the rewrite. One action.
  const flow = spend([
    { signedIn: false, turn: 0 }, // "write about coffee" -> clarifying
    { signedIn: false, turn: 1 }, // clicks a reading -> improved
  ])
  assert.equal(flow.consumed, 1, 'one action must cost exactly one unit')
  assert.equal(flow.checked, 1, 'the later turn still has to respect the ceiling')
})

test('a prompt that needs no question also consumes exactly one', () => {
  const flow = spend([{ signedIn: false, turn: 0 }])
  assert.equal(flow.consumed, 1)
})

test('two separate prompts consume two', () => {
  const flow = spend([
    { signedIn: false, turn: 0 },
    { signedIn: false, turn: 0 },
  ])
  assert.equal(flow.consumed, 2)
})

test('a later turn never spends, however many there are', () => {
  const flow = spend([
    { signedIn: false, turn: 0 },
    { signedIn: false, turn: 1 },
    { signedIn: false, turn: 2 },
    { signedIn: false, turn: 3 },
  ])
  assert.equal(flow.consumed, 1)
  assert.equal(flow.checked, 3, 'they are checked, so this is not a way around the cap')
})

test('a later turn is checked, not ignored', () => {
  // The alternative fix was to skip later turns entirely, which would have
  // made a fabricated priorAnswers array an unlimited free path.
  assert.equal(budgetActionFor({ signedIn: false, turn: 1 }), 'check')
  assert.notEqual(budgetActionFor({ signedIn: false, turn: 1 }), 'skip')
})

test('signed-in callers are never touched by the anonymous ceiling', () => {
  for (const turn of [0, 1, 2]) {
    assert.equal(budgetActionFor({ signedIn: true, turn }), 'skip')
  }
  assert.equal(spend([
    { signedIn: true, turn: 0 },
    { signedIn: true, turn: 1 },
  ]).consumed, 0)
})

test('at a cap of 1, a prompt that asks can still complete', () => {
  // This is the exact scenario from the runbook's cost-guard test, and the
  // one the old code made impossible: turn 0 spent the only unit, then turn 1
  // spent a second one and was refused, so the user got a question they could
  // never answer.
  const cap = 1
  let used = 0
  for (const t of [{ signedIn: false, turn: 0 }, { signedIn: false, turn: 1 }]) {
    const action = budgetActionFor(t)
    if (action === 'consume') used += 1
    const blocked = action === 'consume' ? used > cap : used > cap
    assert.equal(blocked, false, `turn ${t.turn} must not be blocked at cap ${cap}`)
  }
  assert.equal(used, 1)
})

test('the cap default is a real number, not NaN', () => {
  const cap = anonDailyCap()
  assert.ok(Number.isFinite(cap) && cap > 0, `cap was ${cap}`)
})
