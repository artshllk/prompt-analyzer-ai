// Deepclario extension - content script.
//
// Injects a floating "Improve prompt" button on ChatGPT / Claude / Gemini.
// Reads the prompt you're about to send, scores it, asks one clarifying
// question if needed, and gives you an improved rewrite - without leaving
// the page. Everything lives in a Shadow DOM so the host site's CSS can't
// touch it and ours can't leak out.

;(function () {
  if (window.__deepclarioInjected) return
  window.__deepclarioInjected = true

  /* ---------- Read / write the host page's prompt box ---------- */

  const READ_SELECTORS = [
    '#prompt-textarea',                       // ChatGPT (contenteditable or textarea)
    'textarea#prompt-textarea',
    'div.ProseMirror[contenteditable="true"]',// Claude
    'div.ql-editor[contenteditable="true"]',  // Gemini (Quill)
    'rich-textarea textarea',                 // Gemini fallback
    'main [contenteditable="true"]',
    'form textarea',
  ]

  function findPromptEl() {
    for (const sel of READ_SELECTORS) {
      const el = document.querySelector(sel)
      if (el) return el
    }
    return null
  }

  function readPrompt() {
    const el = findPromptEl()
    if (!el) return ''
    const text = 'value' in el && el.value != null ? el.value : el.innerText
    return (text || '').trim()
  }

  function writePrompt(text) {
    const el = findPromptEl()
    if (!el) return false
    try {
      el.focus()
      if ('value' in el && el.tagName === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        ).set
        setter.call(el, text)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      } else {
        // contenteditable (ProseMirror / Quill): select-all + insert
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
        document.execCommand('insertText', false, text)
      }
      return true
    } catch {
      return false
    }
  }

  /* ---------- Shadow DOM UI ---------- */

  const host = document.createElement('div')
  host.id = 'deepclario-host'
  host.style.cssText = 'all: initial;'
  document.documentElement.appendChild(host)
  const root = host.attachShadow({ mode: 'open' })

  // Stop typing/paste events from leaking up to the host page's editor.
  // Claude (ProseMirror), ChatGPT (Lexical), and Gemini (Quill) all have
  // document-level keyboard listeners that swallow keystrokes meant for
  // our panel's textareas — the user types "hello" in our answer field
  // and it lands in Claude's chat input instead.
  //
  // Composed events cross the shadow boundary by default, so we catch
  // them on the host element (after they have already reached their
  // intended target inside the shadow tree) and stop propagation before
  // they reach `document`. We never preventDefault — the textarea has
  // already handled the event by the time it reaches the host.
  const STOP_BUBBLE = [
    'keydown', 'keypress', 'keyup',
    'input', 'beforeinput',
    'paste', 'copy', 'cut',
    'compositionstart', 'compositionupdate', 'compositionend',
  ]
  for (const type of STOP_BUBBLE) {
    host.addEventListener(type, e => e.stopPropagation())
  }

  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
      .fab {
        position: fixed; right: 20px; bottom: 96px; z-index: 2147483646;
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 16px; border-radius: 999px; cursor: pointer;
        background: #F5F4F1; color: #0E0E10; font-size: 13px; font-weight: 600;
        border: none; box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        transition: transform .18s cubic-bezier(.16,1,.3,1), opacity .2s;
      }
      .fab:hover { opacity: .92; }
      .fab:active { transform: scale(.97); }
      .fab .mark { font-size: 14px; }
      .overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(0,0,0,.55); display: none;
      }
      .overlay.open { display: block; }
      .panel {
        position: fixed; top: 0; right: 0; height: 100%;
        width: 440px; max-width: 92vw; background: #0E0E10;
        color: #F5F4F1; border-left: 1px solid rgba(245,244,241,.14);
        transform: translateX(100%); transition: transform .35s cubic-bezier(.16,1,.3,1);
        display: flex; flex-direction: column; overflow-y: auto;
      }
      .overlay.open .panel { transform: translateX(0); }
      .pad { padding: 24px; }
      .row { display: flex; align-items: center; justify-content: space-between; }
      .eyebrow {
        font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
        color: #A8A6A0; font-weight: 500;
      }
      .x {
        background: none; border: none; color: #A8A6A0; cursor: pointer;
        font-size: 20px; line-height: 1; padding: 4px;
      }
      .x:hover { color: #F5F4F1; }
      h2 { font-size: 22px; margin: 16px 0 6px; font-weight: 600; }
      p.sub { color: #A8A6A0; font-size: 13px; line-height: 1.55; margin: 0 0 18px; }
      textarea {
        width: 100%; min-height: 120px; resize: vertical;
        background: #1A1A20; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.18); border-radius: 12px;
        padding: 14px; font-size: 14px; line-height: 1.55; outline: none;
        font-family: inherit;
      }
      textarea:focus { border-color: #A8A6A0; }
      .btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 11px 18px; border-radius: 999px; cursor: pointer;
        background: #F5F4F1; color: #0E0E10; font-size: 13px; font-weight: 600;
        border: none; transition: opacity .2s, transform .18s;
      }
      .btn:hover { opacity: .92; } .btn:active { transform: scale(.98); }
      .btn:disabled { opacity: .4; cursor: not-allowed; }
      .btn.ghost {
        background: transparent; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.18);
      }
      .btn.ghost:hover { background: rgba(245,244,241,.05); }
      .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
      .rule { height: 1px; background: rgba(245,244,241,.14); margin: 22px 0; }
      .score-row { display: flex; align-items: baseline; gap: 10px; margin: 4px 0 16px; }
      .score { font-size: 34px; font-weight: 600; font-variant-numeric: tabular-nums; }
      .score.lo { color: #C25E5E; } .score.mid { color: #A8A6A0; } .score.hi { color: #F5F4F1; }
      .arrow { color: #A8A6A0; }
      .result-box {
        background: #1A1A20; border: 1px solid rgba(245,244,241,.18);
        border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6;
        white-space: pre-wrap;
      }
      .label { font-size: 11px; letter-spacing:.14em; text-transform:uppercase; color:#A8A6A0; margin: 18px 0 8px; }
      .dots span {
        display:inline-block; width:5px;height:5px;border-radius:50%;
        background:#F5F4F1; margin:0 2px; animation: d 1.2s infinite;
      }
      .dots span:nth-child(2){animation-delay:.18s} .dots span:nth-child(3){animation-delay:.36s}
      @keyframes d { 0%,100%{opacity:.25} 50%{opacity:1} }
      .foot { margin-top: auto; padding: 16px 24px; border-top: 1px solid rgba(245,244,241,.1); }
      .foot a { color: #A8A6A0; font-size: 12px; text-decoration: none; }
      .foot a:hover { color: #F5F4F1; }
      .err { color: #C25E5E; font-size: 14px; line-height: 1.5; }
      .account-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; margin-bottom: 18px; min-height: 24px;
      }
      .badge {
        display: inline-flex; align-items: center; padding: 4px 10px;
        border-radius: 999px; font-size: 11px; font-weight: 600;
        letter-spacing: .04em; color: #A8A6A0;
        border: 1px solid rgba(245,244,241,.18);
      }
      .badge.pro { background: #F5F4F1; color: #0E0E10; border-color: transparent; }
      .link {
        background: none; border: none; color: #A8A6A0; font-size: 12px;
        cursor: pointer; padding: 4px 0; text-decoration: underline;
        text-underline-offset: 3px; font-family: inherit;
      }
      .link:hover { color: #F5F4F1; }
      a { color: #F5F4F1; }
    </style>

    <button class="fab" id="fab">
      <span class="mark">✦</span> Improve prompt
    </button>

    <div class="overlay" id="overlay">
      <div class="panel" role="dialog" aria-label="Deepclario">
        <div class="pad">
          <div class="row">
            <span class="eyebrow">Deepclario</span>
            <button class="x" id="close" aria-label="Close">×</button>
          </div>
          <h2>Improve your prompt</h2>
          <p class="sub">We score it, ask what is missing, and rewrite it - before you send it.</p>

          <div id="stage"></div>
        </div>
        <div class="foot">
          <a href="https://deepclario.com" target="_blank" rel="noopener">Powered by Deepclario →</a>
        </div>
      </div>
    </div>
  `

  const $ = sel => root.querySelector(sel)
  const overlay = $('#overlay')
  const stage = $('#stage')
  let history = []
  let lastPrompt = ''
  let authState = { token: null, tier: 'anon' }  // tier: 'anon' | 'free' | 'pro'

  /* ---------- Account / token storage ---------- */

  function loadAuth() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(['dc_token', 'dc_tier'], v => {
          authState.token = v?.dc_token || null
          authState.tier = v?.dc_tier || (authState.token ? 'free' : 'anon')
          resolve()
        })
      } catch { resolve() }
    })
  }

  function saveAuth(token, tier) {
    authState.token = token
    authState.tier = tier
    try { chrome.storage.local.set({ dc_token: token, dc_tier: tier }) } catch {}
  }

  function clearAuth() {
    authState.token = null
    authState.tier = 'anon'
    try { chrome.storage.local.remove(['dc_token', 'dc_tier']) } catch {}
  }

  function scoreClass(n) { return n < 30 ? 'lo' : n < 60 ? 'mid' : 'hi' }
  function esc(s) {
    const d = document.createElement('div'); d.innerText = s || ''; return d.innerHTML
  }

  async function openPanel() {
    await loadAuth()
    lastPrompt = readPrompt()
    history = []
    renderInput(lastPrompt)
    overlay.classList.add('open')
  }
  function closePanel() { overlay.classList.remove('open') }

  function renderInput(text) {
    const badge = authState.tier === 'pro'
      ? `<span class="badge pro">Pro</span>`
      : authState.tier === 'free'
      ? `<span class="badge">Account connected</span>`
      : ''
    const accountAction = authState.token
      ? `<button class="link" id="disconnect">Disconnect</button>`
      : `<button class="link" id="connect">Connect account</button>`

    stage.innerHTML = `
      <div class="account-row">${badge}${accountAction}</div>
      <div class="label">Your prompt</div>
      <textarea id="ta">${esc(text)}</textarea>
      <div class="actions">
        <button class="btn" id="go">Improve</button>
      </div>
    `
    const submit = () => {
      const v = $('#ta').value.trim()
      if (!v) return
      lastPrompt = v
      analyze(v, [])
    }
    $('#go').addEventListener('click', submit)
    $('#ta').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    })
    const connectBtn = $('#connect')
    if (connectBtn) connectBtn.addEventListener('click', renderConnect)
    const disconnectBtn = $('#disconnect')
    if (disconnectBtn) disconnectBtn.addEventListener('click', () => {
      clearAuth()
      renderInput(lastPrompt)
    })
  }

  function renderConnect() {
    stage.innerHTML = `
      <div class="rule"></div>
      <h2 style="margin-top:0">Connect your account</h2>
      <p class="sub">
        Open <a id="open-connect" href="https://deepclario.com/extension/connect" target="_blank" rel="noopener">deepclario.com/extension/connect</a>,
        copy the code shown there, and paste it below.
      </p>
      <div class="label">Connection code</div>
      <textarea id="code" placeholder="dc_..." style="min-height:80px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px"></textarea>
      <div class="actions">
        <button class="btn" id="save">Connect</button>
        <button class="btn ghost" id="back">Back</button>
      </div>
      <p id="connect-err" class="err" style="display:none; margin-top:10px"></p>
    `
    $('#back').addEventListener('click', () => renderInput(lastPrompt))
    $('#save').addEventListener('click', () => {
      const v = $('#code').value.trim()
      const err = $('#connect-err')
      if (!v.startsWith('dc_')) {
        err.style.display = 'block'
        err.textContent = 'That does not look like a Deepclario code. It starts with "dc_".'
        return
      }
      // We don't validate against the server here - the next analyze call
      // will either succeed (token good) or silently fall back to anon
      // (token bad). Keeping the connect path offline keeps it instant.
      saveAuth(v, 'free')
      renderInput(lastPrompt)
    })
  }

  function renderLoading() {
    stage.innerHTML = `<div class="rule"></div>
      <div class="dots" style="margin:18px 0"><span></span><span></span><span></span></div>
      <p class="sub">Reading what you wrote. Checking what's clear and what isn't.</p>`
  }

  function renderError(kind) {
    const msg = kind === 'rate_limited'
      ? 'Slow down a moment - free analyses are rate-limited by IP. Connect a Deepclario account for higher limits.'
      : kind === 'monthly_limit'
      ? 'You have used all 25 free prompts this month. Upgrade to Pro at deepclario.com for unlimited use.'
      : kind === 'network'
      ? 'Network hiccup. Check your connection and try again.'
      : 'Something went sideways on our end. Try again.'
    stage.innerHTML = `<div class="rule"></div><p class="err">${msg}</p>
      <div class="actions"><button class="btn ghost" id="retry">Back</button></div>`
    $('#retry').addEventListener('click', () => renderInput(lastPrompt))
  }

  function renderClarify(d) {
    const s = d.scoreBeforeImprovement ?? 0
    stage.innerHTML = `
      <div class="rule"></div>
      <div class="score-row">
        <span class="eyebrow">Clarity</span>
        <span class="score ${scoreClass(s)}">${s}</span>
        <span class="arrow">/ 100</span>
      </div>
      <div class="label">One question first</div>
      <div class="result-box">${esc(d.question)}</div>
      <div class="label">Your answer</div>
      <textarea id="ans" style="min-height:80px"></textarea>
      <div class="actions">
        <button class="btn" id="send">Get the rewrite</button>
        <button class="btn ghost" id="skip">Start over</button>
      </div>
    `
    const submit = () => {
      const a = $('#ans').value.trim()
      if (!a) return
      history.push({ question: d.question, answer: a, turn: history.length + 1 })
      analyze(lastPrompt, history)
    }
    $('#send').addEventListener('click', submit)
    $('#ans').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    })
    $('#skip').addEventListener('click', () => renderInput(lastPrompt))
  }

  function renderDone(d) {
    const b = d.scoreBeforeImprovement ?? 0
    const a = d.clarityScoreAfter ?? 0
    stage.innerHTML = `
      <div class="rule"></div>
      <div class="score-row">
        <span class="eyebrow">Clarity</span>
        <span class="score ${scoreClass(b)}">${b}</span>
        <span class="arrow">→</span>
        <span class="score ${scoreClass(a)}">${a}</span>
      </div>
      <div class="label">Improved prompt</div>
      <div class="result-box" id="rw">${esc(d.improvedPrompt)}</div>
      ${d.explanation ? `<div class="label">Why it is better</div><p class="sub" style="margin:0">${esc(d.explanation)}</p>` : ''}
      <div class="actions">
        <button class="btn" id="copy">Copy</button>
        <button class="btn ghost" id="replace">Replace in chat</button>
        <button class="btn ghost" id="again">New prompt</button>
      </div>
    `
    $('#copy').addEventListener('click', e => {
      navigator.clipboard.writeText(d.improvedPrompt)
      e.target.textContent = 'Copied'
      setTimeout(() => { e.target.textContent = 'Copy' }, 1600)
    })
    $('#replace').addEventListener('click', e => {
      const ok = writePrompt(d.improvedPrompt)
      e.target.textContent = ok ? 'Replaced' : 'Copy instead →'
      if (ok) setTimeout(closePanel, 700)
    })
    $('#again').addEventListener('click', () => { history = []; renderInput('') })
  }

  // Low-level API call. Promise-based so both the panel flow and the
  // inline-button flow can await it.
  function callAnalyze(prompt, prior) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'DEEPCLARIO_ANALYZE', prompt, priorAnswers: prior, token: authState.token },
        resp => {
          if (chrome.runtime.lastError) { reject(new Error('network')); return }
          if (!resp) { reject(new Error('network')); return }
          if (!resp.ok) { reject(new Error(resp.error || 'server_error')); return }
          resolve(resp.data)
        }
      )
    })
  }

  function syncTierFromResponse(d) {
    if (d.tier && d.tier !== 'anon' && authState.token) {
      saveAuth(authState.token, d.tier)
    }
  }

  // Panel-driven analyze — renders into the side panel.
  function analyze(prompt, prior) {
    renderLoading()
    callAnalyze(prompt, prior)
      .then(d => {
        syncTierFromResponse(d)
        if (d.type === 'clarifying' && prior.length < 3) renderClarify(d)
        else if (d.type === 'improved') renderDone(d)
        else renderError('server_error')
      })
      .catch(err => renderError(err.message || 'server_error'))
  }

  $('#fab').addEventListener('click', openPanel)
  $('#close').addEventListener('click', closePanel)
  overlay.addEventListener('click', e => { if (e.target === overlay) closePanel() })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closePanel()
  })

  /* ============================================================
     Inline mode — for ChatGPT (and Claude/Gemini later).
     Injects an "Improve" button right next to the host page's
     Send button so the user can rewrite without opening the panel.
     ============================================================ */

  const HOST = location.hostname
  const isChatGPT = HOST.includes('chatgpt.com') || HOST.includes('chat.openai.com')

  // Send-button selectors per host. Updated when host sites change DOM.
  const SEND_SELECTORS = {
    chatgpt: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'form button[aria-label*="Send"]',
    ],
  }

  function findSendButton(host) {
    const selectors = SEND_SELECTORS[host] || []
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) return el
    }
    return null
  }

  function isPromptEmpty() {
    return readPrompt().trim().length === 0
  }

  function buildInlineButton() {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = 'deepclario-inline'
    btn.setAttribute('aria-label', 'Improve prompt with Deepclario')
    btn.setAttribute('title', 'Improve prompt with Deepclario')
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dc-spark" aria-hidden="true">
        <path d="M8 1.5L9.4 5.2L13.5 6.5L10.1 9L11 13L8 11L5 13L5.9 9L2.5 6.5L6.6 5.2L8 1.5Z"
              fill="currentColor"/>
      </svg>
      <span class="dc-dots" aria-hidden="true" hidden>
        <span></span><span></span><span></span>
      </span>
    `
    btn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      runInlineImprove()
    })
    return btn
  }

  // Once-only style injection for the inline button + toast. Scoped via
  // unique IDs / classes so the host page CSS does not eat us.
  let stylesInjected = false
  function injectInlineStyles() {
    if (stylesInjected) return
    stylesInjected = true
    const style = document.createElement('style')
    style.id = 'deepclario-inline-styles'
    style.textContent = `
      #deepclario-inline {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-right: 6px;
        border-radius: 999px;
        cursor: pointer;
        color: #5B8FED;
        background: rgba(91, 143, 237, 0.10);
        border: 1px solid rgba(91, 143, 237, 0.30);
        transition: background 160ms ease, transform 160ms ease, opacity 160ms ease;
        flex-shrink: 0;
      }
      #deepclario-inline:hover {
        background: rgba(91, 143, 237, 0.18);
        border-color: rgba(91, 143, 237, 0.55);
      }
      #deepclario-inline:active { transform: scale(0.94); }
      #deepclario-inline[disabled] {
        opacity: 0.35;
        cursor: not-allowed;
        pointer-events: none;
      }
      #deepclario-inline[data-loading="true"] .dc-spark { display: none; }
      #deepclario-inline[data-loading="true"] .dc-dots { display: inline-flex; }
      #deepclario-inline .dc-dots {
        display: none;
        align-items: center;
        gap: 3px;
      }
      #deepclario-inline .dc-dots span {
        display: inline-block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.4;
        animation: dc-pulse 1.1s infinite ease-in-out;
      }
      #deepclario-inline .dc-dots span:nth-child(2) { animation-delay: 0.15s; }
      #deepclario-inline .dc-dots span:nth-child(3) { animation-delay: 0.30s; }
      @keyframes dc-pulse {
        0%, 100% { opacity: 0.25; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1); }
      }
    `
    document.head.appendChild(style)
  }

  function setInlineLoading(loading) {
    const btn = document.getElementById('deepclario-inline')
    if (!btn) return
    btn.dataset.loading = loading ? 'true' : 'false'
    btn.disabled = loading
  }

  function setInlineDisabled(disabled) {
    const btn = document.getElementById('deepclario-inline')
    if (!btn) return
    if (disabled) btn.setAttribute('disabled', '')
    else btn.removeAttribute('disabled')
  }

  function injectInlineButton(host) {
    if (document.getElementById('deepclario-inline')) return
    const send = findSendButton(host)
    if (!send || !send.parentElement) return
    injectInlineStyles()
    const btn = buildInlineButton()
    send.parentElement.insertBefore(btn, send)
    // Track prompt emptiness so the button greys out when there's nothing
    // to improve. Read on a short interval — the host's input may not
    // fire bubbled input events we can listen to from outside its tree.
    if (!window.__dcPollHandle) {
      window.__dcPollHandle = setInterval(() => {
        const b = document.getElementById('deepclario-inline')
        if (!b || b.dataset.loading === 'true') return
        setInlineDisabled(isPromptEmpty())
      }, 400)
    }
  }

  // Re-inject the button when the host page re-renders its composer
  // (e.g. switching chats). One observer, debounced lightly.
  function startInlineObserver(host) {
    let scheduled = false
    const obs = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        injectInlineButton(host)
      })
    })
    obs.observe(document.body, { childList: true, subtree: true })
    // First attempt — host page may not have mounted yet.
    injectInlineButton(host)
    setTimeout(() => injectInlineButton(host), 500)
    setTimeout(() => injectInlineButton(host), 1500)
  }

  /* ----- Toast: "Improved · Undo" ----- */

  // Toast lives inside the existing Shadow DOM so it inherits our style
  // isolation. Fixed positioning, bottom-centred above the composer.
  function ensureToastNode() {
    let toast = root.querySelector('#dc-toast')
    if (toast) return toast
    toast = document.createElement('div')
    toast.id = 'dc-toast'
    toast.innerHTML = `
      <span class="ic">✦</span>
      <span class="msg"></span>
      <button class="undo" type="button">Undo</button>
    `
    root.appendChild(toast)
    // Toast styles
    const tStyle = document.createElement('style')
    tStyle.textContent = `
      #dc-toast {
        position: fixed; left: 50%; bottom: 32px;
        transform: translate(-50%, 16px); opacity: 0; pointer-events: none;
        display: inline-flex; align-items: center; gap: 12px;
        padding: 10px 14px 10px 16px; border-radius: 999px;
        background: #15151A; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,0.18);
        box-shadow: 0 14px 40px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(91,143,237,0.18);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
        font-size: 13px; font-weight: 500;
        z-index: 2147483647;
        transition: opacity .22s ease, transform .25s cubic-bezier(.16,1,.3,1);
      }
      #dc-toast.open { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
      #dc-toast .ic { color: #5B8FED; }
      #dc-toast .msg { color: #F5F4F1; }
      #dc-toast .undo {
        all: unset; cursor: pointer;
        padding: 4px 10px; border-radius: 999px;
        color: #F5F4F1; background: rgba(245,244,241,0.08);
        font-size: 12px; font-weight: 600;
        transition: background .15s ease;
      }
      #dc-toast .undo:hover { background: rgba(245,244,241,0.16); }
    `
    root.appendChild(tStyle)
    return toast
  }

  let toastHideHandle = null
  function showToast(message, opts = {}) {
    const toast = ensureToastNode()
    toast.querySelector('.msg').textContent = message
    const undoBtn = toast.querySelector('.undo')
    if (opts.onUndo) {
      undoBtn.style.display = ''
      undoBtn.onclick = () => { opts.onUndo(); hideToast() }
    } else {
      undoBtn.style.display = 'none'
      undoBtn.onclick = null
    }
    toast.classList.add('open')
    if (toastHideHandle) clearTimeout(toastHideHandle)
    toastHideHandle = setTimeout(hideToast, opts.duration || 6000)
  }
  function hideToast() {
    const toast = root.querySelector('#dc-toast')
    if (toast) toast.classList.remove('open')
    if (toastHideHandle) { clearTimeout(toastHideHandle); toastHideHandle = null }
  }

  /* ----- The inline Improve flow ----- */

  async function runInlineImprove() {
    const prompt = readPrompt()
    if (!prompt.trim()) return
    await loadAuth()
    setInlineLoading(true)
    try {
      const d = await callAnalyze(prompt, [])
      syncTierFromResponse(d)
      if (d.type === 'clarifying') {
        // Clarifying question — fall back to the panel, pre-seeded with
        // the original prompt + this question. The user finishes the
        // flow in the panel; the final rewrite still ends up in chat.
        lastPrompt = prompt
        history = []
        overlay.classList.add('open')
        renderClarify(d)
      } else if (d.type === 'improved') {
        // Write the rewrite straight into the chat input. Stash the
        // original so the user can undo.
        const ok = writePrompt(d.improvedPrompt)
        if (ok) {
          showToast('Improved.', {
            onUndo: () => { writePrompt(prompt) },
          })
        } else {
          // Write failed (host DOM changed). Open the panel as fallback.
          lastPrompt = prompt
          history = []
          overlay.classList.add('open')
          renderDone(d)
        }
      } else {
        showToast('Could not improve. Try the side panel.')
      }
    } catch (err) {
      const kind = err && err.message ? err.message : 'network'
      if (kind === 'monthly_limit') {
        showToast('Free limit reached for this month.')
      } else if (kind === 'rate_limited') {
        showToast('Slow down a moment — rate limited.')
      } else {
        showToast('Something went wrong. Try again.')
      }
    } finally {
      setInlineLoading(false)
    }
  }

  if (isChatGPT) {
    startInlineObserver('chatgpt')
  }
})()
