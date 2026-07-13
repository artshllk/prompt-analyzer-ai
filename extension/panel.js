// Deepclario extension - the "why?" panel.
//
// ONE job: explain the sharpen that already happened. What was weak in the
// original, what the rewrite changed, and - honestly - what it could NOT
// fix, because a rewrite cannot invent facts the user never gave.
//
// It produces no rewrite and asks no question. The question is asked inline,
// before the rewrite (see content.js). A second question here, and a second
// competing rewrite, is what made the old panel incoherent.
//
// Exposed as window.createDetailsPanel(ctx), built once by content.js.

window.createDetailsPanel = function createDetailsPanel(ctx) {
  const { root, authState, LINKS, onConnect, onDisconnect } = ctx

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
        transform: translateX(100%); transition: transform .3s cubic-bezier(.16,1,.3,1);
        display: flex; flex-direction: column; overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      }
      .dc-overlay.open .dc-panel { transform: translateX(0); }
      .dc-pad { padding: 22px; }
      .dc-row { display: flex; align-items: center; justify-content: space-between; }
      .dc-eyebrow { font-size: 11px; letter-spacing:.16em; text-transform: uppercase; color: #A8A6A0; font-weight: 500; }
      .dc-x { background:none;border:none;color:#A8A6A0;cursor:pointer;font-size:20px;line-height:1;padding:4px; }
      .dc-x:hover { color:#F5F4F1; }
      .dc-sub { color:#A8A6A0; font-size:13px; line-height:1.55; margin:0 0 14px; }
      .dc-box { background:#1A1A20; border:1px solid rgba(245,244,241,.16); border-radius:10px; padding:12px; font-size:12.5px; line-height:1.55; white-space:pre-wrap; }
      .dc-label { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#A8A6A0; margin:18px 0 8px; }
      .dc-rule{height:1px;background:rgba(245,244,241,.12);margin:18px 0}
      .dc-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:#F5F4F1;margin:0 2px;animation:dcd 1.2s infinite}
      .dc-dots span:nth-child(2){animation-delay:.18s}.dc-dots span:nth-child(3){animation-delay:.36s}
      @keyframes dcd{0%,100%{opacity:.25}50%{opacity:1}}
      .dc-err{color:#C25E5E;font-size:13px;line-height:1.5}
      .dc-acct{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0 4px}
      .dc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#A8A6A0;border:1px solid rgba(245,244,241,.18)}
      .dc-badge.pro{background:#F5F4F1;color:#0E0E10;border-color:transparent}
      .dc-link{background:none;border:none;color:#A8A6A0;font-size:11.5px;cursor:pointer;padding:2px 0;text-decoration:underline;text-underline-offset:3px;font-family:inherit}
      .dc-link:hover{color:#F5F4F1}
      .dc-foot{margin-top:auto;padding:14px 22px;border-top:1px solid rgba(245,244,241,.1);display:flex;gap:14px;flex-wrap:wrap}
      .dc-foot a{color:#A8A6A0;font-size:11.5px;text-decoration:none}
      .dc-foot a:hover{color:#F5F4F1;text-decoration:underline;text-underline-offset:3px}

      /* Score: the one number, stated plainly. */
      .dc-score { display:flex; align-items:baseline; gap:8px; margin-bottom:2px; }
      .dc-score b { font-size:30px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1; }
      .dc-score.lo b { color:#E08A8A } .dc-score.mid b { color:#D9A45B } .dc-score.hi b { color:#7FC79A }
      .dc-score span { font-size:12px; color:#A8A6A0; }

      /* Lists. Severity is carried by a dot, not by shouting. */
      .dc-list { margin:0; padding:0; list-style:none; }
      .dc-list li { font-size:12.5px; line-height:1.55; color:#C9C7C2; padding-left:18px; position:relative; margin-bottom:8px; }
      .dc-list li:before {
        content:''; position:absolute; left:2px; top:7px;
        width:6px; height:6px; border-radius:50%; background:#6b6a66;
      }
      .dc-list li.critical:before { background:#E08A8A }
      .dc-list li.moderate:before { background:#D9A45B }
      .dc-list li em { font-style:normal; color:#F5F4F1; }
      .dc-list.arrow li:before { content:'→'; background:none; width:auto; height:auto; top:0; color:#8FB4F2; font-size:11px; }
      .dc-list.check li:before { content:'✓'; background:none; width:auto; height:auto; top:0; color:#7FC79A; font-size:11px; }

      /* The honest bit: what we could NOT fix. */
      .dc-honest {
        background: rgba(217,164,91,.07);
        border: 1px solid rgba(217,164,91,.28);
        border-radius: 10px; padding: 12px 14px; margin-top: 8px;
      }
      .dc-honest .dc-label { margin-top: 0; color:#D9A45B; }
      .dc-honest .dc-list li:before { background:#D9A45B; }
      .dc-lesson {
        margin-top: 18px; padding: 12px 14px;
        background: rgba(143,180,242,.08);
        border-left: 2px solid #8FB4F2; border-radius: 0 8px 8px 0;
        font-size: 12.5px; line-height: 1.55; color:#F5F4F1;
      }
    </style>
    <div class="dc-overlay" id="dc-overlay">
      <div class="dc-panel" role="dialog" aria-label="Why this prompt changed">
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

  const esc = s => { const d = document.createElement('div'); d.innerText = s || ''; return d.innerHTML }
  const scoreClass = n => (n < 40 ? 'lo' : n < 70 ? 'mid' : 'hi')

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

  function renderLoading() {
    stage.innerHTML = `<div class="dc-rule"></div>
      <div class="dc-dots" style="margin:16px 0"><span></span><span></span><span></span></div>
      <p class="dc-sub">Looking at what your original prompt was missing.</p>`
  }

  function renderError(kind) {
    const msg = kind === 'rate_limited'
      ? 'Too many requests right now. Try again in a moment.'
      : 'Could not load the explanation. Try again.'
    stage.innerHTML = `<div class="dc-rule"></div><p class="dc-err">${msg}</p>`
  }

  /**
   * The explanation. No rewrite, no question - just an honest account of
   * what was weak, what changed, and what we could not fix for them.
   */
  function renderExplanation(d, original) {
    const findings = (d.audit && d.audit.findings) || []
    const forecast = (d.audit && d.audit.failureForecast) || []
    const changes = d.changes || []
    const missing = d.stillMissing || []

    const gapsBlock = findings.length
      ? `<div class="dc-label">What was weak in yours</div>
         <ul class="dc-list">${findings.map(f =>
           `<li class="${esc(f.severity)}">${esc(f.note)}${
             f.evidence ? ` <em>(&ldquo;${esc(f.evidence)}&rdquo;)</em>` : ''
           }</li>`).join('')}</ul>`
      : ''

    const forecastBlock = forecast.length
      ? `<div class="dc-label">What would have happened</div>
         <ul class="dc-list arrow">${forecast.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : ''

    const changesBlock = changes.length
      ? `<div class="dc-label">What the rewrite did</div>
         <ul class="dc-list check">${changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
      : ''

    // The honest part. A rewrite cannot invent facts the user never gave.
    // Saying so out loud is the difference between a tool and a salesman.
    const missingBlock = missing.length
      ? `<div class="dc-honest">
           <div class="dc-label">What we could not fix for you</div>
           <ul class="dc-list">${missing.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
         </div>`
      : ''

    const lessonBlock = d.lesson
      ? `<div class="dc-lesson">${esc(d.lesson)}</div>`
      : ''

    stage.innerHTML = `
      <div class="dc-rule"></div>
      <div class="dc-score ${scoreClass(d.score)}">
        <b>${d.score}</b><span>/ 100 &nbsp;·&nbsp; your original</span>
      </div>
      <div class="dc-label" style="margin-top:14px">What you wrote</div>
      <div class="dc-box" style="color:#A8A6A0">${esc(original)}</div>
      ${gapsBlock}
      ${forecastBlock}
      ${changesBlock}
      ${missingBlock}
      ${lessonBlock}
    `
  }

  return {
    /**
     * @param original  the user's ORIGINAL prompt
     * @param sharpened what we wrote into their box
     */
    open(original, sharpened) {
      renderAccount()
      overlay.classList.add('open')

      if (!sharpened) {
        stage.innerHTML = `<div class="dc-rule"></div>
          <p class="dc-sub">Sharpen a prompt first, then come back here to see what changed and why.</p>`
        return
      }

      renderLoading()
      chrome.runtime.sendMessage(
        { type: 'DEEPCLARIO_EXPLAIN', original, sharpened, token: authState.token },
        resp => {
          if (!resp || !resp.ok || !resp.data) {
            renderError(resp && resp.error)
            return
          }
          renderExplanation(resp.data, original)
        }
      )
    },
  }
}
