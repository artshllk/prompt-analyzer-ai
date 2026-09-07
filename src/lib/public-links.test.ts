/**
 * NOTHING PUBLIC MAY LINK TO /check. THE PUBLIC CHECKER IS "/".
 *
 * This has now cost three separate things. /check is the signed-in app view:
 * it is noindex, nofollow, and it 307s signed-out visitors to "/". So a link
 * to it from a public page does two bad things at once. It passes no ranking
 * signal, because the target refuses to be indexed or followed. And it bounces
 * the reader, because nearly everyone reading a blog post is signed out, so
 * they get a redirect instead of the page they clicked.
 *
 * It ate the score post's only outbound link, and all fifteen CheckCTA links,
 * which is the whole checker CTA on the blog.
 *
 * A PAGE-ONLY TEST WOULD NOT HAVE CAUGHT IT. The CheckCTA links lived in a
 * component, not in any page, which is exactly why a grep over src/app/blog
 * reported zero. So this scans components too.
 *
 * Static analysis of the source rather than a rendering test, matching
 * app-shell.test.ts: it is the file contents that decide this, it costs
 * nothing, and it runs in the normal suite with no network and no database.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CHECK_LINK = /href=["']\/check["']/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

/** A page nobody can reach without signing in, or that refuses indexing. */
function isNonPublicPage(src: string, path: string): boolean {
  return (
    path.includes('/(app)/') ||
    path.includes('/(auth)/') ||
    /robots:\s*\{\s*index:\s*false/.test(src)
  )
}

/**
 * The two files allowed to link to /check, both because the link is only ever
 * rendered for someone already signed in, so no crawler and no signed-out
 * reader can follow it.
 *
 * AppShell is the app shell itself: it only renders inside AppFrame, which
 * every route behind auth composes. NavAuthButton renders on marketing pages,
 * but only shows this link in its signed-in branch - which the test below
 * proves rather than trusts.
 */
const AUTH_GATED = [
  'src/components/ui/AppShell.tsx',
  'src/components/marketing/NavAuthButton.tsx',
]

test('no public page links to /check', () => {
  const offenders = walk('src/app').filter(p => {
    const src = readFileSync(p, 'utf8')
    return CHECK_LINK.test(src) && !isNonPublicPage(src, p)
  })
  assert.deepEqual(
    offenders,
    [],
    'these are public and link to /check, which is noindex and redirects ' +
      `signed-out readers. Link to "/" instead: ${offenders.join(', ')}`
  )
})

test('no shared component links to /check unless the link is behind auth', () => {
  const offenders = walk('src/components')
    .filter(p => CHECK_LINK.test(readFileSync(p, 'utf8')))
    .filter(p => !AUTH_GATED.includes(p))
  assert.deepEqual(
    offenders,
    [],
    'these components render on public pages and link to /check. That is the ' +
      `CheckCTA bug again. Link to "/" instead: ${offenders.join(', ')}`
  )
})

test('the NavAuthButton exception still only renders /check when signed in', () => {
  // The exception above is only safe while the link is inside the signed-in
  // branch. If that gate is ever removed, the allow-list would be hiding a
  // real offender, so the exception checks itself.
  const src = readFileSync('src/components/marketing/NavAuthButton.tsx', 'utf8')
  assert.ok(CHECK_LINK.test(src), 'expected NavAuthButton to still link to /check')
  const gate = src.indexOf('if (isSignedIn)')
  assert.ok(gate !== -1, 'NavAuthButton no longer gates on isSignedIn')
  assert.ok(
    src.search(CHECK_LINK) > gate,
    'the /check link is no longer inside the signed-in branch, so signed-out ' +
      'visitors can now reach a page that redirects them'
  )
})

test('the public checker is "/", and it is not noindex', () => {
  // The other half of the rule: the page we send people to instead has to be
  // the indexable one. If / ever became noindex this whole rule would be
  // pointing somewhere just as useless.
  const home = readFileSync('src/app/(marketing)/page.tsx', 'utf8')
  assert.ok(
    !/robots:\s*\{\s*index:\s*false/.test(home),
    '/ is now noindex, so it cannot be the public checker'
  )
})
