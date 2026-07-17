// Deepclario - toolbar popup.
//
// The one place a user can always get a straight answer to "am I signed in,
// what plan am I on, how many improvements do I have left". Everything else
// in the extension is deliberately quiet and lives in the chat box; this is
// the opposite - you clicked the icon, so you came here to be told.
//
// Rendering strategy: draw from cached storage immediately, then refresh
// from the server and redraw. The popup is ~280px of text; a spinner in it
// would be on screen for less time than it takes to notice, so we show the
// last known truth and correct it a moment later.

const SITE = 'https://deepclario.com'
const LINKS = {
  connect: SITE + '/extension/connect',
  pricing: SITE + '/pricing',
  privacy: SITE + '/privacy',
}
const STATUS_URL = SITE + '/api/anon/status'

// Fallbacks only. The real numbers arrive from storage (written by
// content.js) and from the status endpoint. These cover the one case
// neither has spoken yet: a fresh install where the popup is opened before
// the user has visited a chat page. Keep them in step with ANON_FREE_TRIES
// in content.js and USAGE_DAILY_LIMIT in src/lib/limits.ts.
const ANON_TRIES_FALLBACK = 5
const DAILY_LIMIT_FALLBACK = 10

const IS_MAC = navigator.platform.toLowerCase().includes('mac')
const HOTKEY = IS_MAC ? '⌥I' : 'Alt+I'

const bodyEl = document.getElementById('body')
const footEl = document.getElementById('foot')

const esc = s =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

/** "in about 3 hours" / "in about 20 minutes". Vague on purpose: the exact
 *  minute is noise, and a precise time we might miss by a second is a
 *  promise we do not need to make. */
function whenBack(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  if (!isFinite(ms) || ms <= 0) return 'in a moment'
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `in about ${mins} minute${mins === 1 ? '' : 's'}`
  const hours = Math.round(mins / 60)
  return `in about ${hours} hour${hours === 1 ? '' : 's'}`
}

function render(s) {
  // s: { tier, email, left, dailyLimit, resetAt }
  const tier = s?.tier || 'anon'

  if (tier === 'pro') {
    bodyEl.innerHTML = `
      <div class="who">
        <span class="dot on"></span>
        <span class="email">${esc(s.email || 'Signed in')}</span>
        <span class="badge pro">Pro</span>
      </div>
      <p class="plan"><b>Unlimited</b> improvements. No daily limit.</p>
      <p class="hint">Press <kbd>${HOTKEY}</kbd> in ChatGPT, Claude, or Gemini.</p>
    `
    footEl.innerHTML = `
      <a href="${LINKS.pricing}" target="_blank">Manage plan</a>
      <span class="sp"></span>
      <a href="${LINKS.privacy}" target="_blank">Privacy</a>
    `
    return
  }

  if (tier === 'free') {
    const limit = s.dailyLimit || DAILY_LIMIT_FALLBACK
    const left = Math.max(0, Number(s.left) || 0)
    const pct = Math.round((left / limit) * 100)
    const tone = left === 0 ? 'out' : left <= 2 ? 'low' : ''

    // At zero the honest thing to lead with is when it comes back. A wall
    // with a clock on it is a wait; without one it is a dead end.
    const line =
      left === 0
        ? `<p class="plan">No improvements left.</p>
           <p class="muted">${s.resetAt ? `Your next one is back ${esc(whenBack(s.resetAt))}.` : 'More come back through the day.'}</p>`
        : `<p class="plan"><b>${left} of ${limit}</b> improvements left today</p>
           <p class="muted">They come back through the day, not all at midnight.</p>`

    bodyEl.innerHTML = `
      <div class="who">
        <span class="dot on"></span>
        <span class="email">${esc(s.email || 'Signed in')}</span>
        <span class="badge">Free</span>
      </div>
      ${line}
      <div class="meter"><i class="${tone}" style="width:${pct}%"></i></div>
      <a class="btn primary" href="${LINKS.pricing}" target="_blank" style="margin-top:12px">Get unlimited</a>
    `
    footEl.innerHTML = `
      <a href="${LINKS.privacy}" target="_blank">Privacy</a>
      <span class="sp"></span>
      <a href="${LINKS.pricing}" target="_blank">Pro</a>
    `
    return
  }

  // Anonymous. Do not lead with the ask - lead with the fact that it
  // already works. The sign-in offer is the second line, not the first.
  const tries = Number.isFinite(s?.triesLeft) ? s.triesLeft : null
  const triesLine =
    tries === null
      ? ''
      : tries > 0
        ? `<p class="plan"><b>${tries} free ${tries === 1 ? 'try' : 'tries'}</b> left without an account</p>`
        : `<p class="plan">Free tries used up.</p>`

  bodyEl.innerHTML = `
    <div class="who">
      <span class="dot off"></span>
      <span class="email" style="color:#A8A6A0">Not signed in</span>
    </div>
    ${triesLine}
    <p class="muted">Sign in free for ${esc(s?.dailyLimit || DAILY_LIMIT_FALLBACK)} improvements a day.</p>
    <a class="btn primary" href="${LINKS.connect}" target="_blank" style="margin-top:12px">Sign in - it's free</a>
    <p class="hint">Press <kbd>${HOTKEY}</kbd> in ChatGPT, Claude, or Gemini.</p>
  `
  footEl.innerHTML = `
    <a href="${LINKS.privacy}" target="_blank">Privacy</a>
    <span class="sp"></span>
    <a href="${SITE}" target="_blank">deepclario.com</a>
  `
}

/** Everything we know without asking the network. */
function cached() {
  return new Promise(resolve => {
    try {
      chrome.storage.local.get(
        ['dc_token', 'dc_tier', 'dc_email', 'dc_left', 'dc_anon_count', 'dc_anon_max'],
        v => {
          const max = Number.isFinite(v?.dc_anon_max) ? v.dc_anon_max : ANON_TRIES_FALLBACK
          const used = Number.isFinite(v?.dc_anon_count) ? v.dc_anon_count : 0
          resolve({
            tier: v?.dc_tier || (v?.dc_token ? 'free' : 'anon'),
            email: v?.dc_email || null,
            left: v?.dc_left,
            dailyLimit: DAILY_LIMIT_FALLBACK,
            triesLeft: Math.max(0, max - used),
            token: v?.dc_token || null,
          })
        }
      )
    } catch {
      resolve({ tier: 'anon', triesLeft: ANON_TRIES_FALLBACK, dailyLimit: DAILY_LIMIT_FALLBACK })
    }
  })
}

async function main() {
  const local = await cached()
  render(local)

  // Anonymous users have nothing on the server to ask about - the try count
  // is local by definition. Skip the request entirely.
  if (!local.token) return

  try {
    const res = await fetch(STATUS_URL, {
      headers: { Authorization: 'Bearer ' + local.token },
    })
    if (!res.ok) return
    const s = await res.json()

    // The server is the authority on tier: it is what catches an expired Pro
    // or a revoked token, both of which leave stale storage behind.
    render({ ...s, triesLeft: local.triesLeft })
    try {
      chrome.storage.local.set({
        dc_tier: s.tier,
        dc_email: s.email || null,
        dc_left: typeof s.left === 'number' ? s.left : null,
      })
    } catch {}
  } catch {
    // Offline, or the site is down. The cached view is already on screen and
    // is the best answer we have. Saying "could not reach us" here would be
    // noise about a request the user never asked us to make.
  }
}

main()
