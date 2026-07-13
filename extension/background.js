// Deepclario extension - background service worker.
//
// The content script can't reliably make the cross-origin request itself
// (page CSP / CORS), so it delegates to here. The worker has
// host_permissions for deepclario.com, so this fetch is unrestricted.

const API_BASE = 'https://deepclario.com'
const API_URL = API_BASE + '/api/anon/analyze'
const SHARPEN_URL = API_BASE + '/api/anon/sharpen'

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
        }),
      })

      if (!res.ok) {
        let error = 'server_error'
        if (res.status === 429) error = 'rate_limited'
        else if (res.status === 402) {
          const body = await res.json().catch(() => ({}))
          error = body.error === 'pro_required' ? 'pro_required' : 'quota'
        }
        port.postMessage({ type: 'ERROR', error, status: res.status })
        return
      }

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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_ANALYZE') return

  const headers = { 'Content-Type': 'application/json' }
  if (msg.token) {
    // Server validates and falls back to anonymous if invalid - we never
    // need to gatekeep here.
    headers['Authorization'] = 'Bearer ' + msg.token
  }

  fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: msg.prompt,
      tone: msg.tone || 'professional',
      priorAnswers: msg.priorAnswers || [],
      source: 'extension',
      deep: msg.deep === true,
    }),
  })
    .then(async res => {
      if (res.status === 429) {
        sendResponse({ ok: false, error: 'rate_limited' })
        return
      }
      if (res.status === 402) {
        // Two distinct 402s: quota exhausted (rate_limited_quota, with
        // used/limit/windowHours) or Deep Rewrite without Pro
        // (pro_required). Forward the body so the panel can say which.
        const body = await res.json().catch(() => ({}))
        sendResponse({
          ok: false,
          error: body.error === 'pro_required' ? 'pro_required' : 'quota',
          limit: body.limit,
          windowHours: body.windowHours,
        })
        return
      }
      if (!res.ok) {
        sendResponse({ ok: false, error: 'server_error', status: res.status })
        return
      }
      const data = await res.json()
      sendResponse({ ok: true, data })
    })
    .catch(() => sendResponse({ ok: false, error: 'network' }))

  // Keep the message channel open for the async response.
  return true
})
