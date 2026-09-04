import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { postSignInDestination, DEFAULT_SIGNIN_DEST } from './post-signin'

/**
 * The bug: a real sign-in email carried `next=/dashboard`, a route deleted
 * months earlier, so clicking the link landed on a 404 with the session
 * already established. Our own architecture doc told the operator to put it
 * there, and no deploy can reach a link already sitting in an inbox.
 */
test('a retired route lands somewhere useful instead of a 404', () => {
  assert.equal(postSignInDestination('/dashboard'), DEFAULT_SIGNIN_DEST)
  assert.equal(postSignInDestination('/app'), DEFAULT_SIGNIN_DEST)
  assert.equal(postSignInDestination('/extension'), '/extension/connect')
})

test('a route that exists is honoured, query and fragment intact', () => {
  assert.equal(postSignInDestination('/check'), '/check')
  assert.equal(postSignInDestination('/settings'), '/settings')
  assert.equal(postSignInDestination('/check?upgraded=true'), '/check?upgraded=true')
})

test('a trailing slash does not turn a real route into a fallback', () => {
  assert.equal(postSignInDestination('/check/'), '/check/')
})

test('an unknown route falls back rather than 404s', () => {
  assert.equal(postSignInDestination('/nope'), DEFAULT_SIGNIN_DEST)
  assert.equal(postSignInDestination('/check/deeper'), DEFAULT_SIGNIN_DEST)
})

// ---------------------------------------------------------------------------
// Open redirect. `next` is attacker-editable and was previously returned
// verbatim into NextResponse.redirect.
// ---------------------------------------------------------------------------

test('nothing can send a freshly signed-in user off the site', () => {
  for (const hostile of [
    'https://evil.example.com/steal',
    '//evil.example.com/steal',
    'http://evil.example.com',
    '/\\evil.example.com',
    '\\\\evil.example.com',
    'javascript:alert(1)',
    '',
  ]) {
    assert.equal(
      postSignInDestination(hostile),
      DEFAULT_SIGNIN_DEST,
      `${JSON.stringify(hostile)} escaped the allow list`
    )
  }
})

test('null and undefined are the default, not a crash', () => {
  assert.equal(postSignInDestination(null), DEFAULT_SIGNIN_DEST)
  assert.equal(postSignInDestination(undefined), DEFAULT_SIGNIN_DEST)
})

test('every allowed destination is a real route', () => {
  // Guards the list against the exact rot that caused this: a route is
  // deleted and the allow list keeps pointing at it.
  for (const dest of ['/check', '/detector', '/history', '/settings', '/prompt-improver']) {
    const seg = dest.slice(1)
    const candidates = [
      `src/app/${seg}/page.tsx`,
      `src/app/(app)/${seg}/page.tsx`,
      `src/app/(marketing)/${seg}/page.tsx`,
    ]
    assert.ok(
      candidates.some(p => existsSync(p)),
      `${dest} is in the allow list but has no page. This is how /dashboard happened.`
    )
  }
})
