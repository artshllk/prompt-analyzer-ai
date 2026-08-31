// Deepclario extension - content script (in-workflow, inline-first).
//
// The product is not a panel. It is a quiet layer over ChatGPT / Claude /
// Gemini: press one shortcut and the prompt in the box is improved in
// place, streamed in live. No destination, no paste-back.
//
//   Alt+I (⌥I on a Mac), or the small ✦ chip by the input → improve.
//   Enter sends it. Esc undoes.
//   "+ N details" on the chip → the questions only you can answer, inline.
//   "compare" → the one thing the chip cannot do: show your original beside
//   the rewrite, and hand your own words back. The box holds one version.
//
// Everything lives in a Shadow DOM so the host site's CSS can't touch us
// and ours can't leak out.

;(function () {
  if (window.__deepclarioInjected) return
  window.__deepclarioInjected = true

  // Shared palette and type scale (extension/tokens.js, loaded first by the
  // manifest). Falls back to an empty block rather than throwing, so a load
  // ordering mistake costs the colours and not the product.
  const TOKENS = (typeof window !== 'undefined' && window.DC_TOKENS) || { cssVars: '' }

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

  /**
   * THE ONLY PLACE SITE-SPECIFIC KNOWLEDGE LIVES.
   *
   * Everything else in this file is structural, on purpose: a selector table is
   * a bet that three companies will not touch their composer, and they touch it
   * constantly. So this table is a HINT, never a requirement. Each entry is
   * tried first and falls through to the generic path if it misses, and the
   * generic path alone is enough to position correctly. If ChatGPT renames a
   * class tomorrow, we get slightly less precise placement, not a broken chip.
   *
   *   editable - tried before READ_SELECTORS. Narrows the match so a stray
   *              contenteditable (a title field, Claude's project instructions)
   *              cannot win over the real composer.
   *   shell    - the rounded box the user perceives as "the input", which is a
   *              different element from the text inside it. See composerRect().
   */
  const PLATFORM_SITES = [
    ['chatgpt.com', {
      editable: ['#prompt-textarea', 'form div.ProseMirror[contenteditable="true"]'],
      shell: ['form[data-type="unified-composer"]', 'main form'],
    }],
    ['chat.openai.com', {
      editable: ['#prompt-textarea', 'form div.ProseMirror[contenteditable="true"]'],
      shell: ['form[data-type="unified-composer"]', 'main form'],
    }],
    ['claude.ai', {
      editable: ['div.ProseMirror[contenteditable="true"]'],
      shell: ['div[data-testid="chat-input-container"]', 'fieldset', 'form'],
    }],
    ['gemini.google.com', {
      editable: [
        'rich-textarea div.ql-editor[contenteditable="true"]',
        'rich-textarea textarea',
        'div.ql-editor[contenteditable="true"]',
      ],
      shell: ['input-container', 'div.input-area-container'],
    }],
  ]

  const SITE_CFG = (function () {
    const h = location.hostname
    for (const [host, cfg] of PLATFORM_SITES) {
      if (h === host || h.endsWith('.' + host)) return cfg
    }
    return null
  })()

  function findPromptEl() {
    const list = SITE_CFG ? SITE_CFG.editable.concat(READ_SELECTORS) : READ_SELECTORS
    for (const sel of list) {
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

  /**
   * True only while OUR write is executing.
   *
   * Both write paths below dispatch their `input` event synchronously, before
   * writePrompt returns: `dispatchEvent` by definition, and `execCommand` as
   * part of the editing command. So a plain synchronous flag separates our
   * writes from the user's typing exactly, with no timing window to tune and
   * nothing to get wrong on a slow machine.
   *
   * This is what replaced comparing text to text. See the comment on
   * state.userEdited.
   */
  let selfWriting = false

  function writePrompt(text) {
    const el = findPromptEl()
    if (!el) return false
    selfWriting = true
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
    } finally {
      selfWriting = false
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
    app: SITE + '/dashboard',
    privacy: SITE + '/privacy',
  }

  // Must match the server's limit (src/app/api/anon/sharpen/route.ts). If the
  // two ever drift, the background worker still maps the server's 400 to a
  // proper message - this is the fast path, not the only guard.
  const MAX_PROMPT_CHARS = 4000

  // Free improvements per rolling 24h. Must match USAGE_DAILY_LIMIT in
  // src/lib/limits.ts. Used only for copy - the server is the gate.
  const DAILY_LIMIT = 10

  /**
   * Say it in the user's terms. "4000 characters" means nothing to anyone; a
   * rough word count does. And give them the actual way forward, because
   * "try again" on a prompt that is too long is advice that can never work.
   */
  function tooLongMessage(len) {
    const words = Math.round(len / 5.5 / 50) * 50 // ~5.5 chars/word, to nearest 50
    return `That prompt is too long to improve (roughly ${words.toLocaleString()} words). Improve one section at a time.`
  }

  const TONES = ['professional', 'friendly', 'persuasive', 'concise', 'creative']
  let authState = { token: null, tier: 'anon' }
  // proSeen: the "unlimited" confirmation is shown once, ever. After that
  // Pro users never see a word about limits again - that IS the benefit.
  let prefs = { tone: 'professional', proSeen: false }
  let anonCount = 0
  // The storage listener that waits for the connect page's token. Held so it
  // can be torn down: it is armed only while a connect is in flight.
  let connectWatcher = null
  // Free tries before we ask for an account.
  //
  // Was 2. Two is enough to be curious and not enough to be convinced: try
  // one might be a bad prompt or a confusing question, try two is when an
  // opinion starts forming, and try three is where someone actually wants
  // this. Asking at curiosity converts worse than asking at desire, and an
  // improve costs us about a cent - five of them is a very cheap signup.
  const ANON_FREE_TRIES = 5

  function loadAuth() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(
          ['dc_token', 'dc_tier', 'dc_tone', 'dc_anon_count', 'dc_pro_seen'],
          v => {
            authState.token = v?.dc_token || null
            authState.tier = v?.dc_tier || (authState.token ? 'free' : 'anon')
            if (TONES.includes(v?.dc_tone)) prefs.tone = v.dc_tone
            prefs.proSeen = v?.dc_pro_seen === true
            anonCount = Number.isFinite(v?.dc_anon_count) ? v.dc_anon_count : 0
            // Machines that ran an older build still hold a dc_intro_seen
            // key. Nothing reads it now, and a stray boolean costs nothing
            // to leave alone - cheaper than a cleanup write on every load.
            // The popup shows "N free tries left" and has no way to know the
            // ceiling on its own. Publish it here so the two can never
            // disagree after we change the number.
            try { chrome.storage.local.set({ dc_anon_max: ANON_FREE_TRIES }) } catch {}
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

  /* ---------- Counters ---------- */

  /** Which of the three, for the counters. Null anywhere else. */
  const SURFACE = (function () {
    const h = location.hostname
    if (h.endsWith('chatgpt.com') || h.endsWith('chat.openai.com')) return 'chatgpt'
    if (h.endsWith('claude.ai')) return 'claude'
    if (h.endsWith('gemini.google.com')) return 'gemini'
    return null
  })()

  /**
   * One event name, the tier, and which site. That is the entire payload, and
   * it is the entire payload on purpose.
   *
   * We have been shipping blind: nothing records whether anyone presses the
   * key, and nothing records the one fact that says whether the rewrite was
   * any good - that the user sent it rather than taking it back. This file
   * already worked both of those out and dropped them on the floor.
   *
   * What is NOT sent, and must never be: the prompt, the rewrite, any part of
   * either, and any identifier. The extension page promises we only see a
   * prompt when the key is pressed, and that promise is worth more than any
   * measurement. Counts answer the questions we actually have, because those
   * questions are all ratios.
   *
   * Fire and forget. No callback, no await, no error path. If the network is
   * down or the endpoint is gone, the user never finds out.
   */
  function track(event) {
    try {
      chrome.runtime.sendMessage({
        type: 'DEEPCLARIO_EVENT',
        event,
        tier: authState.tier || 'anon',
        surface: SURFACE,
      })
    } catch {
      // An invalidated context (the extension just updated) throws here. It is
      // a counter; let it go.
    }
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
      :host {
        all: initial;
        /* The shared palette. Defined once here so every rule below can use
           a name instead of a hex, and so a palette change is one edit in
           tokens.js rather than eighty-six across three files. */
        ${TOKENS.cssVars}
      }
      * { box-sizing: border-box; font-family: var(--dc-font); }

      /* Inline chip anchored near the prompt box - the whole default UI. */
      .chip {
        position: fixed; z-index: 2147483646;
        display: inline-flex; align-items: center; gap: 7px;
        padding: 7px 12px; border-radius: 999px; cursor: pointer;
        background: var(--dc-card); color: var(--dc-ink); font-size: 12.5px; font-weight: 600;
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
        font-size: 11px; font-weight: 600; color: var(--dc-machine);
        margin-left: 2px; padding-left: 8px; border-left: 1px solid rgba(14,14,16,.2);
        cursor: pointer;
      }
      .chip .why:hover { text-decoration: underline; }
      .chip #undo { color: var(--dc-ink-soft); }
      /* The offer to add missing details - the next step of the journey,
         so it reads as an action, not as a footnote. */
      .chip .add { color: var(--dc-ink); background: var(--dc-machine); border-left: none;
        border-radius: 999px; padding: 3px 9px; margin-left: 6px; font-weight: 700; }
      .chip .add:hover { text-decoration: none; opacity: .88; }
      .chip.state-working { background: var(--dc-paper); cursor: default; }
      .chip.state-done { background: var(--dc-confirm-bg); }
      .chip .dots span {
        display:inline-block; width:4px;height:4px;border-radius:50%;
        background:var(--dc-ink); margin:0 1.5px; animation: d 1.2s infinite; vertical-align: middle;
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
        background: var(--dc-ink); color: var(--dc-card);
        border: 1px solid rgba(245,244,241,.16);
        box-shadow: 0 3px 16px rgba(0,0,0,.3);
        opacity: 0; transform: translateY(4px);
        transition: opacity .2s, transform .2s;
        pointer-events: none;
        max-width: min(80vw, 460px);
      }
      .toast.show { opacity: 1; transform: none; }
      .toast.actionable { pointer-events: auto; }
      .toast.good { background: var(--dc-confirm-bg); color: var(--dc-confirm); border-color: transparent; }
      .toast .msg { padding-right: 2px; }
      .toast .act {
        flex-shrink: 0; cursor: pointer; font-family: inherit;
        font-size: 11.5px; font-weight: 700;
        padding: 4px 11px; border-radius: 999px; border: none;
        background: var(--dc-card); color: var(--dc-ink);
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
        font-size: 12.5px; font-weight: 600; color: var(--dc-card);
        background: var(--dc-ink); border: 1px solid rgba(245,244,241,.16);
        border-radius: 9px; padding: 8px 10px 8px 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,.35);
      }
      .forks .qx {
        background: none; border: none; color: var(--dc-ink-soft); cursor: pointer;
        font-size: 15px; line-height: 1; padding: 2px 4px; flex-shrink: 0;
      }
      .forks .qx:hover { color: var(--dc-card); }
      .fork {
        text-align: left; cursor: pointer; font-family: inherit;
        background: var(--dc-card); color: var(--dc-card);
        border: 1px solid rgba(245,244,241,.18); border-radius: 9px;
        padding: 8px 11px;
        box-shadow: 0 4px 20px rgba(0,0,0,.35);
        transition: border-color .14s, background .14s;
      }
      .fork:hover { border-color: var(--dc-machine); background: var(--dc-rule); }
      .fork b { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; }
      .fork b .n {
        flex-shrink: 0; font-style: normal; font-size: 9.5px; font-weight: 700;
        width: 15px; height: 15px; border-radius: 4px;
        display: inline-flex; align-items: center; justify-content: center;
        background: rgba(245,244,241,.10); color: var(--dc-ink-soft);
      }
      .fork:hover b .n { background: var(--dc-machine); color: var(--dc-ink); }
      .fork span { display: block; color: var(--dc-ink-soft); font-size: 11.5px; margin-top: 2px; margin-left: 22px; line-height: 1.4; }
      .forks .hint {
        font-size: 11px; color: var(--dc-ink-soft); padding: 0 2px 2px 2px; margin-top: -2px;
      }
      .forks .own {
        background: var(--dc-card); color: var(--dc-card);
        border: 1px dashed rgba(245,244,241,.22); border-radius: 9px;
        padding: 8px 11px; font-size: 12.5px; outline: none; font-family: inherit;
        box-shadow: 0 4px 20px rgba(0,0,0,.35);
      }
      .forks .own:focus { border-color: var(--dc-machine); border-style: solid; }
      .forks .own::placeholder { color: var(--dc-ink-soft); }

      /* Connect box - the paste target, anchored right by the input so
         the user never has to hunt for where the code goes. */
      .connect {
        position: fixed; z-index: 2147483647;
        width: min(86vw, 380px);
        background: var(--dc-ink); color: var(--dc-card);
        border: 1px solid rgba(245,244,241,.18);
        border-radius: 12px; padding: 14px 14px 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,.45);
        opacity: 0; transform: translateY(4px);
        transition: opacity .18s, transform .18s;
      }
      .connect.show { opacity: 1; transform: none; }
      .connect .ctitle { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
      .connect .chelp { font-size: 11.5px; color: var(--dc-ink-soft); line-height: 1.5; margin-bottom: 10px; }
      .connect .chelp b { color: var(--dc-card); }
      .connect .crow { display: flex; gap: 7px; }
      .connect .cinput {
        flex: 1; min-width: 0;
        background: var(--dc-card); color: var(--dc-card);
        border: 1px solid rgba(245,244,241,.18); border-radius: 8px;
        padding: 8px 10px; font-size: 12.5px; outline: none;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .connect .cinput:focus { border-color: var(--dc-machine); }
      .connect .cbtn {
        flex-shrink: 0; cursor: pointer; font-family: inherit;
        background: var(--dc-card); color: var(--dc-ink);
        border: none; border-radius: 8px;
        padding: 8px 14px; font-size: 12.5px; font-weight: 700;
      }
      .connect .cbtn:hover { opacity: .9; }
      .connect .cerr { color: var(--dc-brand); font-size: 11.5px; line-height: 1.45; margin-top: 7px; }
      .connect .cclose {
        position: absolute; top: 8px; right: 10px;
        background: none; border: none; color: var(--dc-ink-soft);
        font-size: 17px; line-height: 1; cursor: pointer; padding: 2px;
      }
      .connect .cclose:hover { color: var(--dc-card); }

    </style>

    <button type="button" class="chip" id="chip" aria-label="Improve prompt with Deepclario"></button>
    <div class="forks" id="forks"></div>
    <div class="toast" id="toast"></div>
  `

  const $ = sel => root.querySelector(sel)
  const chip = $('#chip')
  const forksEl = $('#forks')
  const toastEl = $('#toast')

  /* ---------- Positioning: anchor UI to the prompt box ---------- */

  /**
   * WHAT WE ANCHOR TO, AND WHY IT KEPT DRIFTING.
   *
   * Two shipped fixes have now missed this, so it is worth being exact.
   *
   * findPromptEl() returns the EDITABLE - ChatGPT's #prompt-textarea, Claude's
   * ProseMirror, Gemini's .ql-editor. On all three, the editable is the SCROLL
   * CONTENT inside a wrapper that has a max-height and overflow-y: auto. Type
   * past that max-height and the wrapper stops growing while the editable does
   * not. The visible box is finished moving; the editable's top edge keeps
   * climbing, past the visible top of the box, past 0, into negative numbers.
   *
   * Both previous attempts measured that edge:
   *
   *   v1  top:    r.top - 40                    -> chip flew to the top
   *   v2  bottom: innerHeight - r.top + 10      -> chip rises 1px per 1px typed
   *
   * v2 is v1 rotated. Both are linear in r.top, and r.top is the single edge in
   * this layout that moves without bound. Expressing the offset from the bottom
   * of the viewport changed which edge of OUR element is the reference; it did
   * not change what we measured. That is why the bug survived the rewrite.
   *
   * So: stop measuring the editable. composerRect() returns the box the user
   * can actually SEE - the editable's rect intersected with every ancestor that
   * clips it, then grown out to the composer shell. Its top edge stops moving
   * the moment the composer hits its max-height, which is precisely the moment
   * the user perceives the box as having stopped growing.
   *
   * Nothing below is site-specific. The clip walk DERIVES at runtime what a
   * per-site selector would hardcode, so it cannot go stale when any of the
   * three redesigns. PLATFORM_SITES only sharpens it.
   *
   * Returns false when the box is off-screen, so callers can hide rather than
   * park a stray chip somewhere meaningless.
   */
  const GAP_ABOVE_BOX = 10

  // How far up from the editable we will look for the composer shell.
  const SHELL_MAX_STEPS = 6
  // A shell is the editable plus its own chrome (toolbar row, padding,
  // attachment previews). Past this we have walked out into the page.
  const SHELL_MAX_EXTRA = 220
  const SHELL_MAX_FRACTION = 0.66

  /**
   * The part of `el` that is actually on screen: its own rect, intersected with
   * every ancestor that clips it. This is the whole fix in one function - for a
   * composer that has hit its max-height, the intersection is the wrapper, and
   * the wrapper's top edge does not move however much more you type.
   */
  function visibleRect(el) {
    const r = el.getBoundingClientRect()
    let top = r.top, bottom = r.bottom, left = r.left, right = r.right

    let p = el.parentElement
    for (let i = 0; p && i < 30; i++, p = p.parentElement) {
      // Skip html/body. Their boxes are the DOCUMENT, not the viewport - on a
      // scrolled page documentElement's rect has a negative top and the full
      // content height, so intersecting with it would be meaningless. Whatever
      // they clip, the viewport clamp in anchorTo already covers.
      if (p === document.body || p === document.documentElement) continue
      const cs = getComputedStyle(p)
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
      const pr = p.getBoundingClientRect()
      if (pr.width === 0 || pr.height === 0) continue
      if (pr.top > top) top = pr.top
      if (pr.bottom < bottom) bottom = pr.bottom
      if (pr.left > left) left = pr.left
      if (pr.right < right) right = pr.right
    }
    return { top, bottom, left, right, width: right - left, height: bottom - top }
  }

  /**
   * The composer SHELL: the rounded box, not the text inside it. We anchor to
   * this rather than to the editable because the two are not the same element
   * on any of the three sites - the shell also holds the send button, the tool
   * row and (ChatGPT, Claude) the attachment previews that render ABOVE the
   * text. Anchoring 10px above the editable would drop the chip on top of them.
   */
  function shellElement(el, base) {
    if (SITE_CFG) {
      for (const sel of SITE_CFG.shell || []) {
        const named = el.closest(sel)
        // Reject a hint that has gone stale and now matches half the page. The
        // generic walk below is a better answer than a confidently wrong one.
        if (named && named.getBoundingClientRect().height <= window.innerHeight * SHELL_MAX_FRACTION) {
          return named
        }
      }
    }

    base = base || visibleRect(el)
    let best = el
    let node = el.parentElement
    for (let i = 0; node && i < SHELL_MAX_STEPS; i++, node = node.parentElement) {
      const r = node.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.height > window.innerHeight * SHELL_MAX_FRACTION) break
      if (r.height > base.height + SHELL_MAX_EXTRA) break
      best = node
    }
    return best
  }

  // One measurement per frame. Every floating element asks for this rect in the
  // same rAF pass, and they must all agree; re-reading also forces a style
  // recalc per clipping ancestor for no gain.
  let rectCache = { el: null, at: -1, rect: null }

  function composerRect(el) {
    const now = performance.now()
    if (rectCache.el === el && now - rectCache.at < 16) return rectCache.rect

    let out = null
    const v = visibleRect(el)
    if (v.width > 0 && v.height > 0) {
      const shell = shellElement(el, v)
      if (shell === el) {
        out = v
      } else {
        const s = visibleRect(shell)
        const top = Math.min(v.top, s.top)
        const bottom = Math.max(v.bottom, s.bottom)
        const left = Math.min(v.left, s.left)
        const right = Math.max(v.right, s.right)
        out = { top, bottom, left, right, width: right - left, height: bottom - top }
      }
    }

    rectCache = { el, at: now, rect: out }
    return out
  }

  function anchorTo(el, node, place) {
    const r = composerRect(el)
    if (!r) return false

    // Scrolled out of view, collapsed, or a mid-render measurement of a node
    // that is briefly nonsense. Hide instead of parking the UI somewhere it
    // does not belong.
    if (r.bottom <= 0 || r.top >= window.innerHeight || r.width <= 0) return false

    // Measured from the composer's VISIBLE top edge, which stops moving once
    // the box reaches its max-height - unlike the editable's top edge, which
    // never stops. This is the line the whole bug lived on.
    const wanted = window.innerHeight - r.top + GAP_ABOVE_BOX

    // The safety net, and it is deliberately NOT the old one.
    //
    // The old net refused to position anything above the viewport midline, on
    // the grounds that "a chat composer never lives up there". That is false:
    // on the new-chat screens all three sites CENTRE the composer, so a few
    // lines of typing legitimately carries its top above the midline - and the
    // clamp then pinned the chip at the midline, on top of the box. It also
    // masked the real bug, turning an obvious flight to the top into a subtle
    // drift that stops somewhere arbitrary.
    //
    // The correct net makes no claim about the host's layout at all. It only
    // says our own element must stay fully on screen, which is true everywhere.
    const h = node.offsetHeight || 34
    node.style.bottom = Math.max(8, Math.min(wanted, window.innerHeight - h - 8)) + 'px'
    node.style.top = 'auto'

    if (place === 'above') {
      const w = node.offsetWidth || 0
      node.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px'
      node.style.right = 'auto'
    } else {
      node.style.left = 'auto'
      node.style.right = Math.max(8, window.innerWidth - r.right + 6) + 'px'
    }
    return true
  }

  function positionChip() {
    const el = findPromptEl()
    if (!el) { chip.classList.remove('show'); return false }
    if (!anchorTo(el, chip, 'right')) { chip.classList.remove('show'); return false }
    return true
  }

  /* ---------- Chip states ---------- */

  // On a Mac the Alt key is labelled Option and printed as ⌥. Telling a Mac
  // user to press "Alt+I" sends them hunting for a key that is not on their
  // keyboard, so show them the symbol that is.
  const IS_MAC = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '')
  const HOTKEY_LABEL = IS_MAC ? '⌥I' : 'Alt+I'

  const IDLE_HTML =
    `<span class="mark">✦</span>Improve<span class="kbd">${HOTKEY_LABEL}</span>`

  /**
   * Guard against re-rendering the chip when nothing changed.
   *
   * syncChip() runs on a 1.2s interval AND on every input event. Every chip
   * renderer sets innerHTML, which destroys the buttons inside and builds new
   * ones - so a click on "why?" could land on an element that had just been
   * replaced out from under the pointer. That is why it used to take two or
   * three clicks to open the panel.
   *
   * Returns true when the caller should actually re-render.
   */
  function chipChanged(signature) {
    if (chip.dataset.sig === signature) return false
    chip.dataset.sig = signature
    return true
  }

  function showIdleChip() {
    if (state.phase === 'working') return
    if (!positionChip()) return
    if (!chipChanged('idle')) return
    chip.className = 'chip show'
    chip.innerHTML = IDLE_HTML
    chip.onclick = onSharpen
    // Re-anchor AFTER the content changed. positionChip() above measured the
    // chip we are replacing, and these states are not the same size.
    reposition()
  }

  // Clear the signature: otherwise re-showing the same state after a hide
  // would be skipped as "unchanged" and the chip would never come back.
  function hideChip() {
    chip.classList.remove('show')
    delete chip.dataset.sig
  }

  function showWorkingChip() {
    positionChip()
    if (!chipChanged('working')) return
    chip.className = 'chip show state-working'
    chip.innerHTML = `<span class="dots"><span></span><span></span><span></span></span>Improving`
    chip.onclick = null
    reposition()
  }

  /**
   * Two moments, one chip: checking whether the prompt is ambiguous, and
   * then waiting for the user to pick an answer. The box is untouched in both.
   *
   * LABEL STABILITY: while we are still deciding whether to ask (phase
   * 'working'), the chip shows the SAME "Improving" busy state as the rewrite
   * itself - identical markup - so the fork check and the streaming rewrite
   * read as one continuous step the user simply waits through. The label only
   * changes to "One quick question" at the one moment the user's options
   * actually change: when a real question with tappable answers is on screen.
   * Before, this flashed "Reading your prompt" for a few hundred ms and then
   * "Improving", two labels nobody could read and nobody could act on.
   */
  function showAskingChip() {
    positionChip()
    if (!chipChanged(`asking|${state.phase}`)) return
    chip.className = 'chip show state-working'
    chip.innerHTML =
      state.phase === 'asking'
        ? `<span class="mark">?</span>One quick question` +
          `<span class="why" id="skip">skip</span>`
        : `<span class="dots"><span></span><span></span><span></span></span>Improving`
    chip.onclick = null
    const skip = $('#skip')
    if (skip) skip.onclick = e => { e.stopPropagation(); skipQuestion() }
    reposition()
  }

  /** They don't want to answer: rewrite anyway, with our best guess. */
  function skipQuestion() {
    if (state.phase !== 'asking') return
    // Against question_shown this is the answer to "is the question welcome or
    // is it in the way?" - the one thing that would tell us ask-first is
    // wrong, if it is.
    track('question_skipped')
    hideForks()
    state.fork = null
    streamSharpenInto(state.before, null)
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
    const tag = state.chosen
      ? `Improved · ${state.chosen}`
      : state.quiet
        ? 'Improved · nothing to ask'
        : 'Improved'
    const n = state.gaps ? state.gaps.length : 0

    if (!chipChanged(`done|${tag}|${n}`)) return

    // If details are still missing, the chip OFFERS them - the journey stays
    // inline. "why?" is only ever reading material, off to the side.
    chip.innerHTML =
      `<span class="mark">✓</span>${escHtml(tag)}` +
      (n
        ? `<span class="why add" id="addgaps">+ ${n} detail${n === 1 ? '' : 's'}</span>`
        : '') +
      `<span class="why" id="why">compare</span>` +
      `<span class="why" id="undo">undo</span>`
    // These sit INSIDE the chip, which is itself a button. A click on any of
    // them also bubbles to the chip - and after undo/compare reset us to idle,
    // the chip's own handler is onSharpen again. That is the bug: clicking
    // "undo" reverted the prompt AND immediately re-improved it, because the
    // one click fired both. stopPropagation keeps each action to itself.
    const bind = (el, fn) => {
      if (!el) return
      el.onclick = e => { e.stopPropagation(); fn() }
    }
    bind($('#addgaps'), openGaps)
    bind($('#why'), openDetails)
    bind($('#undo'), undoSharpen)
    chip.onclick = null
    // The widest state we render, and the one that wraps to two lines on a
    // narrow window. Re-anchor now that it exists, so the questions above it
    // stack off its real height.
    reposition()
  }

  /** Mid-flow: walking the missing details, one question at a time. */
  function showFillingChip() {
    positionChip()
    if (!chipChanged(`filling|${state.gapIndex}`)) return
    chip.className = 'chip show state-working'
    const step = state.gapIndex + 1
    chip.innerHTML =
      `<span class="mark">+</span>Detail ${step} of ${state.gaps.length}` +
      `<span class="why" id="skipall">skip</span>`
    chip.onclick = null
    const s = $('#skipall')
    if (s) s.onclick = e => { e.stopPropagation(); hideForks(); applyGaps() }
    reposition()
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
      btn.type = 'button'
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
    if (el && anchorTo(el, toastEl, 'right')) {
      // Stack ABOVE the chip, never on top of it.
      //
      // The toast and the chip are anchored to the same point by the same
      // function, and the toast is later in the shadow root, so it paints
      // over the chip. finishSharpen calls showDoneChip and then noteHeadroom
      // back to back, so a user near their limit got "2 free improvements
      // left today" covering compare and undo for 1.8s - the toast's own
      // lifetime. That looked exactly like the chip vanishing and returning.
      if (chip.classList.contains('show')) {
        const base = parseFloat(toastEl.style.bottom) || 0
        const lift = base + chip.offsetHeight + 8
        const ceiling = window.innerHeight - toastEl.offsetHeight - 8
        toastEl.style.bottom = Math.max(8, Math.min(lift, ceiling)) + 'px'
      }
    }
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
    // idle    - nothing done yet, Sharpen offered
    // working - a call is in flight (fork check, or the rewrite streaming)
    // asking  - the interpretation question is up, box UNTOUCHED
    // done    - our rewrite is in the box
    // filling - walking the missing details, one inline question at a time
    phase: 'idle',
    /** The user's prompt as it was BEFORE we touched it. What "why?" explains. */
    before: '',
    /** Exactly what we wrote into the box. Used by compare and by the gap
     *  calls. NOT used to decide whether the user has edited it - see
     *  userEdited for why that comparison could never work. */
    after: '',
    /**
     * Has the user typed in the box since we wrote our rewrite into it?
     *
     * THIS REPLACED A STRING COMPARISON, AND THAT IS THE WHOLE BUG.
     *
     * The old test was `readPrompt() === state.after`: the text we wrote,
     * compared against the text read back out. It reads like an identity
     * check. It is not, because the two sides are produced by different
     * systems and neither of them is us.
     *
     * We write with execCommand('insertText'), which hands the string to the
     * host editor. ProseMirror (ChatGPT, Claude) and Quill (Gemini) then
     * normalise it into their own document model: newlines become paragraph
     * nodes, whitespace collapses, empty lines become trailing-break nodes,
     * and input rules can turn "1. " or "- " into real list nodes. We then
     * read it back with innerText, which re-derives a string from RENDERED
     * LAYOUT, not from what we inserted. Block boundaries and list markers
     * come back with different whitespace than we sent.
     *
     * So for any rewrite with structure - and our rewrites are structured by
     * design, with paragraphs, bullets and Assume lines - the two strings
     * differ the moment the host finishes rendering. The comparison was
     * reporting "the user edited this" about text the user had never touched.
     *
     * The 1.2s poll (setInterval(syncChip)) is what made it look like a timer
     * bug: the mismatch appears as soon as the host re-renders, but nothing
     * looks for it until the next tick, so Compare sat there for a second or
     * two and then vanished. Every previous fix moved the timing around. The
     * comparison was the thing that was wrong.
     *
     * An edit is now an EVENT, not a diff. The only thing that can set this
     * is an input event on the host's box that did not come from our own
     * write, which is precisely the definition of "the user typed".
     */
    userEdited: false,
    /** { question, options } when the prompt was genuinely ambiguous. */
    fork: null,
    /** The interpretation the user picked, if any. */
    chosen: '',
    /**
     * True when the fork check found one sensible reading, so we never asked.
     * Staying quiet is the feature, and a feature the user cannot see is
     * indistinguishable from a step that is broken. The chip says so.
     */
    quiet: false,
    /** Details only the user knows, offered on the chip after the rewrite. */
    gaps: null,
    gapIndex: 0,
    gapAnswers: {},
    /** Improvements left after the last one. -1 = unlimited. null = unknown. */
    left: null,
    port: null,
    toastTimer: 0,
  }

  // Say nothing until the user is genuinely close to running out. A counter
  // that is always on screen is nagging; one that appears at the end is
  // useful. This is the only number we ever show.
  const WARN_AT = 2

  /**
   * True while the box still contains our unedited output.
   *
   * This is the re-improve guard: while it holds, Improve is off, because
   * sharpening our own already-sharpened text compounds it into mush. It
   * must cover EVERY phase where our output is sitting in the box, not just
   * 'done'. After a rewrite the flow can be in 'filling' (walking the detail
   * questions) with our text in the box the whole time - and 'filling' used
   * to fall through this guard, so pressing Improve again mid-details
   * re-improved our own output. Both 'done' and 'filling' hold state.after;
   * 'working'/'asking' still hold the user's original, so they stay out.
   */
  function boxHoldsOurOutput() {
    if (state.phase !== 'done' && state.phase !== 'filling') return false
    return !!state.after && !state.userEdited
  }

  /* ---------- Is the ambiguity check worth waiting for? ---------- */

  /**
   * The fork check is a full round trip to a reasoning model before a single
   * word of the rewrite can appear. Measured, it lands at 2-6s. The rewrite
   * itself streams its first token in under a second, so on a clear prompt we
   * spend most of the wait deciding not to ask anything.
   *
   * These patterns are the cheap local answer to "has this person already told
   * us the things we would have asked about?". They are looking for the four
   * gaps the server's own calibration names: audience, output shape, hard
   * constraints, and tone.
   *
   * Deliberately loose. A false positive here (we think it is specific, it was
   * not) costs one unasked question and degrades to what every other prompt
   * tool does anyway. A false negative costs the user the wait they already
   * have today. Neither breaks anything, which is what makes a heuristic
   * acceptable in front of a model call.
   */
  const SIGNALS = [
    // Audience: who is going to read this.
    /\b(audience|readers?|customers?|clients?|students?|beginners?|subscribers?|recruiters?|for (my|our|a|an) \w+|non-?technical)\b/i,
    // Output shape: what the answer should look like.
    /\b(format|formatted|table|bullets?|bulleted|numbered|list|json|markdown|csv|outline|paragraphs?|sections?|headings?|steps?|slides?)\b/i,
    // Hard constraints: a number attached to a unit is the least ambiguous
    // thing a prompt can contain.
    /\b(\d+\s*(words?|characters?|chars?|sentences?|paragraphs?|bullets?|points?|items?|lines?|steps?|examples?|options?)|under \d+|at most \d+|no more than \d+|max(imum)? \d+)\b/i,
    // Tone: named explicitly rather than left to taste.
    /\b(tone|formal|informal|casual|friendly|professional|persuasive|concise|conversational|plain english)\b/i,
    // Structure: line breaks and bullets mean they wrote a brief, not a wish.
    /(\n\s*[-*•]|\n\s*\d+[.)]|\n\n)/,
  ]

  /**
   * Below this, skip nothing. A short prompt can hit two patterns by accident
   * ("write a professional email") while still being exactly the topic-only
   * request the server calls ambiguous. Length is not evidence of quality, but
   * its absence is decent evidence of a missing brief.
   */
  const SPECIFIC_MIN_CHARS = 200
  const SPECIFIC_MIN_SIGNALS = 2

  function needsForkCheck(prompt) {
    if (prompt.length < SPECIFIC_MIN_CHARS) return true
    let hits = 0
    for (const re of SIGNALS) {
      if (re.test(prompt)) hits++
      if (hits >= SPECIFIC_MIN_SIGNALS) return false
    }
    return true
  }

  async function onSharpen() {
    if (state.phase === 'working') return

    // Never sharpen our own output - it compounds into mush. The box
    // already holds a sharpened prompt: offer the explanation instead.
    if (boxHoldsOurOutput()) {
      toast('Already improved. Add the details only you know.', {
        action: { label: 'Finish it', onClick: openDetails },
      })
      return
    }

    await loadAuth()

    if (authState.tier === 'anon' && anonCount >= ANON_FREE_TRIES) {
      // They have used the free tries and liked it enough to come back, so
      // this is the moment to ask. Name what they get, not what they lost -
      // and name it as a number, because "10 a day" is the offer.
      toast(`Sign in free for ${DAILY_LIMIT} improvements a day.`, {
        action: { label: 'Sign in', onClick: openConnect },
      })
      return
    }

    const prompt = readPrompt()
    if (!prompt || prompt.length < 3) { toast('Type a prompt first'); return }

    // Fail here, not after a round trip. The server rejects anything over
    // MAX_PROMPT_CHARS, and we used to let the request go anyway - so the user
    // waited for the network to tell us a fact we already knew, and got back
    // "Something went wrong on our end", which is both untrue and unactionable
    // (retrying the same long prompt fails identically, forever).
    if (prompt.length > MAX_PROMPT_CHARS) {
      toast(tooLongMessage(prompt.length))
      return
    }

    // The denominator. Every ratio worth knowing - how many improves get sent,
    // how many get undone, how often we ask - is measured against this.
    track('improve_started')

    state.before = prompt
    state.fork = null
    state.chosen = ''
    state.quiet = false
    // We have just taken a snapshot of what they typed, so their typing up to
    // this moment is accounted for. Anything after this is a genuine edit, and
    // during 'asking' that is what makes the question stale.
    state.userEdited = false
    hideForks()

    // ASK FIRST, then rewrite ONCE.
    //
    // We used to rewrite immediately and ask afterwards, to save latency.
    // That was wrong: the user watched a rewrite land, got asked a
    // question, then watched it get rewritten AGAIN. The first rewrite was
    // built on a guess and thrown away - it flickered, and it made the tool
    // look like it didn't know what it was doing. A question that arrives
    // after the answer is worthless.
    //
    // So the fork check GATES the rewrite. An ambiguous prompt waits and sees
    // a question; a clear prompt goes straight to the rewrite. Either way the
    // box is written exactly once.
    //
    // The gate is right and the bill for it was not. Every prompt paid a
    // 2-6s reasoning round trip to find out whether we had anything to ask,
    // including the many that had already answered it. A prompt that names
    // its audience, its shape and its limits does not need a model to
    // confirm it is unambiguous, so it no longer waits for one and streams
    // in under a second like it used to.
    //
    // Everything short or thin still goes through the check, which is the
    // half where the question is worth the wait.
    if (!needsForkCheck(prompt)) {
      streamSharpenInto(prompt, null)
      return
    }

    state.phase = 'working'
    showAskingChip()

    chrome.runtime.sendMessage(
      { type: 'DEEPCLARIO_FORK', prompt, token: authState.token },
      resp => {
        // Prompt changed under us (user kept typing) - abandon quietly.
        if (state.before !== prompt || state.phase !== 'working') return

        const f = resp && resp.ok ? resp.data : null
        const ambiguous = f && f.question && Array.isArray(f.options) && f.options.length >= 2

        if (ambiguous) {
          // Ask. The box stays untouched until they answer.
          state.fork = f
          state.phase = 'asking'
          showAskingChip()
          showForks(f)
          return
        }
        // Clear enough: rewrite it, once, and say nothing.
        //
        // This is the numerator of the silence rate. Without it the only
        // thing we could measure was how often we DID ask, which looks the
        // same whether the engine is being disciplined or simply broken.
        track('question_none')
        state.quiet = true
        streamSharpenInto(prompt, null)
      }
    )
  }

  /**
   * Runs the streaming sharpen and writes it into the box live.
   * `choice` is set when the user picked an interpretation from the chips -
   * the server treats it as ground truth and does not re-charge quota.
   */
  function streamSharpenInto(prompt, choice) {
    state.phase = 'working'
    showWorkingChip()

    // Count the anonymous try here, not when Sharpen was pressed: a user
    // who gets a question and walks away never got a rewrite, so they
    // shouldn't have spent a try on it.
    if (authState.tier === 'anon') bumpAnon()

    const port = chrome.runtime.connect({ name: 'DEEPCLARIO_SHARPEN' })
    state.port = port
    let acc = ''
    let firstDelta = true

    port.onMessage.addListener(msg => {
      if (msg.type === 'META') {
        // How much headroom is left. -1 means unlimited (Pro), null means
        // we don't know - in both cases we say nothing.
        state.left = typeof msg.left === 'number' ? msg.left : null
      } else if (msg.type === 'DELTA') {
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

  /**
   * They answered. NOW we rewrite - once, committed to what they meant.
   * The box has been untouched until this moment.
   */
  function chooseFork(option) {
    track('question_answered')
    hideForks()
    state.fork = null
    state.chosen = option.label
    // A typed answer has no summary - do not tack on a trailing " - " for it.
    const choice = option.summary ? `${option.label} - ${option.summary}` : option.label
    streamSharpenInto(state.before, choice)
  }

  /**
   * The clarifying question, inline. This is the whole point: the user gets
   * the ONE question that changes their result, right where they are, as
   * buttons. No panel, no report, nothing to opt into.
   */
  function showForks(fork) {
    // How often the prompt was genuinely ambiguous. Also the denominator that
    // tells us whether the local pre-gate is skipping the check on prompts it
    // should not - if this rate collapses, the heuristic is too eager.
    track('question_shown')
    renderChoices({
      question: fork.question,
      options: fork.options,
      raw: true, // chooseFork wants the whole option, not just its label
      onPick: chooseFork,
      // The blocking question is the highest-stakes one - it aims the whole
      // rewrite. If none of the readings fit, the user must be able to say so
      // in their own words, not be forced to pick the closest wrong one. Route
      // a typed answer through the same path as a tap.
      onType: text => chooseFork({ label: text, summary: '' }),
      typeable: true,
      onSkip: skipQuestion,
    })
  }

  /**
   * The shared inline chooser: a question and tappable answers, anchored to
   * the prompt box. Used for BOTH the interpretation question (before the
   * rewrite) and the missing details (after it). Everything the user has to
   * decide happens here, in their workflow - never in a panel.
   */
  function renderChoices(cfg) {
    const el = findPromptEl()
    if (!el) return
    forksEl.innerHTML = ''

    const q = document.createElement('div')
    q.className = 'q'
    const qt = document.createElement('span')
    qt.textContent = cfg.question
    const qx = document.createElement('button')
    qx.type = 'button'
    qx.className = 'qx'
    qx.textContent = '×'
    qx.setAttribute('aria-label', 'Skip')
    qx.addEventListener('click', () => { if (cfg.onSkip) cfg.onSkip() })
    q.appendChild(qt)
    q.appendChild(qx)
    forksEl.appendChild(q)

    if (cfg.hint) {
      const h = document.createElement('div')
      h.className = 'hint'
      h.textContent = cfg.hint
      forksEl.appendChild(h)
    }

    ;(cfg.options || []).forEach((o, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'fork'
      const label = document.createElement('b')
      const num = document.createElement('i')
      num.className = 'n'
      num.textContent = String(i + 1)
      label.appendChild(num)
      label.appendChild(document.createTextNode(o.label))
      b.appendChild(label)
      if (o.summary) {
        const sum = document.createElement('span')
        sum.textContent = o.summary
        b.appendChild(sum)
      }
      b.addEventListener('click', () => cfg.onPick(cfg.raw ? o : o.label))
      forksEl.appendChild(b)
    })

    // Their own words. The taps are a shortcut, never a cage.
    if (cfg.typeable) {
      const own = document.createElement('input')
      own.className = 'own'
      own.type = 'text'
      own.placeholder = 'or type your own…'
      own.addEventListener('keydown', e => {
        e.stopPropagation()

        // preventDefault is NOT optional here. Without it, pressing Enter to
        // submit your typed answer let the keystroke through to ChatGPT, which
        // SENT the prompt - the user never asked for that, and their half
        // finished prompt was gone. stopPropagation alone does not help: it
        // stops the event bubbling, but not the browser's default action, and
        // the host page listens on document anyway.
        if (e.key === 'Enter') {
          e.preventDefault()
          const v = own.value.trim()
          if (v && cfg.onType) cfg.onType(v)
        }
        // Esc closes our question, it must never reach the host page either.
        if (e.key === 'Escape') e.preventDefault()
      })
      forksEl.appendChild(own)
    }

    forksEl.classList.add('show')
    positionForks()
  }

  /**
   * The question chips sit above the chip, which sits above the composer. Same
   * rect as anchorTo - the VISIBLE composer, never the editable.
   */
  function positionForks() {
    const el = findPromptEl()
    if (!el || !forksEl.classList.contains('show')) return
    const r = composerRect(el)

    if (!r || r.bottom <= 0 || r.top >= window.innerHeight) {
      forksEl.classList.remove('show')
      return
    }

    forksEl.style.left = 'auto'
    forksEl.style.right = Math.max(8, window.innerWidth - r.right) + 'px'

    // Clear the chip by its MEASURED height, not a hardcoded 48. The done chip
    // ("Improved · X", "+ 2 details", "compare", "undo") wraps to two lines on a
    // narrow window, and 48 then put the questions on top of it.
    const chipH = chip.classList.contains('show') ? chip.offsetHeight + 8 : 0
    const wanted = window.innerHeight - r.top + GAP_ABOVE_BOX + chipH

    // Same net as anchorTo: stay fully on screen, claim nothing about the host.
    const maxBottom = window.innerHeight - forksEl.offsetHeight - 8
    forksEl.style.bottom = Math.max(8, Math.min(wanted, maxBottom)) + 'px'
    forksEl.style.top = 'auto'
  }

  function hideForks() {
    forksEl.classList.remove('show')
    forksEl.innerHTML = ''
  }

  function finishSharpen(result) {
    const clean = (result || '').trim()
    if (clean) {
      track('improve_finished')
      writePrompt(clean)
      state.after = clean
      state.phase = 'done'
      // The box now holds OUR text, untouched. Clearing here is what makes
      // the flag mean "edited since we wrote", not "typed at some point" -
      // the user necessarily typed before pressing Improve, and without this
      // the done chip would dismiss itself on the very next tick.
      state.userEdited = false
      hideForks()
      showDoneChip()
      noteHeadroom()
      fetchGaps(clean)
    } else {
      // Empty stream: leave the user's prompt untouched.
      writePrompt(state.before)
      resetToIdle()
      toast('Could not improve that. Try again.')
    }
  }

  /**
   * The only place we ever mention limits.
   *
   * Silent while there is plenty left. A quiet, factual line when the user
   * is nearly out. No meter, no bar, no colour alarm, no upsell - they have
   * not hit anything yet, and nagging someone who is still working is how
   * you lose them. The upgrade ask comes later, when it is actually
   * relevant (see onSharpenError -> quota).
   */
  function noteHeadroom() {
    const left = state.left

    // Anonymous users have no headroom to report - they are not on a plan,
    // so there is no count and nothing to confirm. Say nothing, whatever the
    // header happened to carry. (The server now omits the header for anon, so
    // left is already null here; this is the belt-and-braces client guard.)
    if (authState.tier === 'anon') return

    // Pro (-1): confirm the benefit exactly once, ever, then never again.
    if (left === -1) {
      if (!prefs.proSeen) {
        prefs.proSeen = true
        try { chrome.storage.local.set({ dc_pro_seen: true }) } catch {}
        toast('Pro: unlimited improvements.', { good: true })
      }
      return
    }

    // Unknown, anonymous, or plenty left: say nothing.
    if (typeof left !== 'number' || left > WARN_AT) return

    // Nearly out for today. Say the number and nothing else - they are
    // mid-task, and this is information, not an interruption. The upgrade
    // ask waits until they actually hit the limit.
    if (left <= 0) {
      toast('That was your last free improvement today.', {
        action: { label: 'Get unlimited', url: LINKS.pricing },
      })
      return
    }

    toast(`${left} free improvement${left === 1 ? '' : 's'} left today`)
  }

  /* ---------- Gaps: the details only the user knows ---------- */
  // A rewrite cannot invent facts the user never gave - your goal, your
  // deadline, who reads it. So after the rewrite lands we ask for those.
  //
  // AFTER, not before. Asking three questions up front means three chances to
  // abandon before the user has seen a single result, and questions like "how
  // long should it be?" are vague when asked cold against a one-line prompt -
  // they only become obvious once you can see a draft that lacks a length.
  // Only the ambiguity question (quick-fork) is worth blocking on, because
  // getting THAT wrong aims the whole rewrite at the wrong target.
  //
  // The details are OFFERED, never forced. When they arrive, the finished
  // "Improved" chip grows a "+ N details" button; clicking it walks them one
  // at a time. We deliberately do not auto-open them: jumping straight into
  // "Detail 1 of N" hid compare and undo, so the user never got to see or
  // reverse the rewrite first. The rewrite in the box is already usable if
  // they never add a single detail.

  function fetchGaps(sharpened) {
    const forPrompt = state.before
    chrome.runtime.sendMessage(
      {
        type: 'DEEPCLARIO_EXPLAIN',
        original: forPrompt,
        sharpened,
        token: authState.token,
      },
      resp => {
        // Stale (they moved on) or nothing worth asking - stay quiet.
        if (!resp || !resp.ok || !resp.data) return
        if (state.before !== forPrompt || state.phase !== 'done') return
        const gaps = (resp.data.gaps || []).filter(g => g && g.question)
        if (!gaps.length) return
        state.gaps = gaps
        state.gapAnswers = {}

        // Land on the finished state and OFFER the details there - never
        // hijack into them. Auto-jumping straight into "Detail 1 of N" hid
        // compare and undo, so the user never got to see or reverse the
        // rewrite before being asked more questions. The done chip already
        // renders "+ N details" as a real button (wired to openGaps); the
        // user chooses to add them, or sends the prompt as it is.
        showDoneChip()
      }
    )
  }

  /** Walk the gaps one at a time, as inline chips. */
  function openGaps() {
    if (!state.gaps || !state.gaps.length) return

    // Only ask if our rewrite is still sitting in the box, untouched. If they
    // already hit Enter, or started editing it themselves, questions popping
    // up would be an interruption rather than an offer.
    if (!boxHoldsOurOutput()) return

    state.phase = 'filling'
    state.gapIndex = 0
    showGap()
  }

  function showGap() {
    const g = state.gaps[state.gapIndex]
    if (!g) { applyGaps(); return }

    showFillingChip()
    renderChoices({
      question: g.question,
      hint: g.why,
      options: (g.examples || []).map(ex => ({ label: ex, summary: '' })),
      onPick: v => {
        state.gapAnswers[g.label] = v
        nextGap()
      },
      onType: v => {
        state.gapAnswers[g.label] = v
        nextGap()
      },
      onSkip: nextGap,
      typeable: true,
    })
  }

  function nextGap() {
    state.gapIndex += 1
    if (state.gapIndex >= state.gaps.length) applyGaps()
    else showGap()
  }

  /** Fold whatever they answered into the prompt, in place. */
  function applyGaps() {
    hideForks()
    const list = Object.keys(state.gapAnswers).map(label => ({
      label,
      answer: state.gapAnswers[label],
    }))

    if (!list.length) {
      // They skipped everything. Leave the prompt exactly as it was.
      state.gaps = null
      state.phase = 'done'
      showDoneChip()
      return
    }

    state.phase = 'working'
    showWorkingChip()

    chrome.runtime.sendMessage(
      {
        type: 'DEEPCLARIO_EXPLAIN',
        original: state.before,
        sharpened: state.after,
        answers: list,
        token: authState.token,
      },
      resp => {
        if (!resp || !resp.ok || !resp.data || !resp.data.prompt) {
          state.phase = 'done'
          showDoneChip()
          toast('Could not add that. Your prompt is unchanged.')
          return
        }
        const clean = resp.data.prompt.trim()
        writePrompt(clean)
        state.after = clean
        state.gaps = null
        state.phase = 'done'
        // Same reason as finishSharpen: our text, freshly written, unedited.
        state.userEdited = false
        showDoneChip()
        toast('Added to your prompt', { good: true })
      }
    )
  }

  function resetToIdle() {
    state.phase = 'idle'
    state.after = ''
    state.fork = null
    state.chosen = ''
    state.quiet = false
    state.gaps = null
    state.gapIndex = 0
    state.gapAnswers = {}
    // The box is the user's again, so nothing is pending an edit. Leaving
    // this set would make the NEXT rewrite think it had already been edited
    // and dismiss its own chip instantly.
    state.userEdited = false
    hideForks()
    showIdleChip()
  }

  function onSharpenError(msg) {
    // Counts every failure the same way, including the quota and sign-in walls
    // that are working as designed. improve_started minus improve_finished is
    // otherwise a number with no explanation in it.
    track('improve_failed')
    // Restore what the user had; never leave the box half-written.
    writePrompt(state.before)
    resetToIdle()

    // Every blocking error gets a one-click way out.
    if (msg.error === 'quota') {
      // The conversion moment, and the easiest one to get wrong.
      //
      // Name the limit, then say when the next one is back. "You're out"
      // reads as punishment; "that was today's 10, the next is back at 4pm"
      // is the same fact as a pause, which is the truth and lands far
      // better. One clean way out, no guilt, no second button.
      toast(`That was your ${DAILY_LIMIT} free improvements for today. ${resetPhrase(msg.resetAt)}`, {
        action: { label: 'Get unlimited', url: LINKS.pricing },
      })
    } else if (msg.error === 'daily_capacity') {
      // NOT the same as rate_limited, and it used to be told as if it were.
      // This is the whole site's free allowance for the day, not this person
      // going too fast, and "wait a moment" is wrong by about sixteen hours.
      // An account carries its own allowance, which is the real way out.
      toast(
        `That is today's free improvements used up, across everyone. ${
          resetPhrase(msg.resetAt) || 'It resets at midnight UTC.'
        }`,
        { action: { label: 'Connect account', onClick: openConnect } }
      )
    } else if (msg.error === 'identity_unavailable') {
      // We could not read their account. Not a limit, not their fault, and
      // usually over in a minute. Saying "wait a moment" is correct here,
      // which is exactly why it must not also be said for the daily ceiling.
      toast('We are having trouble reaching your account. Nothing was used up. Try again shortly.')
    } else if (msg.error === 'rate_limited') {
      toast('Too many requests. Wait a moment, then try again.', {
        action: { label: 'Connect account', onClick: openConnect },
      })
    } else if (msg.error === 'prompt_too_long') {
      // Backstop for when the client cap and the server cap drift apart. This
      // is a user-side problem, so it must never be reported as our outage.
      toast(tooLongMessage(state.before ? state.before.length : MAX_PROMPT_CHARS + 1))
    } else if (msg.error === 'network') {
      toast('Network hiccup. Check your connection and try again.')
    } else {
      toast('Something went wrong on our end. Try again.')
    }
  }

  /**
   * "They come back at 4:15pm" beats "resets in 47.3 hours" - nobody wants
   * to do arithmetic to find out when they can work again. Falls back to
   * saying nothing rather than guessing wrong.
   */
  function resetPhrase(iso) {
    if (!iso) return ''
    const t = new Date(iso)
    if (isNaN(t.getTime())) return ''
    const hours = (t.getTime() - Date.now()) / 3_600_000
    if (hours <= 0) return 'Try again now.'
    if (hours < 12) {
      const time = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      return `You can improve again at ${time}.`
    }
    if (hours < 36) return 'You can improve again tomorrow.'
    return `You can improve again in ${Math.round(hours / 24)} days.`
  }

  function undoSharpen() {
    if (state.phase !== 'done') return
    // The other half of the verdict. Taking their own words back is the
    // clearest rejection the product can receive, and it was as unrecorded as
    // the acceptance.
    track('rewrite_undone')
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

    // Do not open the paste box. The connect page hands the token straight to
    // the background worker when the user clicks Approve, and storage tells
    // us the moment it lands - so the normal path needs no box at all.
    // Showing one up front would be telling the user to do a job we are
    // already doing for them.
    //
    // The box still exists for the cases the handoff cannot cover (page
    // cannot see the extension, so it offers a code instead). This toast is
    // its only door: without it the fallback would be unreachable, which is
    // the same as not having one.
    watchForConnect()
    toast('Approve it in the tab we opened. You will come back signed in.', {
      action: { label: 'Got a code instead?', onClick: showConnectBox },
    })
  }

  /**
   * Wait for the token to arrive from the connect page.
   *
   * chrome.storage fires in every context, so the background worker writing
   * the token IS the signal - no polling, no message plumbing between the
   * page and this script. We only listen while a connect is plausibly in
   * flight, and stop after ten minutes so an abandoned attempt does not
   * leave a listener attached for the life of the tab.
   */
  function watchForConnect() {
    if (connectWatcher) return

    const onChange = (changes, area) => {
      if (area !== 'local' || !changes.dc_token) return
      const token = changes.dc_token.newValue
      if (!token) return

      stopWatchingForConnect()
      authState.token = token
      authState.tier = 'free'
      hideConnectBox()

      // Say it plainly. The user approved in another tab and came back here;
      // without this they would have to guess whether it worked.
      toast('Connected. Your account is in use.', { good: true })
      syncChip()
    }

    try {
      chrome.storage.onChanged.addListener(onChange)
      connectWatcher = onChange
      setTimeout(stopWatchingForConnect, 10 * 60 * 1000)
    } catch {}
  }

  function stopWatchingForConnect() {
    if (!connectWatcher) return
    try { chrome.storage.onChanged.removeListener(connectWatcher) } catch {}
    connectWatcher = null
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
      <div class="chelp">Only needed if the site could not connect you automatically. Paste the <b>dc_…</b> code from deepclario.com.</div>
      <div class="crow">
        <input class="cinput" id="ctoken" type="text" placeholder="dc_…" autocomplete="off" spellcheck="false" />
        <button class="cbtn" id="csave">Connect</button>
      </div>
      <div class="cerr" id="cerr"></div>
      <button class="cclose" id="cclose" aria-label="Close">×</button>
    `
    root.appendChild(box)
    anchorTo(el, box, 'above')

    const input = box.querySelector('#ctoken')
    const err = box.querySelector('#cerr')
    input.focus()

    const submit = () => {
      if (saveToken(input.value)) {
        hideConnectBox()
        toast('Account connected. Go ahead.', { good: true })
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

  /* ---------- The "why?" panel: explanation only ---------- */
  // It explains the sharpen that already happened - what was weak, what
  // changed, what we could NOT fix. It never rewrites and never asks a
  // question: the question is asked inline, before the rewrite.

  function openDetails() {
    // Always pass the ORIGINAL prompt and what we wrote. Explaining our own
    // output would be nonsense ("clarity 88 -> 88").
    const original = state.before || readPrompt()
    openPanel(original, boxHoldsOurOutput() ? state.after : null)
  }

  /* ---------- Triggers ---------- */

  // Global hotkey. Unclaimed on all three sites.
  //
  // MUST match on e.code, not e.key. On macOS, Option+I is a DEAD KEY: the OS
  // swallows it to compose an accent, so the browser reports e.key as "ˆ",
  // never "i". Checking e.key meant the shortcut did not exist on a Mac at all.
  // e.code reports the physical key whatever character the OS produces, so one
  // check covers Windows, Mac, Linux and every keyboard layout. The e.key
  // check stays as a fallback for anything that does not send a code.
  window.addEventListener(
    'keydown',
    e => {
      const el = findPromptEl()
      const inBox = el && (document.activeElement === el || el.contains(document.activeElement))

      // Alt+I on Windows/Linux, Option+I on a Mac. One check for everyone:
      // e.code is the PHYSICAL key, so it does not care which character the
      // OS or the keyboard layout produces.
      //
      // The ctrl/meta exclusions are not paranoia. On German, Polish, Spanish
      // and other European layouts, AltGr (the right Alt key) types @ € { } -
      // and browsers report AltGr as ctrlKey AND altKey together. Without this,
      // a German user typing an @ would fire the shortcut by accident.
      const isImproveKey =
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.code === 'KeyI' || e.key === 'i' || e.key === 'I')

      if (isImproveKey) {
        if (readPrompt()) { e.preventDefault(); onSharpen() }
        return
      }
      // If the user is typing INTO one of our own fields ("or type your own",
      // the connect box), the number shortcuts must not fire. Otherwise typing
      // "2 people" as an answer silently picks option 2 and throws the rest
      // away. Our UI lives in a shadow root, so activeElement on the document
      // is the host element itself.
      const typingInOurUI =
        document.activeElement === host &&
        root.activeElement &&
        root.activeElement.tagName === 'INPUT'
      if (typingInOurUI) return

      // While a question is up: 1/2/3 picks an answer, Esc skips it.
      // Keeps the whole flow on the keyboard - never forces a reach for
      // the mouse mid-thought.
      if (state.phase === 'asking' && state.fork) {
        if (e.key === 'Escape') {
          e.preventDefault()
          skipQuestion()
          return
        }
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= state.fork.options.length) {
          e.preventDefault()
          chooseFork(state.fork.options[n - 1])
          return
        }
      }

      // Same keys while filling in the missing details: 1/2/3 answers,
      // Esc skips the rest. The whole flow stays on the keyboard.
      if (state.phase === 'filling' && state.gaps) {
        if (e.key === 'Escape') {
          e.preventDefault()
          hideForks()
          applyGaps()
          return
        }
        const g = state.gaps[state.gapIndex]
        const n = parseInt(e.key, 10)
        if (g && g.examples && n >= 1 && n <= g.examples.length) {
          e.preventDefault()
          state.gapAnswers[g.label] = g.examples[n - 1]
          nextGap()
          return
        }
      }
      // Esc undoes while our output is still untouched in the box.
      if (e.key === 'Escape' && boxHoldsOurOutput()) {
        e.preventDefault()
        undoSharpen()
        return
      }
      // The user sent the prompt. The host clears its own box, but on its own
      // schedule (React re-render), so a single 60ms check was a guess that
      // often fired too early: we would still see text, stay in 'done', and
      // leave our questions hovering over a prompt that had already been sent.
      // Check a few times instead.
      if (inBox && e.key === 'Enter' && !e.shiftKey && state.phase !== 'idle') {
        hideForks()
        for (const ms of [60, 200, 500, 1000]) setTimeout(syncChip, ms)
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
      // Box empty. This is the verdict, and until now we threw it away.
      //
      // The box holding our rewrite one tick and being empty the next means
      // they hit Enter: they kept what we wrote and sent it. That is the only
      // honest measure of whether a rewrite was any good, and it is the number
      // the whole product should be judged on.
      //
      // Fired before resetToIdle, which clears the state this reads. Firing it
      // twice is not possible: resetToIdle moves the phase to 'idle', and the
      // 1.2s tick that follows takes the early return above.
      //
      // Imperfect on purpose. Navigating to a new chat also empties the box
      // and will read as an accept. That overcounts a little and it is still
      // the best signal available without watching the send button on three
      // sites that redesign it constantly.
      if ((state.phase === 'done' || state.phase === 'filling') && state.after) {
        track(state.userEdited ? 'rewrite_edited' : 'rewrite_accepted')
      }
      if (state.phase !== 'idle') resetToIdle()
      hideChip()
      return
    }

    // Every branch below asks the same question - "has the user taken this
    // prompt back off us?" - and every branch used to answer it by comparing
    // strings the host is free to rewrite underneath us. They all read the
    // edit FLAG now. Nothing here dismisses the chip on a timer, because
    // nothing here is allowed to guess at intent from text.

    if (state.phase === 'asking') {
      // A question is on screen and the box is untouched. If they typed
      // instead of answering, the question is stale - drop it.
      if (state.userEdited) { resetToIdle(); return }
      showAskingChip()
      positionForks()
      return
    }

    if (state.phase === 'filling') {
      // Mid-way through the missing details. If they edited our rewrite
      // themselves, abandon the flow - it is their prompt again.
      if (state.userEdited) { resetToIdle(); return }
      positionForks()
      return
    }

    if (state.phase === 'done') {
      // The sticky done chip, carrying compare and undo. It stays until the
      // user types, sends, or dismisses it. It does NOT expire.
      if (!state.userEdited) { showDoneChip(); return }
      // They edited it. It's their prompt again - offer to improve.
      resetToIdle()
      return
    }

    showIdleChip()
  }

  /**
   * ONE batched pass that re-anchors everything we have floating.
   *
   * Batched into a frame for two reasons. It stops us reading layout and
   * writing styles synchronously inside a ResizeObserver callback, which is
   * what produces "ResizeObserver loop completed with undelivered
   * notifications" and a frame of thrash on every keystroke. And it means the
   * chip, the questions and the connect box all position from ONE measurement
   * of the composer (see the rectCache), so they cannot disagree with each
   * other mid-resize.
   *
   * The connect box is included because it was anchored once, at creation, and
   * never again - leave it open and type, and it stayed where the box used to
   * be.
   */
  let repositionFrame = 0
  function reposition() {
    if (repositionFrame) return
    repositionFrame = requestAnimationFrame(() => {
      repositionFrame = 0
      if (chip.classList.contains('show')) positionChip()
      positionForks()
      const box = root.querySelector('#connect')
      if (box) {
        const el = findPromptEl()
        if (el) anchorTo(el, box, 'above')
      }
    })
  }

  /**
   * The one place an edit is recorded. An input event on the host page that
   * did not come from our own write IS the user typing - there is nothing to
   * infer and nothing to compare.
   *
   * Two events must not count:
   *  - our own writes, caught by the synchronous selfWriting flag
   *  - typing inside OUR shadow UI (the "or type your own" box, the connect
   *    field). Those retarget to the host element on the way out, and this
   *    listener is on document in the CAPTURE phase, so it sees them before
   *    the host's own stopPropagation can. Without this check, answering a
   *    gap question would count as editing the prompt and kill the chip.
   */
  document.addEventListener('focusin', syncChip, true)
  document.addEventListener(
    'input',
    e => {
      if (!selfWriting && e.target !== host) state.userEdited = true
      syncChip()
    },
    true
  )
  // Capture, so we also hear the composer's OWN inner scroller, not just the
  // page. Scroll events do not bubble; capture from window still sees them.
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', () => { syncChip(); reposition() })
  setInterval(syncChip, 1200)

  /**
   * Reposition the moment the composer changes SIZE.
   *
   * We watch the editable AND the shell. The editable tells us the text grew;
   * the shell tells us the visible box grew. They stop agreeing at exactly the
   * point this bug used to appear - the composer's max-height, after which the
   * text keeps growing and the box does not. Watching only the editable meant
   * we kept firing on growth that no longer moved anything we anchor to, and
   * never fired on shell-only changes (an attachment chip appearing).
   *
   * These SPAs swap the composer out on navigation, so re-target when the
   * elements we are watching are no longer the live ones.
   */
  let observedEls = []
  const boxResizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reposition) : null

  function watchPromptBox() {
    if (!boxResizeObserver) return
    const el = findPromptEl()
    const next = []
    if (el) {
      next.push(el)
      const shell = shellElement(el)
      if (shell && shell !== el) next.push(shell)
    }

    const same =
      next.length === observedEls.length && next.every((n, i) => n === observedEls[i])
    if (same) return

    for (const n of observedEls) {
      try { boxResizeObserver.unobserve(n) } catch {}
    }
    observedEls = next
    for (const n of next) boxResizeObserver.observe(n)
    reposition()
  }

  watchPromptBox()
  setInterval(watchPromptBox, 1200)

  /* ---------- Panel wiring ---------- */
  // Built ONCE, eagerly, at startup. It used to be built lazily on the
  // first "why?" click - but buildPanel() bailed silently if panel.js
  // hadn't defined createDetailsPanel yet, leaving panelApi null. That is
  // why "why?" needed two or three clicks before the panel appeared.
  let panelApi = null
  function buildPanel() {
    if (panelApi) return true
    if (typeof window.createDetailsPanel !== 'function') return false
    panelApi = window.createDetailsPanel({
      root,
      authState,
      LINKS,
      onConnect: openConnect,
      onDisconnect: disconnect,
      // The one action the panel has: hand the user their own words back.
      // The prompt box holds a single version, so once we overwrite it their
      // original survives nowhere else on screen.
      onRestore: () => {
        writePrompt(state.before)
        resetToIdle()
        toast('Your original is back')
      },
    })
    return true
  }

  // panel.js is listed before content.js in the manifest, so this normally
  // succeeds immediately. The retry is a belt-and-braces guard against load
  // ordering surprises - the panel must never need a second click.
  if (!buildPanel()) setTimeout(buildPanel, 300)

  function openPanel(original, sharpened) {
    if (buildPanel()) panelApi.open(original, sharpened)
    else window.open(LINKS.app, "_blank", "noopener")
  }
})()
