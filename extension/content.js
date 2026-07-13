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

  // Every outbound link in one place. Users should never have to go find
  // deepclario.com themselves - we take them exactly where they need to be.
  const SITE = 'https://deepclario.com'
  const LINKS = {
    connect: SITE + '/extension/connect',
    pricing: SITE + '/pricing',
    signup: SITE + '/login',
    playground: SITE + '/playground',
    privacy: SITE + '/privacy',
  }

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
        font-size: 11px; font-weight: 600; color: #2f5fae;
        margin-left: 2px; padding-left: 8px; border-left: 1px solid rgba(14,14,16,.2);
        cursor: pointer;
      }
      .chip .why:hover { text-decoration: underline; }
      .chip #undo { color: #6b6a66; }
      .chip.state-working { background: #E9E7E2; cursor: default; }
      .chip.state-done { background: #DFF0E4; }
      .chip .dots span {
        display:inline-block; width:4px;height:4px;border-radius:50%;
        background:#0E0E10; margin:0 1.5px; animation: d 1.2s infinite; vertical-align: middle;
      }
      .chip .dots span:nth-child(2){animation-delay:.18s}
      .chip .dots span:nth-child(3){animation-delay:.36s}
      @keyframes d { 0%,100%{opacity:.25} 50%{opacity:1} }

      /* Toast. Carries an optional action button - a dead-end message
         ("out of rewrites") is a UX failure; every wall needs a door. */
      .toast {
        position: fixed; z-index: 2147483646;
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 600;
        padding: 7px 8px 7px 12px; border-radius: 999px;
        background: #0E0E10; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.16);
        box-shadow: 0 3px 16px rgba(0,0,0,.3);
        opacity: 0; transform: translateY(4px);
        transition: opacity .2s, transform .2s;
        pointer-events: none;
        max-width: min(80vw, 460px);
      }
      .toast.show { opacity: 1; transform: none; }
      .toast.actionable { pointer-events: auto; }
      .toast.good { background: #DFF0E4; color: #14401f; border-color: transparent; }
      .toast .msg { padding-right: 2px; }
      .toast .act {
        flex-shrink: 0; cursor: pointer; font-family: inherit;
        font-size: 11.5px; font-weight: 700;
        padding: 4px 11px; border-radius: 999px; border: none;
        background: #F5F4F1; color: #0E0E10;
        transition: opacity .15s;
      }
      .toast .act:hover { opacity: .88; }

      /* Fork chips: the clarifying question, asked inline at the moment it
         matters. No panel, no report - one question, one click. */
      .forks {
        position: fixed; z-index: 2147483646;
        display: none; flex-direction: column; gap: 6px;
        width: min(88vw, 520px);
      }
      .forks.show { display: flex; }
      .forks .q {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        font-size: 12.5px; font-weight: 600; color: #F5F4F1;
        background: #0E0E10; border: 1px solid rgba(245,244,241,.16);
        border-radius: 9px; padding: 8px 10px 8px 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,.35);
      }
      .forks .qx {
        background: none; border: none; color: #A8A6A0; cursor: pointer;
        font-size: 15px; line-height: 1; padding: 2px 4px; flex-shrink: 0;
      }
      .forks .qx:hover { color: #F5F4F1; }
      .fork {
        text-align: left; cursor: pointer; font-family: inherit;
        background: #1A1A20; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.18); border-radius: 9px;
        padding: 8px 11px;
        box-shadow: 0 4px 20px rgba(0,0,0,.35);
        transition: border-color .14s, background .14s;
      }
      .fork:hover { border-color: #8FB4F2; background: #21212a; }
      .fork b { display: block; font-size: 12.5px; font-weight: 600; }
      .fork span { display: block; color: #A8A6A0; font-size: 11.5px; margin-top: 1px; line-height: 1.4; }

      /* Connect box - the paste target, anchored right by the input so
         the user never has to hunt for where the code goes. */
      .connect {
        position: fixed; z-index: 2147483647;
        width: min(86vw, 380px);
        background: #0E0E10; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.18);
        border-radius: 12px; padding: 14px 14px 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,.45);
        opacity: 0; transform: translateY(4px);
        transition: opacity .18s, transform .18s;
      }
      .connect.show { opacity: 1; transform: none; }
      .connect .ctitle { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
      .connect .chelp { font-size: 11.5px; color: #A8A6A0; line-height: 1.5; margin-bottom: 10px; }
      .connect .chelp b { color: #F5F4F1; }
      .connect .crow { display: flex; gap: 7px; }
      .connect .cinput {
        flex: 1; min-width: 0;
        background: #1A1A20; color: #F5F4F1;
        border: 1px solid rgba(245,244,241,.18); border-radius: 8px;
        padding: 8px 10px; font-size: 12.5px; outline: none;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .connect .cinput:focus { border-color: #8FB4F2; }
      .connect .cbtn {
        flex-shrink: 0; cursor: pointer; font-family: inherit;
        background: #F5F4F1; color: #0E0E10;
        border: none; border-radius: 8px;
        padding: 8px 14px; font-size: 12.5px; font-weight: 700;
      }
      .connect .cbtn:hover { opacity: .9; }
      .connect .cerr { color: #E08A8A; font-size: 11.5px; line-height: 1.45; margin-top: 7px; }
      .connect .cclose {
        position: absolute; top: 8px; right: 10px;
        background: none; border: none; color: #A8A6A0;
        font-size: 17px; line-height: 1; cursor: pointer; padding: 2px;
      }
      .connect .cclose:hover { color: #F5F4F1; }
    </style>

    <button class="chip" id="chip" aria-label="Sharpen prompt with Deepclario"></button>
    <div class="forks" id="forks"></div>
    <div class="toast" id="toast"></div>
  `

  const $ = sel => root.querySelector(sel)
  const chip = $('#chip')
  const forksEl = $('#forks')
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

  /**
   * The sharpened state is STICKY: it stays until the text in the box
   * actually changes. No timer. Two reasons:
   *  - "why?" must remain reachable. A 4s window meant the explanation
   *    vanished before the user finished reading the new prompt.
   *  - Re-sharpening our own output compounds it into mush. While the box
   *    holds our result, Sharpen is off; Undo and why? are what's offered.
   * Edit the text (or send it) and we return to idle, ready to sharpen.
   */
  function showDoneChip() {
    positionChip()
    chip.className = 'chip show state-done'
    const tag = state.chosen ? `Sharpened · ${state.chosen}` : 'Sharpened'
    chip.innerHTML =
      `<span class="mark">✓</span>${escHtml(tag)}` +
      `<span class="why" id="why">why?</span>` +
      `<span class="why" id="undo">undo</span>`
    const why = $('#why')
    if (why) why.onclick = openDetails
    const undo = $('#undo')
    if (undo) undo.onclick = undoSharpen
    chip.onclick = null
  }

  function escHtml(s) {
    const d = document.createElement('div')
    d.innerText = s || ''
    return d.innerHTML
  }

  /**
   * Toast with an optional action button. `action` = { label, url } or
   * { label, onClick }. Never show a wall without a door: if the user is
   * blocked (no account, out of rewrites), the way out is one click here,
   * not "go find deepclario.com yourself".
   */
  function toast(text, opts) {
    const o = opts || {}
    const action = o.action
    toastEl.innerHTML = ''

    const msg = document.createElement('span')
    msg.className = 'msg'
    msg.textContent = text
    toastEl.appendChild(msg)

    if (action) {
      const btn = document.createElement('button')
      btn.className = 'act'
      btn.textContent = action.label
      btn.addEventListener('click', () => {
        toastEl.classList.remove('show')
        if (action.onClick) action.onClick()
        else if (action.url) window.open(action.url, '_blank', 'noopener')
      })
      toastEl.appendChild(btn)
    }

    toastEl.className =
      'toast' + (o.good ? ' good' : '') + (action ? ' actionable' : '')
    const el = findPromptEl()
    if (el) anchorTo(el, toastEl, 'right')
    requestAnimationFrame(() => toastEl.classList.add('show'))

    clearTimeout(state.toastTimer)
    // Actionable toasts linger - the user needs time to reach the button.
    state.toastTimer = setTimeout(
      () => toastEl.classList.remove('show'),
      action ? 7000 : 1800
    )
  }

  /* ---------- The core action: fast-path streaming sharpen ---------- */

  const state = {
    phase: 'idle', // idle | working | done
    /** The user's prompt as it was BEFORE we touched it. What "why?" explains. */
    before: '',
    /** Exactly what we wrote into the box. If the box still holds this, the
     *  user hasn't edited our output - so Sharpen stays off and "why?" is live. */
    after: '',
    /** { question, options } when the prompt was genuinely ambiguous. */
    fork: null,
    /** The interpretation the user picked, if any. */
    chosen: '',
    port: null,
    toastTimer: 0,
  }

  /** True while the box still contains our unedited output. */
  function boxHoldsOurOutput() {
    return state.phase === 'done' && !!state.after && readPrompt() === state.after
  }

  async function onSharpen() {
    if (state.phase === 'working') return

    // Never sharpen our own output - it compounds into mush. The box
    // already holds a sharpened prompt: offer the explanation instead.
    if (boxHoldsOurOutput()) {
      toast('Already sharpened. Edit it, or see what changed.', {
        action: { label: 'why?', onClick: openDetails },
      })
      return
    }

    await loadAuth()

    if (authState.tier === 'anon' && anonCount >= ANON_FREE_TRIES) {
      toast('Free tries used. Connect a free account for 5 rewrites every 48h.', {
        action: { label: 'Connect', onClick: openConnect },
      })
      return
    }

    const prompt = readPrompt()
    if (!prompt || prompt.length < 3) { toast('Type a prompt first'); return }

    state.before = prompt
    state.fork = null
    hideForks()
    if (authState.tier === 'anon') bumpAnon()

    // Ask whether the prompt is ambiguous IN PARALLEL with rewriting it.
    // Serialising these would add 1-3s to every sharpen; this way the
    // rewrite still lands in ~1s and the question (if there is one) shows
    // up right after, offering to refine what the user already has.
    chrome.runtime.sendMessage(
      { type: 'DEEPCLARIO_FORK', prompt, token: authState.token },
      resp => {
        if (!resp || !resp.ok || !resp.data) return
        const f = resp.data
        if (!f.question || !f.options || f.options.length < 2) return
        // Only offer it if this is still the prompt we sharpened.
        if (state.before !== prompt) return
        state.fork = f
        if (state.phase === 'done') showForks(f)
      }
    )

    streamSharpenInto(prompt, null)
  }

  /**
   * Runs the streaming sharpen and writes it into the box live.
   * `choice` is set when the user picked an interpretation from the chips -
   * the server treats it as ground truth and does not re-charge quota.
   */
  function streamSharpenInto(prompt, choice) {
    state.phase = 'working'
    showWorkingChip()

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

    port.postMessage({
      type: 'START',
      prompt,
      tone: prefs.tone,
      token: authState.token,
      choice: choice || undefined,
    })
  }

  /** The user picked an interpretation: re-sharpen committed to it. */
  function chooseFork(option) {
    hideForks()
    state.fork = null
    state.chosen = option.label
    streamSharpenInto(state.before, `${option.label} - ${option.summary}`)
  }

  /**
   * The clarifying question, inline. This is the whole point: the user gets
   * the ONE question that changes their result, right where they are, as
   * buttons. No panel, no report, nothing to opt into.
   */
  function showForks(fork) {
    const el = findPromptEl()
    if (!el) return
    forksEl.innerHTML = ''

    const q = document.createElement('div')
    q.className = 'q'
    const qt = document.createElement('span')
    qt.textContent = fork.question
    const qx = document.createElement('button')
    qx.className = 'qx'
    qx.textContent = '×'
    qx.setAttribute('aria-label', 'Dismiss question')
    qx.addEventListener('click', () => { state.fork = null; hideForks() })
    q.appendChild(qt)
    q.appendChild(qx)
    forksEl.appendChild(q)

    fork.options.forEach(o => {
      const b = document.createElement('button')
      b.className = 'fork'
      const label = document.createElement('b')
      label.textContent = o.label
      const sum = document.createElement('span')
      sum.textContent = o.summary
      b.appendChild(label)
      b.appendChild(sum)
      b.addEventListener('click', () => chooseFork(o))
      forksEl.appendChild(b)
    })

    forksEl.classList.add('show')
    positionForks()
  }

  function positionForks() {
    const el = findPromptEl()
    if (!el || !forksEl.classList.contains('show')) return
    const r = el.getBoundingClientRect()
    forksEl.style.left = 'auto'
    forksEl.style.right = Math.max(8, window.innerWidth - r.right) + 'px'
    forksEl.style.top =
      Math.max(8, r.top - forksEl.offsetHeight - 46) + 'px'
  }

  function hideForks() {
    forksEl.classList.remove('show')
    forksEl.innerHTML = ''
  }

  function finishSharpen(result) {
    const clean = (result || '').trim()
    if (clean) {
      writePrompt(clean)
      state.after = clean
      state.phase = 'done'
      showDoneChip()
      // If the parallel check found the prompt genuinely ambiguous, ask now -
      // inline, as buttons. The user already has a usable rewrite; this
      // offers to commit it to what they actually meant.
      if (state.fork) showForks(state.fork)
    } else {
      // Empty stream: leave the user's prompt untouched.
      writePrompt(state.before)
      resetToIdle()
      toast('Could not sharpen that. Try again.')
    }
  }

  function resetToIdle() {
    state.phase = 'idle'
    state.after = ''
    state.fork = null
    state.chosen = ''
    hideForks()
    showIdleChip()
  }

  function onSharpenError(msg) {
    // Restore what the user had; never leave the box half-written.
    writePrompt(state.before)
    resetToIdle()

    // Every blocking error gets a one-click way out.
    if (msg.error === 'quota') {
      toast('You are out of free rewrites. They reset within 48 hours.', {
        action: { label: 'Go Pro', url: LINKS.pricing },
      })
    } else if (msg.error === 'pro_required') {
      toast('Deep Rewrite is a Pro feature.', {
        action: { label: 'See Pro', url: LINKS.pricing },
      })
    } else if (msg.error === 'rate_limited') {
      toast('Too many requests. Wait a moment, then try again.', {
        action: { label: 'Connect account', onClick: openConnect },
      })
    } else if (msg.error === 'network') {
      toast('Network hiccup. Check your connection and try again.')
    } else {
      toast('Something went wrong on our end. Try again.')
    }
  }

  function undoSharpen() {
    if (state.phase !== 'done') return
    writePrompt(state.before)
    resetToIdle()
    toast('Reverted to your original')
  }

  /* ---------- Connect an account ---------- */
  // The token is a copy-paste code from deepclario.com/extension/connect.
  // We open that page for the user AND show the paste box right here, so
  // they never have to hunt for where the code goes. Paste is one step.

  function openConnect() {
    window.open(LINKS.connect, '_blank', 'noopener')
    showConnectBox()
  }

  function saveToken(raw) {
    const token = (raw || '').trim()
    if (!token.startsWith('dc_')) return false
    authState.token = token
    // Tier is confirmed by the server on the next call; assume free until then.
    authState.tier = 'free'
    try { chrome.storage.local.set({ dc_token: token, dc_tier: 'free' }) } catch {}
    return true
  }

  function disconnect() {
    authState.token = null
    authState.tier = 'anon'
    try { chrome.storage.local.remove(['dc_token', 'dc_tier']) } catch {}
    toast('Account disconnected')
  }

  function showConnectBox() {
    hideConnectBox()
    const el = findPromptEl()
    if (!el) return

    const box = document.createElement('div')
    box.className = 'connect show'
    box.id = 'connect'
    box.innerHTML = `
      <div class="ctitle">Paste your connection code</div>
      <div class="chelp">We opened deepclario.com for you. Copy the <b>dc_…</b> code and paste it below.</div>
      <div class="crow">
        <input class="cinput" id="ctoken" type="text" placeholder="dc_…" autocomplete="off" spellcheck="false" />
        <button class="cbtn" id="csave">Connect</button>
      </div>
      <div class="cerr" id="cerr"></div>
      <button class="cclose" id="cclose" aria-label="Close">×</button>
    `
    root.appendChild(box)
    anchorTo(el, box, 'above')
    // Sit it a little higher than the chip so they don't overlap.
    box.style.top = Math.max(8, el.getBoundingClientRect().top - box.offsetHeight - 12) + 'px'

    const input = box.querySelector('#ctoken')
    const err = box.querySelector('#cerr')
    input.focus()

    const submit = () => {
      if (saveToken(input.value)) {
        hideConnectBox()
        toast('Account connected. Sharpen away.', { good: true })
        showIdleChip()
      } else {
        err.textContent = 'That code should start with "dc_". Copy it again from the page we opened.'
      }
    }
    box.querySelector('#csave').addEventListener('click', submit)
    box.querySelector('#cclose').addEventListener('click', hideConnectBox)
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submit() }
      if (e.key === 'Escape') { e.preventDefault(); hideConnectBox() }
    })
  }

  function hideConnectBox() {
    const existing = root.querySelector('#connect')
    if (existing) existing.remove()
  }

  /* ---------- Details panel (the old deep flow, on demand only) ---------- */
  // The fast path deliberately never forks - that's what keeps it fast.
  // Interpretation forks live in the details panel, where the full
  // analyze pipeline runs and renders them as one-click choices.

  let panelLoaded = false
  function openDetails() {
    // Lazily inject the full panel the first time it's needed, so the
    // default inline path stays lightweight.
    if (!panelLoaded) { buildPanel(); panelLoaded = true }

    // CRITICAL: always diagnose the user's ORIGINAL prompt, never our own
    // output. Analyzing the sharpened text produced nonsense like
    // "clarity 88 -> 88" plus a second, competing rewrite - it answered a
    // question nobody asked. We pass the original, and tell the panel what
    // we already wrote so it can show the real before/after.
    const original = state.before || readPrompt()
    openPanel(original, boxHoldsOurOutput() ? state.after : null)
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
        return
      }
      // Esc undoes while our output is still untouched in the box.
      if (e.key === 'Escape' && boxHoldsOurOutput()) {
        e.preventDefault()
        undoSharpen()
        return
      }
      // Enter sends the sharpened prompt - the box empties, so we go idle.
      if (inBox && e.key === 'Enter' && !e.shiftKey && state.phase === 'done') {
        setTimeout(syncChip, 60)
      }
    },
    true
  )

  /**
   * Single source of truth for what the chip shows. Called on focus,
   * input, resize, and on a timer (these SPAs swap the input element on
   * navigation, so one-time binds aren't enough).
   */
  function syncChip() {
    if (state.phase === 'working') return

    const el = findPromptEl()
    const text = readPrompt()

    if (!el || !text) {
      // Box empty (usually: they sent it). Nothing to sharpen or explain.
      if (state.phase === 'done') {
        state.phase = 'idle'
        state.after = ''
        state.fork = null
        state.chosen = ''
      }
      hideForks()
      hideChip()
      return
    }

    if (state.phase === 'done') {
      // Still holding our output? Keep the sticky Sharpened chip.
      if (text === state.after) { showDoneChip(); return }
      // They edited it. It's their prompt again - offer to sharpen.
      resetToIdle()
      return
    }

    showIdleChip()
  }

  document.addEventListener('focusin', syncChip, true)
  document.addEventListener('input', syncChip, true)
  window.addEventListener('scroll', () => {
    if (chip.classList.contains('show')) positionChip()
    positionForks()
  }, true)
  window.addEventListener('resize', () => { syncChip(); positionForks() })
  setInterval(syncChip, 1200)

  /* ---------- Details panel builder (kept from the panel-first version) ---------- */
  // Defined lazily; only the deep-details path uses it. Injected the first
  // time the user clicks "why?". Kept intentionally separate from the fast
  // path so the default experience carries none of its weight.
  let panelApi = null
  function buildPanel() {
    if (typeof window.createDetailsPanel !== 'function') return
    panelApi = window.createDetailsPanel({
      root,
      readPrompt,
      writePrompt,
      authState,
      prefs,
      TONES,
      LINKS,
      onConnect: openConnect,
      onDisconnect: disconnect,
      // The panel wrote a deeper rewrite into the box. Track it as our
      // output so the sticky chip, undo, and re-sharpen guard all hold.
      onReplace: text => {
        const clean = (text || '').trim()
        if (!clean) return
        writePrompt(clean)
        state.after = clean
        state.phase = 'done'
        showDoneChip()
      },
      // They restored their original from the panel.
      onRestore: () => {
        writePrompt(state.before)
        resetToIdle()
      },
    })
  }
  function openPanel(prompt, alreadyHave) {
    if (panelApi) panelApi.open(prompt, alreadyHave)
    else window.open(LINKS.playground, '_blank', 'noopener')
  }
})()
