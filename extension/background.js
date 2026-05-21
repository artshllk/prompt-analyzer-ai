// Deepclario extension - background service worker.
//
// The content script can't reliably make the cross-origin request itself
// (page CSP / CORS), so it delegates to here. The worker has
// host_permissions for deepclario.com, so this fetch is unrestricted.

const API_URL = 'https://deepclario.com/api/anon/analyze'

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
      tone: 'professional',
      priorAnswers: msg.priorAnswers || [],
      source: 'extension',
    }),
  })
    .then(async res => {
      if (res.status === 429) {
        sendResponse({ ok: false, error: 'rate_limited' })
        return
      }
      if (res.status === 402) {
        // Signed-in free user hit their monthly quota.
        sendResponse({ ok: false, error: 'monthly_limit' })
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
