// Deepclario extension - background service worker.
//
// The content script can't reliably make the cross-origin request itself
// (page CSP / CORS), so it delegates to here. The worker has
// host_permissions for deepclario.com, so this fetch is unrestricted.

const API_BASE = 'https://deepclario.com'
const SHARPEN_URL = API_BASE + '/api/anon/sharpen'
const FORK_URL = API_BASE + '/api/anon/fork'
const EXPLAIN_URL = API_BASE + '/api/anon/explain'

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
