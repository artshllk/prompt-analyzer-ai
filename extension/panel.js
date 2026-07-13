// Deepclario extension - the details panel.
//
// This is the DEEP path, opened only when the user clicks "why?" on the
// sharpen chip. It runs the full analyze pipeline (clarity score,
// interpretation forks, diagnosis, Deep Rewrite) - the same intelligence
// the website playground uses. The fast inline sharpen (content.js) never
// touches this; the default experience carries none of its weight.
//
// Exposed as window.createDetailsPanel(ctx) and called lazily by
// content.js. It builds its own panel inside the existing shadow root.

window.createDetailsPanel = function createDetailsPanel(ctx) {
  const { root, writePrompt, authState, prefs, LINKS, onConnect, onDisconnect } = ctx

  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <style>
      .dc-overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(0,0,0,.55); display: none;
      }
      .dc-overlay.open { display: block; }
      .dc-panel {
        position: fixed; top: 0; right: 0; height: 100%;
        width: 440px; max-width: 92vw; background: #0E0E10;
        color: #F5F4F1; border-left: 1px solid rgba(245,244,241,.14);
        transform: translateX(100%); transition: transform .32s cubic-bezier(.16,1,.3,1);
        display: flex; flex-direction: column; overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      }
      .dc-overlay.open .dc-panel { transform: translateX(0); }
      .dc-pad { padding: 22px; }
      .dc-row { display: flex; align-items: center; justify-content: space-between; }
      .dc-eyebrow { font-size: 11px; letter-spacing:.16em; text-transform: uppercase; color: #A8A6A0; font-weight: 500; }
      .dc-x { background:none;border:none;color:#A8A6A0;cursor:pointer;font-size:20px;line-height:1;padding:4px; }
      .dc-x:hover { color:#F5F4F1; }
      .dc-h2 { font-size: 20px; margin: 14px 0 6px; font-weight: 600; }
      .dc-sub { color:#A8A6A0; font-size:13px; line-height:1.55; margin:0 0 16px; }
      .dc-box { background:#1A1A20; border:1px solid rgba(245,244,241,.18); border-radius:12px; padding:14px; font-size:13.5px; line-height:1.6; white-space:pre-wrap; }
      .dc-label { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#A8A6A0; margin:16px 0 8px; }
      .dc-btn { display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;cursor:pointer;background:#F5F4F1;color:#0E0E10;font-size:13px;font-weight:600;border:none; }
      .dc-btn:hover{opacity:.92} .dc-btn.ghost{background:transparent;color:#F5F4F1;border:1px solid rgba(245,244,241,.18)}
      .dc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .dc-rule{height:1px;background:rgba(245,244,241,.14);margin:18px 0}
      .dc-fork{display:block;width:100%;text-align:left;cursor:pointer;background:#1A1A20;color:#F5F4F1;border:1px solid rgba(245,244,241,.18);border-radius:10px;padding:10px 12px;margin-bottom:8px;font-family:inherit}
      .dc-fork:hover{border-color:#8FB4F2}
      .dc-fork b{display:block} .dc-fork span{display:block;color:#A8A6A0;font-size:12px;margin-top:2px}
      .dc-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:#F5F4F1;margin:0 2px;animation:dcd 1.2s infinite}
      .dc-dots span:nth-child(2){animation-delay:.18s}.dc-dots span:nth-child(3){animation-delay:.36s}
      @keyframes dcd{0%,100%{opacity:.25}50%{opacity:1}}
      .dc-forecast{margin:8px 0 0;padding:0;list-style:none}
      .dc-forecast li{font-size:12.5px;color:#A8A6A0;line-height:1.5;padding-left:16px;position:relative;margin-bottom:5px}
      .dc-forecast li:before{content:'→';position:absolute;left:0;color:#8FB4F2}
      .dc-err{color:#C25E5E;font-size:13.5px;line-height:1.5}
      .dc-acct{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0 4px}
      .dc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#A8A6A0;border:1px solid rgba(245,244,241,.18)}
      .dc-badge.pro{background:#F5F4F1;color:#0E0E10;border-color:transparent}
      .dc-link{background:none;border:none;color:#A8A6A0;font-size:11.5px;cursor:pointer;padding:2px 0;text-decoration:underline;text-underline-offset:3px;font-family:inherit}
      .dc-link:hover{color:#F5F4F1}
      .dc-foot{margin-top:auto;padding:14px 22px;border-top:1px solid rgba(245,244,241,.1);display:flex;gap:14px;flex-wrap:wrap}
      .dc-foot a{color:#A8A6A0;font-size:11.5px;text-decoration:none}
      .dc-foot a:hover{color:#F5F4F1;text-decoration:underline;text-underline-offset:3px}
    </style>
    <div class="dc-overlay" id="dc-overlay">
      <div class="dc-panel" role="dialog" aria-label="Deepclario details">
        <div class="dc-pad">
          <div class="dc-row">
            <span class="dc-eyebrow">Deepclario</span>
            <button class="dc-x" id="dc-close" aria-label="Close">×</button>
          </div>
          <div class="dc-acct" id="dc-acct"></div>
          <div id="dc-stage"></div>
        </div>
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
  let history = []
  let currentPrompt = ''

  const esc = s => { const d = document.createElement('div'); d.innerText = s || ''; return d.innerHTML }
  const scoreClass = n => (n < 30 ? 'lo' : n < 60 ? 'mid' : 'hi')

  function close() { overlay.classList.remove('open') }
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  q('#dc-close').addEventListener('click', close)

  // Account row: always shows where the user stands and gives them the
  // one action that matters, without sending them off to find the site.
  function renderAccount() {
    const acct = q('#dc-acct')
    const tier = authState.tier
    const badge =
      tier === 'pro' ? '<span class="dc-badge pro">Pro</span>'
      : tier === 'free' ? '<span class="dc-badge">Account connected</span>'
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

  function analyze(prompt, prior) {
    renderLoading()
    const deep = authState.tier === 'pro' && prefs.deep
    chrome.runtime.sendMessage(
      { type: 'DEEPCLARIO_ANALYZE', prompt, priorAnswers: prior, token: authState.token, tone: prefs.tone, deep },
      resp => {
        if (!resp || !resp.ok) { renderError(resp); return }
        const d = resp.data
        if (d.type === 'clarifying' && prior.length < 3) renderClarify(d)
        else if (d.type === 'already_good') renderAlreadyGood(d)
        else if (d.type === 'improved') renderDone(d)
        else renderError({ error: 'server_error' })
      }
    )
  }

  function renderLoading() {
    stage.innerHTML = `<div class="dc-rule"></div>
      <div class="dc-dots" style="margin:16px 0"><span></span><span></span><span></span></div>
      <p class="dc-sub">Reading your prompt: what's clear, what's missing, and how it could be misread.</p>`
  }

  // Errors are not dead ends: each one offers the action that resolves it.
  function renderError(resp) {
    const kind = resp?.error || 'network'
    let msg = 'Something went sideways on our end. Try again.'
    let action = ''

    if (kind === 'quota') {
      msg = 'You are out of free rewrites. They reset within 48 hours, or go Pro for unlimited.'
      action = `<a class="dc-btn" href="${LINKS.pricing}" target="_blank" rel="noopener" style="text-decoration:none">Go Pro</a>`
    } else if (kind === 'pro_required') {
      msg = 'Deep Rewrite is a Pro feature: your prompt is drafted, critiqued, and refined on our strongest model.'
      action = `<a class="dc-btn" href="${LINKS.pricing}" target="_blank" rel="noopener" style="text-decoration:none">See Pro</a>`
    } else if (kind === 'rate_limited') {
      msg = 'Too many requests from your network. Connecting an account raises the limit.'
      action = `<button class="dc-btn" id="dc-err-connect">Connect account</button>`
    } else if (kind === 'network') {
      msg = 'Network hiccup. Check your connection and try again.'
    }

    stage.innerHTML = `<div class="dc-rule"></div><p class="dc-err">${msg}</p>${
      action ? `<div class="dc-actions">${action}</div>` : ''
    }`
    const c = q('#dc-err-connect')
    if (c) c.addEventListener('click', () => { close(); onConnect() })
  }

  function renderClarify(d) {
    const s = d.scoreBeforeImprovement ?? 0
    const forks = (d.options && d.options.length)
      ? d.options.map((o, i) =>
          `<button class="dc-fork" data-i="${i}"><b>${esc(o.label)}</b><span>${esc(o.summary)}</span></button>`
        ).join('')
      : ''
    stage.innerHTML = `
      <div class="dc-rule"></div>
      <div class="dc-eyebrow" style="margin-bottom:8px">Clarity ${s}/100 · one quick question</div>
      <div class="dc-h2" style="font-size:17px">${esc(d.question)}</div>
      ${forks}
      <div class="dc-label">Or answer in your words</div>
      <textarea id="dc-ans" class="dc-box" style="width:100%;min-height:64px;font-family:inherit" placeholder="Type your answer..."></textarea>
      <div class="dc-actions"><button class="dc-btn" id="dc-send">Send</button></div>
    `
    wrap.querySelectorAll('.dc-fork').forEach(b => {
      b.addEventListener('click', () => {
        const o = d.options[+b.dataset.i]
        history.push({ question: d.question, answer: `${o.label} - ${o.summary}`, turn: history.length + 1 })
        analyze(currentPrompt, history)
      })
    })
    q('#dc-send').addEventListener('click', () => {
      const a = q('#dc-ans').value.trim()
      if (!a) return
      history.push({ question: d.question, answer: a, turn: history.length + 1 })
      analyze(currentPrompt, history)
    })
  }

  function renderAlreadyGood(d) {
    stage.innerHTML = `
      <div class="dc-rule"></div>
      <div class="dc-eyebrow" style="color:#8FB4F2;margin-bottom:8px">Already strong · ${d.scoreBeforeImprovement ?? ''}/100</div>
      <p class="dc-sub" style="color:#F5F4F1">${esc(d.message)}</p>
      ${d.tweaks && d.tweaks.length ? `<div class="dc-label">If you want to tune it</div><ul class="dc-forecast">${d.tweaks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <p class="dc-sub" style="margin-top:14px;font-size:12px">No credit used. We only charge for real rewrites.</p>
    `
  }

  function renderDone(d) {
    const b = d.scoreBeforeImprovement ?? 0
    const a = d.clarityScoreAfter ?? 0
    const forecast = d.audit && d.audit.failureForecast && d.audit.failureForecast.length
      ? `<div class="dc-label">Run as-is, this happens</div><ul class="dc-forecast">${d.audit.failureForecast.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : ''
    const critique = d.critique
      ? `<div class="dc-label" style="color:#8FB4F2">What the critic caught</div><p class="dc-sub" style="margin:0">${esc(d.critique)}</p>`
      : ''
    stage.innerHTML = `
      <div class="dc-rule"></div>
      <div class="dc-eyebrow" style="margin-bottom:8px">Clarity ${b} → ${a}</div>
      <div class="dc-label" style="margin-top:0">Improved prompt</div>
      <div class="dc-box">${esc(d.improvedPrompt)}</div>
      ${d.explanation ? `<p class="dc-sub" style="margin:10px 0 0">${esc(d.explanation)}</p>` : ''}
      ${forecast}
      ${critique}
      <div class="dc-actions">
        <button class="dc-btn" id="dc-replace">Use this in chat</button>
        <button class="dc-btn ghost" id="dc-copy">Copy</button>
      </div>
      ${authState.tier !== 'pro' && !d.critique ? `
        <p class="dc-sub" style="margin:14px 0 0;font-size:11.5px">
          Deep Rewrite drafts, critiques, and refines this on our strongest model.
          <a href="${LINKS.pricing}" target="_blank" rel="noopener" style="color:#8FB4F2;text-decoration:none">Get Pro →</a>
        </p>` : ''}
    `
    q('#dc-copy').addEventListener('click', e => {
      navigator.clipboard.writeText(d.improvedPrompt)
      e.target.textContent = 'Copied'
      setTimeout(() => { e.target.textContent = 'Copy' }, 1500)
    })
    q('#dc-replace').addEventListener('click', () => {
      writePrompt(d.improvedPrompt)
      close()
    })
  }

  return {
    open(prompt) {
      currentPrompt = prompt
      history = []
      renderAccount()
      overlay.classList.add('open')
      analyze(prompt, [])
    },
  }
}
