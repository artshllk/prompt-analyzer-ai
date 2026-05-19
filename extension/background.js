// Deepclario extension - background service worker.
//
// The content script can't reliably make the cross-origin request itself
// (page CSP / CORS), so it delegates to here. The worker has
// host_permissions for deepclario.com, so this fetch is unrestricted.

const API_URL = 'https://deepclario.com/api/anon/analyze'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'DEEPCLARIO_ANALYZE') return

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
