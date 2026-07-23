// Deepclario extension - background service worker.
//
// The content script can't reliably make the cross-origin request itself
// (page CSP / CORS), so it delegates to here. The worker has
// host_permissions for deepclario.com, so this fetch is unrestricted.

const API_BASE = 'https://deepclario.com'
const SHARPEN_URL = API_BASE + '/api/anon/sharpen'
const FORK_URL = API_BASE + '/api/anon/fork'
const EXPLAIN_URL = API_BASE + '/api/anon/explain'
const IMAGE_PLAN_URL = API_BASE + '/api/anon/image-plan'
const IMAGE_URL = API_BASE + '/api/anon/image-improve'

// Sign-in handoff from the website.
//
// The connect page, once the user clicks Approve, sends the fresh token
// straight here - so the flow is "click Approve, you're in" rather than
// "copy a code, find the box, paste it". The manual code path still exists
// as the fallback for anyone this cannot reach (locked-down browsers, a
// different profile, the page failing to see the extension).
//
// Only deepclario.com can reach this listener: externally_connectable in
// the manifest is the real gate, and Chrome fills in sender.origin itself
// so a page cannot lie about who it is. We re-check the origin anyway
// rather than trust the manifest alone - this hands over a credential, and
// one wrong entry in that matches list should not be the only thing
// standing between a hostile page and the user's account.
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_CONNECT') return

  if (sender.origin !== API_BASE) {
    sendResponse({ ok: false, error: 'bad_origin' })
    return
  }

  const token = typeof msg.token === 'string' ? msg.token.trim() : ''
  if (!token.startsWith('dc_')) {
    sendResponse({ ok: false, error: 'bad_token' })
    return
  }

  // Tier is left for the server to confirm on the next call. Storing what
  // the page claimed would let a stale page assert "pro".
  chrome.storage.local.set({ dc_token: token, dc_tier: 'free' }, () => {
    sendResponse({ ok: true })
  })

  return true
})

// The page asks this before showing its buttons, to find out whether the
// extension is installed and can be handed a token directly. No answer
// (extension missing, or too old to know this message) means the page shows
// the manual code instead - the fallback must be what happens by default
// when anything here is uncertain.
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_PING') return
  if (sender.origin !== API_BASE) return
  sendResponse({ ok: true, version: chrome.runtime.getManifest().version })
})

// Explain a sharpen that already happened. Produces no rewrite and asks no
// question - it is purely "here is what was weak, here is what changed, and
// here is what I could not fix for you". Costs no quota.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_EXPLAIN') return

  const headers = { 'Content-Type': 'application/json' }
  if (msg.token) headers['Authorization'] = 'Bearer ' + msg.token

  fetch(EXPLAIN_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      original: msg.original,
      sharpened: msg.sharpened,
      // When present, the server folds these answers into the prompt and
      // returns the improved version instead of a fresh analysis.
      answers: msg.answers || undefined,
    }),
  })
    .then(async res => {
      if (!res.ok) {
        sendResponse({ ok: false, error: res.status === 429 ? 'rate_limited' : 'server_error' })
        return
      }
      sendResponse({ ok: true, data: await res.json() })
    })
    .catch(() => sendResponse({ ok: false, error: 'network' }))

  return true
})

// Quick fork check, fired in PARALLEL with the sharpen stream. If the
// prompt is genuinely ambiguous, the content script shows the question as
// inline chips right after the rewrite lands - so the user gets the
// clarifying question at the moment it matters, without paying its latency
// on every prompt. Costs no quota.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_FORK') return

  const headers = { 'Content-Type': 'application/json' }
  if (msg.token) headers['Authorization'] = 'Bearer ' + msg.token

  fetch(FORK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: msg.prompt }),
  })
    .then(res => (res.ok ? res.json() : { question: '', options: [] }))
    .then(data => sendResponse({ ok: true, data }))
    .catch(() => sendResponse({ ok: false }))

  return true
})

// Image feature, ask stage. Mirrors DEEPCLARIO_FORK: a single JSON call that
// returns the plan (detected style, the pivotal question, refinements, or a
// decline). Costs no quota. Fired only when the user clicks the image action.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_IMAGE_PLAN') return

  const headers = { 'Content-Type': 'application/json' }
  if (msg.token) headers['Authorization'] = 'Bearer ' + msg.token

  fetch(IMAGE_PLAN_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: msg.prompt }),
  })
    .then(res => (res.ok ? res.json() : null))
    .then(data => sendResponse({ ok: !!data, data }))
    .catch(() => sendResponse({ ok: false }))

  return true
})

// Image feature, rewrite stage. Same Port/streaming contract as
// DEEPCLARIO_SHARPEN - deltas pipe into the box live, headroom rides on
// X-Improvements-Left, errors map the same status codes.
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'DEEPCLARIO_IMAGE') return

  port.onMessage.addListener(async msg => {
    if (msg?.type !== 'START') return

    const headers = { 'Content-Type': 'application/json' }
    if (msg.token) headers['Authorization'] = 'Bearer ' + msg.token

    try {
      const res = await fetch(IMAGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: msg.prompt,
          styleFamily: msg.styleFamily || undefined,
          answers: msg.answers || undefined,
          source: 'extension',
        }),
      })

      if (!res.ok) {
        let error = 'server_error'
        let resetAt = null
        if (res.status === 429) error = 'rate_limited'
        else if (res.status === 402) {
          const body = await res.json().catch(() => ({}))
          error = body.error === 'pro_required' ? 'pro_required' : 'quota'
          resetAt = body.resetAt || null
        } else if (res.status === 400) {
          const body = await res.json().catch(() => ({}))
          if (body.error) error = body.error
        }
        port.postMessage({ type: 'ERROR', error, status: res.status, resetAt })
        return
      }

      const leftHeader = res.headers.get('X-Improvements-Left')
      port.postMessage({ type: 'META', left: leftHeader === null ? null : parseInt(leftHeader, 10) })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) port.postMessage({ type: 'DELTA', text: chunk })
      }
      port.postMessage({ type: 'DONE' })
    } catch {
      port.postMessage({ type: 'ERROR', error: 'network' })
    }
  })
})

// Fast-path streaming sharpen. The content script owns a Port; we pipe
// text deltas over it as they arrive so the prompt box fills in live.
// This is the extension's default action - the heavy analyze pipeline
// (below) is only used for the "see why" panel and fork questions.
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'DEEPCLARIO_SHARPEN') return

  port.onMessage.addListener(async msg => {
    if (msg?.type !== 'START') return

    const headers = { 'Content-Type': 'application/json' }
    if (msg.token) headers['Authorization'] = 'Bearer ' + msg.token

    try {
      const res = await fetch(SHARPEN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: msg.prompt,
          tone: msg.tone || 'professional',
          source: 'extension',
          choice: msg.choice || undefined,
        }),
      })

      if (!res.ok) {
        let error = 'server_error'
        let resetAt = null
        if (res.status === 429) error = 'rate_limited'
        else if (res.status === 402) {
          const body = await res.json().catch(() => ({}))
          error = body.error === 'pro_required' ? 'pro_required' : 'quota'
          // Carry WHEN it comes back, so the user gets a wait, not a wall.
          resetAt = body.resetAt || null
        } else if (res.status === 400) {
          // The server tells us exactly what was wrong with the input. We used
          // to throw that away and report 'server_error', so a user-side
          // problem ("your prompt is too long") was blamed on our service.
          const body = await res.json().catch(() => ({}))
          if (body.error) error = body.error
        }
        port.postMessage({ type: 'ERROR', error, status: res.status, resetAt })
        return
      }

      // How many improvements are left after this one. -1 = unlimited (Pro).
      // Missing header -> null -> the content script says nothing at all.
      const leftHeader = res.headers.get('X-Improvements-Left')
      port.postMessage({
        type: 'META',
        left: leftHeader === null ? null : parseInt(leftHeader, 10),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) port.postMessage({ type: 'DELTA', text: chunk })
      }
      port.postMessage({ type: 'DONE' })
    } catch {
      port.postMessage({ type: 'ERROR', error: 'network' })
    }
  })
})

// The old DEEPCLARIO_ANALYZE handler is gone. The extension no longer calls
// the heavy analyze pipeline: it asks its clarifying question inline BEFORE
// the rewrite (fork), rewrites once (sharpen), and explains afterwards
// (explain). Routing 'why?' through analyze is what made the panel ask a
// SECOND question and produce a competing rewrite.
