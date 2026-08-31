// Deepclario extension - the compare view.
//
// ONE job, and it is the one job the chip cannot do: the prompt box holds a
// single version at a time. Once we sharpen it, the user's own words are gone
// from the screen, and "undo" on the chip only survives until the state
// resets. So this shows the two side by side and gives them a way back.
//
// It used to be a "why?" report - the score, the gaps, what would have gone
// wrong. That was a dead end. You read it, you nod, you close it, and nothing
// changed. Worse, it listed the same gaps the chip was already asking about,
// so the user met the same information twice in two places.
//
// The improving journey lives entirely on the inline chip, next to the prompt
// box. This is the only other surface, and it earns its place because the box
// is a single slot.

window.createDetailsPanel = function createDetailsPanel(ctx) {
  const { root, authState, LINKS, onConnect, onDisconnect, onRestore } = ctx

  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <style>
      .dc-overlay {
        position: fixed; inset: 0; z-index: 2147483647;
        background: rgba(21,19,15,.45); display: none;
      }
      .dc-overlay.open { display: block; }
      .dc-panel {
        position: fixed; top: 0; right: 0; height: 100%;
        width: 430px; max-width: 94vw; background: var(--dc-card);
        color: var(--dc-ink); border-left: 1px solid var(--dc-rule);
        transform: translateX(100%); transition: transform .28s cubic-bezier(.16,1,.3,1);
        display: flex; flex-direction: column;
        font-family: var(--dc-font);
      }
      .dc-overlay.open .dc-panel { transform: translateX(0); }
      .dc-head { padding: 18px 20px 14px; flex-shrink: 0; }
      .dc-body { padding: 0 20px 20px; overflow-y: auto; flex: 1; }
      .dc-row { display: flex; align-items: center; justify-content: space-between; }
      .dc-eyebrow { font-size: 10.5px; letter-spacing:.16em; text-transform: uppercase; color: var(--dc-ink-soft); font-weight: 600; }
      .dc-x { background:none;border:none;color:var(--dc-ink-soft);cursor:pointer;font-size:20px;line-height:1;padding:4px; }
      .dc-x:hover { color:var(--dc-ink); }

      /* The two versions. Theirs is live; yours is the one you can take back. */
      .dc-block { margin-bottom: 18px; }
      .dc-label { font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; margin:0 0 8px; font-weight:600; }
      .dc-text {
        font-size: 13.5px; line-height: 1.6; white-space: pre-wrap;
        background: var(--dc-ink); border: 1px solid var(--dc-rule);
        border-radius: 10px; padding: 13px 14px;
      }
      .dc-text.mine { color: var(--dc-ink-soft); }
      .dc-text.theirs { color: var(--dc-ink); border-color: var(--dc-machine); }

      .dc-act {
        margin-top: 8px; background: none; border: none; cursor: pointer;
        color: var(--dc-machine); font-size: 11.5px; font-weight: 600; font-family: inherit;
        text-decoration: underline; text-underline-offset: 3px; padding: 4px 0;
      }
      .dc-act:hover { opacity: .8; }
      .dc-act.quiet { color: var(--dc-ink-soft); font-weight: 400; }
      .dc-act.quiet:hover { color: var(--dc-ink); }

      .dc-foot{margin-top:auto;padding:12px 20px;border-top:1px solid var(--dc-rule);display:flex;gap:14px;flex-wrap:wrap;flex-shrink:0}
      .dc-foot a{color:var(--dc-ink-soft);font-size:11px;text-decoration:none}
      .dc-foot a:hover{color:var(--dc-ink-soft)}
      .dc-acct{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
      .dc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em;color:var(--dc-ink-soft);border:1px solid var(--dc-rule)}
      .dc-badge.pro{background:var(--dc-ink);color:var(--dc-card);border-color:transparent}
      .dc-link{background:none;border:none;color:var(--dc-ink-soft);font-size:11px;cursor:pointer;padding:2px 0;text-decoration:underline;text-underline-offset:3px;font-family:inherit}
      .dc-link:hover{color:var(--dc-ink)}
      .dc-muted { color:var(--dc-ink-soft); font-size:12.5px; line-height:1.55; }
    </style>
    <div class="dc-overlay" id="dc-overlay">
      <div class="dc-panel" role="dialog" aria-label="Compare prompts">
        <div class="dc-head">
          <div class="dc-row">
            <span class="dc-eyebrow">Compare</span>
            <button class="dc-x" id="dc-close" aria-label="Close">×</button>
          </div>
          <div class="dc-acct" id="dc-acct"></div>
        </div>
        <div class="dc-body" id="dc-stage"></div>
        <div class="dc-foot">
          <a href="${LINKS.app}" target="_blank" rel="noopener">Open Deepclario →</a>
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

  return {
    /**
     * @param original  what the user typed
     * @param sharpened what is in their box now (null if we have not run yet)
     */
    open(original, sharpened) {
      renderAccount()
      overlay.classList.add('open')

      if (!sharpened) {
        stage.innerHTML =
          `<p class="dc-muted">Improve a prompt first, then come back to compare.</p>`
        return
      }

      stage.innerHTML = `
        <div class="dc-block">
          <p class="dc-label" style="color:var(--dc-machine)">In your box now</p>
          <div class="dc-text theirs">${esc(sharpened)}</div>
          <button class="dc-act quiet" id="dc-copy">Copy</button>
        </div>
        <div class="dc-block">
          <p class="dc-label" style="color:var(--dc-ink-soft)">What you wrote</p>
          <div class="dc-text mine">${esc(original)}</div>
          <button class="dc-act" id="dc-restore">Use mine instead</button>
        </div>
      `

      // The escape hatch. The box holds one version at a time, so after we
      // overwrite it their own words survive only here.
      q('#dc-restore').addEventListener('click', () => {
        onRestore()
        close()
      })

      q('#dc-copy').addEventListener('click', e => {
        navigator.clipboard.writeText(sharpened)
        e.target.textContent = 'Copied'
        setTimeout(() => { e.target.textContent = 'Copy' }, 1500)
      })
    },
  }
}
