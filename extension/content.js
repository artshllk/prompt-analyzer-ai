// Deepclario extension - content script (in-workflow, inline-first).
//
// The product is not a panel. It is a quiet layer over ChatGPT / Claude /
// Gemini: press one shortcut and the prompt in the box is sharpened in
// place, streamed in live. No destination, no paste-back.
//
//   Alt+I (or the small ✦ chip by the input) → sharpen the current prompt.
//   Tab / Enter while the "before" is shown → accept. Esc → undo.
//   "why?" on the chip → opens the details panel (the old full flow) for
//   the diagnosis, forks, and Deep Rewrite.
//
// Everything lives in a Shadow DOM so the host site's CSS can't touch us
// and ours can't leak out.

;(function () {
  if (window.__deepclarioInjected) return
  window.__deepclarioInjected = true

  /* ---------- Read / write the host page's prompt box ---------- */

  const READ_SELECTORS = [
    '#prompt-textarea',
    'textarea#prompt-textarea',
    'div.ProseMirror[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea textarea',
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

  /* ---------- Auth / prefs storage (unchanged contract) ---------- */

  const TONES = ['professional', 'friendly', 'persuasive', 'concise', 'creative']
  let authState = { token: null, tier: 'anon' }
  let prefs = { tone: 'professional', deep: false }
  let anonCount = 0
  const ANON_FREE_TRIES = 2

  function loadAuth() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(
          ['dc_token', 'dc_tier', 'dc_tone', 'dc_deep', 'dc_anon_count'],
          v => {
            authState.token = v?.dc_token || null
            authState.tier = v?.dc_tier || (authState.token ? 'free' : 'anon')
            if (TONES.includes(v?.dc_tone)) prefs.tone = v.dc_tone
            prefs.deep = v?.dc_deep === true
            anonCount = Number.isFinite(v?.dc_anon_count) ? v.dc_anon_count : 0
            resolve()
          }
        )
      } catch {
        resolve()
      }
    })
  }

  function bumpAnon() {
    anonCount += 1
    try { chrome.storage.local.set({ dc_anon_count: anonCount }) } catch {}
  }

  /* ---------- Shadow DOM host ---------- */

  const host = document.createElement('div')
  host.id = 'deepclario-host'
  host.style.cssText = 'all: initial;'
  document.documentElement.appendChild(host)
  const root = host.attachShadow({ mode: 'open' })

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

      /* Inline chip anchored near the prompt box - the whole default UI. */
      .chip {
        position: fixed; z-index: 2147483646;
        display: inline-flex; align-items: center; gap: 7px;
        padding: 7px 12px; border-radius: 999px; cursor: pointer;
        background: #F5F4F1; color: #0E0E10; font-size: 12.5px; font-weight: 600;
        border: none; box-shadow: 0 3px 16px rgba(0,0,0,0.28);
        opacity: 0; transform: translateY(4px) scale(.97); pointer-events: none;
        transition: opacity .18s, transform .18s cubic-bezier(.16,1,.3,1);
        max-width: min(78vw, 520px);
      }
      .chip.show { opacity: 1; transform: none; pointer-events: auto; }
      .chip .mark { font-size: 13px; line-height: 1; }
      .chip .kbd {
        font-size: 10px; font-weight: 600; opacity: .55;
        border: 1px solid rgba(14,14,16,.28); border-radius: 5px;
        padding: 1px 5px; margin-left: 2px;
      }
      .chip .why {
        font-size: 11px; font-weight: 600; color: #3763b6;
        margin-left: 4px; padding-left: 8px; border-left: 1px solid rgba(14,14,16,.2);
        cursor: pointer;
      }
      .chip .why:hover { text-decoration: underline; }
      .chip.state-working { background: #E9E7E2; cursor: default; }
      .chip.state-done { background: #DFF0E4; }
      .chip .dots span {
        display:inline-block; width:4px;height:4px;border-radius:50%;
        background:#0E0E10; margin:0 1.5px; animation: d 1.2s infinite; vertical-align: middle;
      }
      .chip .dots span:nth-child(2){animation-delay:.18s}
      .chip .dots span:nth-child(3){animation-delay:.36s}
      @keyframes d { 0%,100%{opacity:.25} 50%{opacity:1} }

      /* Tiny toast for silent-ish states (already good, errors). */
      .toast {
        position: fixed; z-index: 2147483646;
        font-size: 12px; font-weight: 600;
        padding: 7px 12px; border-radius: 999px;
        background: #0E0E10; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.16);
        box-shadow: 0 3px 16px rgba(0,0,0,.3);
        opacity: 0; transform: translateY(4px);
        transition: opacity .2s, transform .2s;
        pointer-events: none;
      }
      .toast.show { opacity: 1; transform: none; }
      .toast.good { background: #DFF0E4; color: #14401f; border-color: transparent; }
    </style>

    <button class="chip" id="chip" aria-label="Sharpen prompt with Deepclario"></button>
    <div class="toast" id="toast"></div>
  `

  const $ = sel => root.querySelector(sel)
  const chip = $('#chip')
  const toastEl = $('#toast')

  /* ---------- Positioning: anchor UI to the prompt box ---------- */

  function anchorTo(el, node, place) {
    const r = el.getBoundingClientRect()
    if (place === 'above') {
      node.style.left = r.left + 'px'
      node.style.top = Math.max(8, r.top - 42) + 'px'
      node.style.bottom = 'auto'
    } else {
      // below-right of the input's top-right, tucked just inside
      node.style.left = 'auto'
      node.style.right = Math.max(8, window.innerWidth - r.right + 6) + 'px'
      node.style.top = Math.max(8, r.top - 40) + 'px'
      node.style.bottom = 'auto'
    }
  }

  function positionChip() {
    const el = findPromptEl()
    if (!el) { chip.classList.remove('show'); return false }
    anchorTo(el, chip, 'right')
    return true
  }

  /* ---------- Chip states ---------- */

  const IDLE_HTML =
    `<span class="mark">✦</span>Sharpen<span class="kbd">Alt+I</span>`

  function showIdleChip() {
    if (state.phase === 'working') return
    if (!positionChip()) return
    chip.className = 'chip show'
    chip.innerHTML = IDLE_HTML
    chip.onclick = onSharpen
  }

  function hideChip() { chip.classList.remove('show') }

  function showWorkingChip() {
    positionChip()
    chip.className = 'chip show state-working'
    chip.innerHTML = `<span class="dots"><span></span><span></span><span></span></span>Sharpening`
    chip.onclick = null
  }

  function showDoneChip() {
    positionChip()
    chip.className = 'chip show state-done'
    chip.innerHTML =
      `<span class="mark">✓</span>Sharpened<span class="kbd">Esc to undo</span><span class="why" id="why">why?</span>`
    const why = $('#why')
    if (why) why.onclick = openDetails
    chip.onclick = null
    clearTimeout(state.doneTimer)
    state.doneTimer = setTimeout(showIdleChip, 4200)
  }

  function toast(text, good) {
    toastEl.textContent = text
    toastEl.className = 'toast' + (good ? ' good' : '')
    const el = findPromptEl()
    if (el) anchorTo(el, toastEl, 'right')
    requestAnimationFrame(() => toastEl.classList.add('show'))
    clearTimeout(state.toastTimer)
    state.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800)
  }

  /* ---------- The core action: fast-path streaming sharpen ---------- */

  const state = {
    phase: 'idle', // idle | working | done
    before: '',
    port: null,
    doneTimer: 0,
    toastTimer: 0,
  }

  async function onSharpen() {
    if (state.phase === 'working') return
    await loadAuth()

    if (authState.tier === 'anon' && anonCount >= ANON_FREE_TRIES) {
      toast('Free tries used - open Deepclario to connect')
      return
    }

    const prompt = readPrompt()
    if (!prompt || prompt.length < 3) { toast('Type a prompt first'); return }

    state.before = prompt
    state.phase = 'working'
    showWorkingChip()

    // Stream the sharpened prompt straight into the box.
    const port = chrome.runtime.connect({ name: 'DEEPCLARIO_SHARPEN' })
    state.port = port
    let acc = ''
    let firstDelta = true

    port.onMessage.addListener(msg => {
      if (msg.type === 'DELTA') {
        if (firstDelta) { acc = ''; firstDelta = false }
        acc += msg.text
        writePrompt(acc)
      } else if (msg.type === 'DONE') {
        finishSharpen(acc)
        port.disconnect()
      } else if (msg.type === 'ERROR') {
        onSharpenError(msg)
        port.disconnect()
      }
    })

    if (authState.tier === 'anon') bumpAnon()
    port.postMessage({ type: 'START', prompt, tone: prefs.tone, token: authState.token })
  }

  function finishSharpen(result) {
    state.phase = 'done'
    if (result && result.trim()) {
      writePrompt(result.trim())
      showDoneChip()
    } else {
      // Empty stream: leave the user's prompt untouched.
      writePrompt(state.before)
      state.phase = 'idle'
      toast('Could not sharpen that - try again')
      showIdleChip()
    }
  }

  function onSharpenError(msg) {
    // Restore what the user had; never leave the box half-written.
    writePrompt(state.before)
    state.phase = 'idle'
    const t =
      msg.error === 'quota' ? 'Out of free rewrites - go Pro for unlimited'
      : msg.error === 'rate_limited' ? 'Slow down a moment, then try again'
      : msg.error === 'network' ? 'Network hiccup - try again'
      : 'Something went wrong - try again'
    toast(t)
    showIdleChip()
  }

  function undoSharpen() {
    if (state.phase !== 'done') return
    writePrompt(state.before)
    state.phase = 'idle'
    toast('Reverted')
    showIdleChip()
  }

  /* ---------- Details panel (the old deep flow, on demand only) ---------- */
  // The fast path deliberately never forks - that's what keeps it fast.
  // Interpretation forks live in the details panel, where the full
  // analyze pipeline runs and renders them as one-click choices.

  let panelLoaded = false
  function openDetails() {
    // Lazily inject the full panel module the first time it's needed, so
    // the default inline path stays lightweight. The panel reuses the same
    // analyze pipeline (forks, diagnosis, Deep Rewrite).
    if (!panelLoaded) { buildPanel(); panelLoaded = true }
    openPanel(state.before || readPrompt())
  }

  /* ---------- Triggers ---------- */

  // Global hotkey. Alt+I is unclaimed on all three sites.
  window.addEventListener(
    'keydown',
    e => {
      const el = findPromptEl()
      const inBox = el && (document.activeElement === el || el.contains(document.activeElement))
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        if (readPrompt()) { e.preventDefault(); onSharpen() }
      } else if (e.key === 'Escape' && state.phase === 'done') {
        e.preventDefault(); undoSharpen()
      } else if (inBox && state.phase === 'done' && (e.key === 'Enter' || e.key === 'Tab')) {
        // Accept: just let the done state settle back to idle. The
        // sharpened text is already in the box, so Enter sends it.
        state.phase = 'idle'
        showIdleChip()
      }
    },
    true
  )

  // Show/hide the idle chip as the user focuses the prompt box and types.
  function syncChip() {
    if (state.phase === 'working' || state.phase === 'done') return
    const el = findPromptEl()
    if (el && readPrompt()) showIdleChip()
    else hideChip()
  }

  document.addEventListener('focusin', syncChip, true)
  document.addEventListener('input', () => { if (state.phase === 'idle') syncChip() }, true)
  window.addEventListener('scroll', () => {
    if (chip.classList.contains('show')) positionChip()
  }, true)
  window.addEventListener('resize', syncChip)

  // Re-evaluate periodically: these SPAs swap the input element on
  // navigation, so a one-time bind isn't enough.
  setInterval(syncChip, 1500)

  /* ---------- Details panel builder (kept from the panel-first version) ---------- */
  // Defined lazily; only the deep-details path uses it. Injected the first
  // time the user clicks "why?". Kept intentionally separate from the fast
  // path so the default experience carries none of its weight.
  let panelApi = null
  function buildPanel() {
    if (typeof window.createDetailsPanel !== 'function') return
    panelApi = window.createDetailsPanel({ root, readPrompt, writePrompt, authState, prefs, TONES })
  }
  function openPanel(prompt) {
    if (panelApi) panelApi.open(prompt)
    else window.open('https://deepclario.com/playground', '_blank', 'noopener')
  }
})()
