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
      <p class="sub">Reading what you wrote, the way a senior engineer reads a ticket.</p>`
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

  function analyze(prompt, prior) {
    renderLoading()
    chrome.runtime.sendMessage(
      { type: 'DEEPCLARIO_ANALYZE', prompt, priorAnswers: prior, token: authState.token },
      resp => {
        if (!resp || !resp.ok) { renderError(resp ? resp.error : 'network'); return }
        const d = resp.data
        // Sync tier from the server's authoritative response so the badge
        // updates the moment a Pro user's token is recognized.
        if (d.tier && d.tier !== 'anon' && authState.token) {
          saveAuth(authState.token, d.tier)
        }
        if (d.type === 'clarifying' && prior.length < 3) renderClarify(d)
        else if (d.type === 'improved') renderDone(d)
        else renderError('server_error')
      }
    )
  }

  $('#fab').addEventListener('click', openPanel)
  $('#close').addEventListener('click', closePanel)
  overlay.addEventListener('click', e => { if (e.target === overlay) closePanel() })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closePanel()
  })
})()
