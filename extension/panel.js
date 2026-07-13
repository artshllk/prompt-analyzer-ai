// Deepclario extension - the read-only "why" panel.
//
// THE WHOLE USER JOURNEY LIVES ON THE INLINE CHIP. Sharpening, the
// interpretation question, and filling in the missing details all happen
// next to the prompt box, without ever leaving the chat. That is the
// product.
//
// This panel is NOT part of that journey. It is optional reading, for the
// user who is curious WHY their prompt changed and wants to learn. It has
// no buttons that alter the prompt - open it, read it, close it. If it ever
// grows an action, the journey has leaked out of the workflow again.

window.createDetailsPanel = function createDetailsPanel(ctx) {
  const { root, authState, LINKS, onConnect, onDisconnect } = ctx

  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <style>
      .dc-overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(0,0,0,.5); display: none;
      }
      .dc-overlay.open { display: block; }
      .dc-panel {
        position: fixed; top: 0; right: 0; height: 100%;
        width: 400px; max-width: 92vw; background: #0E0E10;
        color: #F5F4F1; border-left: 1px solid rgba(245,244,241,.14);
        transform: translateX(100%); transition: transform .3s cubic-bezier(.16,1,.3,1);
        display: flex; flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      }
      .dc-overlay.open .dc-panel { transform: translateX(0); }
      .dc-head {
        padding: 18px 20px 0; flex-shrink: 0;
      }
      .dc-body { padding: 0 20px 20px; overflow-y: auto; flex: 1; }
      .dc-row { display: flex; align-items: center; justify-content: space-between; }
      .dc-eyebrow { font-size: 10.5px; letter-spacing:.16em; text-transform: uppercase; color: #6b6a66; font-weight: 600; }
      .dc-x { background:none;border:none;color:#A8A6A0;cursor:pointer;font-size:20px;line-height:1;padding:4px; }
      .dc-x:hover { color:#F5F4F1; }
      .dc-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:#F5F4F1;margin:0 2px;animation:dcd 1.2s infinite}
      .dc-dots span:nth-child(2){animation-delay:.18s}.dc-dots span:nth-child(3){animation-delay:.36s}
      @keyframes dcd{0%,100%{opacity:.25}50%{opacity:1}}
      .dc-err{color:#E08A8A;font-size:13px;line-height:1.5}
      .dc-muted { color:#A8A6A0; font-size:12.5px; line-height:1.55; }

      /* Hero: the score, and the ONE line that matters. */
      .dc-hero { padding: 18px 0 4px; }
      .dc-scorerow { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
      .dc-num { font-size:26px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1; }
      .dc-num.lo{color:#E08A8A} .dc-num.mid{color:#D9A45B} .dc-num.hi{color:#7FC79A}
      .dc-bar { flex:1; height:4px; border-radius:2px; background:rgba(245,244,241,.10); overflow:hidden; }
      .dc-bar i { display:block; height:100%; border-radius:2px; transition: width .5s cubic-bezier(.16,1,.3,1); }
      .dc-bar i.lo{background:#E08A8A} .dc-bar i.mid{background:#D9A45B} .dc-bar i.hi{background:#7FC79A}
      .dc-headline { font-size:15px; font-weight:600; line-height:1.4; margin:0; }

      /* A gap: named, not asked. Answering happens on the chip, inline. */
      .dc-gap {
        border-top: 1px solid rgba(245,244,241,.10);
        padding: 16px 0 14px;
      }
            .dc-q { font-size:13.5px; font-weight:600; margin:0 0 3px; display:flex; align-items:center; gap:6px; }
      .dc-why { font-size:11.5px; color:#6b6a66; margin:0 0 10px; }


      .dc-foot{padding:12px 20px;border-top:1px solid rgba(245,244,241,.08);display:flex;gap:14px;flex-wrap:wrap;flex-shrink:0}
      .dc-foot a{color:#5a5a56;font-size:11px;text-decoration:none}
      .dc-foot a:hover{color:#A8A6A0}
      .dc-acct{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
      .dc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em;color:#6b6a66;border:1px solid rgba(245,244,241,.14)}
      .dc-badge.pro{background:#F5F4F1;color:#0E0E10;border-color:transparent}
      .dc-link{background:none;border:none;color:#6b6a66;font-size:11px;cursor:pointer;padding:2px 0;text-decoration:underline;text-underline-offset:3px;font-family:inherit}
      .dc-link:hover{color:#F5F4F1}
    </style>
    <div class="dc-overlay" id="dc-overlay">
      <div class="dc-panel" role="dialog" aria-label="Finish your prompt">
        <div class="dc-head">
          <div class="dc-row">
            <span class="dc-eyebrow">Deepclario</span>
            <button class="dc-x" id="dc-close" aria-label="Close">×</button>
          </div>
          <div class="dc-acct" id="dc-acct"></div>
        </div>
        <div class="dc-body" id="dc-stage"></div>
        <div class="dc-foot">
          <a href="${LINKS.playground}" target="_blank" rel="noopener">Open Deepclario →</a>
          <a href="${LINKS.pricing}" target="_blank" rel="noopener">Pro</a>
          <a href="${LINKS.privacy}" target="_blank" rel="noopener">Privacy</a>
        </div>
      </div>
    </div>
  `
  root.appendChild(wrap)

  const q = sel => wrap.querySelector(sel)
  const overlay = q('#dc-overlay')
  const stage = q('#dc-stage')

  const esc = s => { const d = document.createElement('div'); d.innerText = s || ''; return d.innerHTML }
  const band = n => (n < 45 ? 'lo' : n < 70 ? 'mid' : 'hi')


  function close() { overlay.classList.remove('open') }
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  q('#dc-close').addEventListener('click', close)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close()
  })

  function renderAccount() {
    const acct = q('#dc-acct')
    const tier = authState.tier
    const badge =
      tier === 'pro' ? '<span class="dc-badge pro">Pro</span>'
      : tier === 'free' ? '<span class="dc-badge">Connected</span>'
      : '<span class="dc-badge">Not connected</span>'
    const action =
      tier === 'anon'
        ? '<button class="dc-link" id="dc-connect">Connect account</button>'
        : '<button class="dc-link" id="dc-disconnect">Disconnect</button>'
    acct.innerHTML = badge + action
    const c = q('#dc-connect')
    if (c) c.addEventListener('click', () => { close(); onConnect() })
    const d = q('#dc-disconnect')
    if (d) d.addEventListener('click', () => { onDisconnect(); renderAccount() })
  }

  function renderLoading() {
    stage.innerHTML = `
      <div style="padding:28px 0">
        <div class="dc-dots"><span></span><span></span><span></span></div>
        <p class="dc-muted" style="margin-top:12px">Checking what only you can answer.</p>
      </div>`
  }

  function renderError(kind) {
    stage.innerHTML = `<p class="dc-err" style="padding-top:24px">${
      kind === 'rate_limited'
        ? 'Too many requests. Try again in a moment.'
        : 'Could not load this. Try again.'
    }</p>`
  }

  /**
   * Read-only. The score, one honest line, and what is still missing -
   * stated, not asked. The user answers those questions on the chip, in
   * their workflow; here they are just told what they are, so they learn
   * what makes a prompt good.
   */
  function render(d) {
    const gaps = d.gaps || []
    const b = band(d.score)

    const hero = `
      <div class="dc-hero">
        <div class="dc-scorerow">
          <span class="dc-num ${b}">${d.score}</span>
          <span class="dc-bar"><i class="${b}" style="width:${d.score}%"></i></span>
        </div>
        <p class="dc-headline">${esc(d.headline || 'This prompt is ready to send.')}</p>
      </div>`

    if (!gaps.length) {
      stage.innerHTML = hero +
        `<p class="dc-muted" style="margin-top:14px">Nothing important is missing. Send it.</p>`
      return
    }

    // Stated as facts to learn from, not as a form to fill in. Filling them
    // in happens on the chip - that is the journey, and it stays inline.
    const list = gaps.map(g => `
      <div class="dc-gap">
        <p class="dc-q">${esc(g.label)}</p>
        <p class="dc-why">${esc(g.why || g.question)}</p>
      </div>`).join('')

    stage.innerHTML = hero + `
      <p class="dc-muted" style="margin:16px 0 2px">
        These are the things an AI cannot guess for you. Deepclario asks you
        for them next to your prompt box.
      </p>
      ${list}`
  }

  return {
    open(original, sharpened) {
      renderAccount()
      overlay.classList.add('open')

      if (!sharpened) {
        stage.innerHTML = `<p class="dc-muted" style="padding-top:24px">Sharpen a prompt first, then come back to finish it.</p>`
        return
      }

      renderLoading()

      chrome.runtime.sendMessage(
        { type: 'DEEPCLARIO_EXPLAIN', original, sharpened, token: authState.token },
        resp => {
          if (!resp || !resp.ok || !resp.data) { renderError(resp && resp.error); return }
          render(resp.data)
        }
      )
    },
  }
}
