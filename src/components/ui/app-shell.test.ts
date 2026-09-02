/**
 * The sidebar must be the same on every route that shows it.
 *
 * TWO SIDEBAR BUGS HAVE NOW COME FROM PAGE-LEVEL ASSUMPTIONS. First, the Check
 * item pointed at "/", which renders the marketing layout, so clicking it took
 * the sidebar away. Then AppShell took `hasHistory` as a prop, so the sidebar's
 * contents depended on what each page happened to fetch, and History silently
 * vanished on /detector because that page composed the shell itself and passed
 * nothing.
 *
 * Both were invisible to types and to the build. Both are caught here.
 *
 * Static analysis of the source rather than a rendering test: it is the file
 * layout that decides these, it costs nothing, and it runs in the normal
 * suite with no network and no database.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const APP = 'src/app'

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (entry === 'page.tsx' || entry === 'layout.tsx') out.push(p)
  }
  return out
}

test('only AppFrame renders AppShell, so the sidebar cannot differ by route', () => {
  // A page that renders AppShell directly has to decide the sidebar's contents
  // itself, and that is exactly how History disappeared on /detector.
  const offenders = walk(APP)
    .filter(p => /<AppShell\b/.test(readFileSync(p, 'utf8')))
  assert.deepEqual(
    offenders,
    [],
    `these render <AppShell> directly and must use <AppFrame>: ${offenders.join(', ')}`
  )
})

test('no route passes hasHistory, because the shell works it out', () => {
  const offenders = walk(APP)
    .filter(p => /hasHistory/.test(readFileSync(p, 'utf8')))
  assert.deepEqual(offenders, [], `hasHistory leaked into: ${offenders.join(', ')}`)
})

test('every sidebar destination renders the sidebar', () => {
  // The first bug: Check pointed at "/", which is in the (marketing) group and
  // renders the top nav, so the sidebar vanished the moment you used it.
  const shell = readFileSync('src/components/ui/AppShell.tsx', 'utf8')
  const routes = [
    ...[...shell.matchAll(/\{ href: "([^"]+)", label: "[^"]+" \}/g)].map(m => m[1]),
    '/settings',
  ]
  assert.ok(routes.length >= 3, 'expected at least Check, Detector and History')

  for (const route of routes) {
    const direct = `${APP}${route}/page.tsx`
    const grouped = `${APP}/(app)${route}/page.tsx`
    const page = existsSync(direct) ? direct : existsSync(grouped) ? grouped : null
    assert.ok(page, `${route} has no page`)

    const inAppGroup = page!.includes('/(app)/')
    const rendersFrame = /<AppFrame\b/.test(readFileSync(page!, 'utf8'))
    assert.ok(
      inAppGroup || rendersFrame,
      `${route} (${page}) renders neither <AppFrame> nor the (app) layout, so ` +
        `clicking it in the sidebar would take the sidebar away`
    )
  }
})
