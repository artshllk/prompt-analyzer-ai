# Extension audit: long prompts, chip position, usage limits

Audit only. **No code changed.** Every root cause below was verified by reading
the current code on `main`; line numbers are as of this writing.

---

## Issue 1: >4000 characters shows "Something went wrong on our end"

### Verified root cause

Three separate defects stack up. The message you saw is the *last* of them.

**1a. The server rejects at 4000 chars, but the extension never checks.**

```
src/app/api/anon/sharpen/route.ts:78   if (prompt.length > 4000) -> 400 prompt_too_long
src/app/api/anon/fork/route.ts:60      same
extension/content.js:690               if (!prompt || prompt.length < 3)   <- only a MINIMUM
```

The extension validates a floor (3 chars) and no ceiling. So a 40,000 char prompt
is sent to the network, travels, and is rejected server-side. The user waits for
a round trip to be told no.

**1b. The background worker throws the reason away.**

`extension/background.js:92-102` maps only two statuses:

```js
if (res.status === 429) error = 'rate_limited'
else if (res.status === 402) { ... 'quota' | 'pro_required' }
// 400 prompt_too_long falls through to the default:
let error = 'server_error'
```

The server *does* send `{ error: 'prompt_too_long' }` in the body. The worker
never reads it for the 400 case, so the specific, actionable reason is discarded.

**1c. `server_error` renders as a generic apology.**

`extension/content.js:1146-1147`:

```js
} else {
  toast('Something went wrong on our end. Try again.')
}
```

So a user error ("your prompt is too long") is reported as **our** server
failing, and the advice ("Try again") is actively wrong - retrying an identical
40,000 char prompt fails identically, forever.

### Why this matters beyond the message

This is not a rare edge case. Pasting a long email, a document, a transcript, or
a block of code is *exactly* what a real user does. The current behaviour tells
them our service is broken and to try again, so they try again, and conclude the
product does not work.

### Recommended fix (defence in depth, three layers)

**Layer 1 - stop it at the source (client).** Add a shared constant, e.g.
`MAX_PROMPT_CHARS = 4000`, and check it in `onSharpen()` *before* any network
call. Fail instantly, with a message that names the real problem and the real
number:

> "That prompt is too long to improve (about 6,200 words). Try improving a
> section of it instead."

Show it immediately - no spinner, no round trip.

**Layer 2 - map the error honestly (background.js).** Read the JSON body on 400
the same way it already does on 402, and forward `prompt_too_long` as a distinct
error code. Defence for the case where client and server limits drift apart.

**Layer 3 - a real message (content.js).** Add a branch to `onSharpenError` for
`prompt_too_long`, so even if it reaches the client it never reads as our outage.

**Trade-off to decide:** 4000 chars is roughly 600-1000 words, which is genuinely
restrictive for "improve my long email". Options:

| Option | Pros | Cons |
|---|---|---|
| Keep 4000, message clearly | No cost change, ship today | Users with long prompts simply cannot use us |
| Raise to ~12,000 | Covers most real prompts | ~3x tokens on those calls; slower; higher cost |
| Improve only the first N chars, tell the user | Always "works" | Silently partial - risks feeling broken/dishonest |
| Cap by *tier*: 4k free, higher for Pro | Natural upgrade reason | More logic, more edge cases |

**My recommendation:** ship Layer 1-3 with the current 4000 limit now (it turns a
broken-looking failure into an honest one, today), and separately measure how
often users hit the cap before deciding whether to raise it. Do not guess at the
right ceiling - instrument it. The "silently truncate" option should be rejected:
partial results that look complete are worse than a clear no.

---

## Issue 2: the Improve chip jumps to the top of the screen on large prompts

### Verified root cause

`extension/content.js:353-366`:

```js
function anchorTo(el, node, place) {
  const r = el.getBoundingClientRect()
  ...
  node.style.top = Math.max(8, r.top - 40) + 'px'   // <- the bug
}
```

The chip is positioned **40px above the TOP edge** of the prompt box
(`r.top - 40`), pinned with `position: fixed`.

ChatGPT's composer grows **upward** as content is added: the bottom stays put,
the top edge climbs. So:

- Short prompt: `r.top` is near the bottom of the viewport. `r.top - 40` sits
  just above the box. Looks right.
- Huge prompt: the box fills the screen, `r.top` approaches 0 (or goes negative
  once the box is taller than the viewport). `r.top - 40` is negative, and
  `Math.max(8, ...)` clamps it to **8px - hard against the top of the screen.**

So the chip is not "breaking" - it is faithfully following an edge that moved. It
is anchored to the wrong edge.

### Why the previous fix did not hold

The earlier work addressed *when* we reposition (scroll, resize, interval), not
*what we anchor to*. The maths was never the thing that changed. The clamp
(`Math.max(8, ...)`) even hides the failure by producing a "valid" position
instead of an obviously broken one.

### Recommended fix

**Anchor to the bottom edge, not the top.** The composer's bottom edge is
stable regardless of content size - that is the whole point of a chat input.

Sketch (to validate, not paste):

```js
// Anchor to the box's BOTTOM edge, which does not move as the box grows.
// Use `bottom` so the chip rides just above the composer at any height.
node.style.bottom = Math.max(8, window.innerHeight - r.bottom + 8) + 'px'
node.style.top = 'auto'
```

Plus two guards:

1. **Clamp to the viewport on both axes**, not just the top. If the composer is
   scrolled out of view entirely, hide the chip rather than parking it at 8px.
2. **Use `ResizeObserver` on the prompt element** instead of relying on the
   1.2s interval + scroll handler. The box resizing is precisely the event we
   care about, and we are currently not listening for it. This is why it feels
   laggy/wrong specifically while typing or pasting.

**Trade-off:** `ResizeObserver` is one more listener to tear down, but it
replaces polling and is strictly more correct. Worth it.

**Also applies to:** `positionForks()` and the connect box use `anchorTo(...,
'above')` (`content.js:444, 1223`) with the same `r.top` maths, so they have the
same bug. Fix once in `anchorTo`, all three benefit.

---

## Issue 3: the usage-limit model

### What we have today

`src/lib/limits.ts:33-38`:

```
USAGE_WINDOW_HOURS   = 2     // improve freely for 2h
USAGE_COOLDOWN_HOURS = 3     // then wait 3h
USAGE_SOFT_CAP       = 25    // abuse guard inside the window
USAGE_WARN_AT        = 2
ANON_FREE_TRIES      = 2     // before connecting an account
```

So a free user gets a 2-hour window, up to 25 improvements in it, then a forced
3-hour wait.

### Honest product critique

**The model is clever and hard to explain. That is a bad trade.**

- **It is not predictable.** "You have 5 left today" is a fact a user can plan
  around. "You are in a 2 hour window that started at some point you did not
  notice, and after it you wait 3 hours" is not something anyone can hold in
  their head.
- **The clock starts invisibly.** The window opens on your *first* improve. A
  user who improves once at 9am and returns at 11:30am has silently lost their
  window without using it. They are punished for *not* using the product.
- **The cap is nearly unreachable, so the pain is all cooldown.** 25 in 2 hours
  is far more than a normal user does. In practice almost nobody hits the cap;
  they just hit the *cooldown* - the punishing half - without ever having felt
  generous limits. We built a generous allowance and a harsh gate, and users only
  experience the gate.
- **It makes a bad first impression at exactly the wrong moment.** Someone
  exploring the product on day one does a burst of improves. That is the
  behaviour we *want*. The window model specifically punishes it.

**Where it is right:** it is cheap to enforce (one column, one query), it maps to
how the chat products gate their own free tiers, and "never wait" is a clean,
honest Pro pitch.

### Evaluating your proposal: 3-5 improvements per 24h

| | Window (2h/3h, cap 25) | Simple daily (e.g. 5 / 24h) |
|---|---|---|
| Explainable in one line | No | Yes |
| User can plan around it | No | Yes |
| Punishes exploration burst | Yes | No (until spent) |
| Predictable cost ceiling | Loose (25/window x windows) | Hard (5/user/day) |
| Pro pitch | "never wait" | "no daily limit" |
| Enforcement complexity | Medium (window + cooldown) | Low (count since 24h ago) |
| Abuse resistance | Good | Good (and simpler to reason about) |

**A simple daily count is better on almost every axis that matters.** It is
honest, it is predictable, and it lets a new user actually explore on day one.

**But 3 is too few, and 5 is probably too few.** Consider what one "improvement"
means here: a real user often needs 2-3 attempts on the *same* task before
they are happy. A limit of 3 means a single piece of work exhausts the free tier,
and the user never reaches the moment where the product proves itself. That kills
adoption, not abuse.

**My recommendation: 10 per 24 hours, rolling.**

- Enough for a genuine first day (several tasks, a few retries) - the user gets
  to the "oh, this is actually good" moment.
- Still a hard, predictable cost ceiling.
- One line to explain: **"10 free improvements a day. Pro removes the limit."**
- Keep the existing quiet-quota UX: silent until ~2 left, then one calm line,
  then a clear upgrade path.

**Additional refinements worth considering:**

1. **Do not charge for failures.** If the improve errors, is rejected as too
   long, or the user immediately undoes it, it should not count. Nothing sours a
   free tier faster than paying for something that did not work. (Worth
   auditing - I did not verify whether undo currently refunds.)
2. **Do not charge twice for the same prompt.** Answering the fork question or
   the detail questions triggers additional model calls - confirm those are not
   each counted as separate improvements.
3. **Keep `ANON_FREE_TRIES = 2`.** Two anonymous tries before asking for an
   account is a good funnel: enough to feel the value, few enough to justify the
   ask.

**Migration note (engineering):** moving off the window model means
`profiles.window_started_at` becomes unused, and `decideUsage()` simplifies to a
count of `usage_events` in the last 24h - which the code already does elsewhere.
This is a *simplification*, not added complexity. The unit tests around
`decideUsage` would shrink accordingly.

---

## UX improvements that would make it feel more professional

Beyond the three issues, from reading the flow:

1. **Instant validation, not round-trip validation.** Anything we can know
   client-side (too long, too short, empty) should fail instantly. Waiting on the
   network to be told a fact we already knew feels slow and broken.
2. **Never say "Something went wrong on our end" for a user-side problem.** It
   is both wrong and it trains users to distrust our uptime.
3. **Error messages must include the way out.** The codebase already believes
   this (see the toast `action` pattern) - `prompt_too_long` should follow it.
4. **Anchor UI to stable edges.** The chip bug is a specific instance of a
   general rule: never anchor to an edge that moves with content.

---

## Prioritized plan (impact vs effort)

| # | Work | Impact | Effort | Why this order |
|---|---|---|---|---|
| 1 | **Chip position fix** (anchor to bottom edge + ResizeObserver) | High | Low | Visible on every large prompt, affects every user, small contained change in `anchorTo` |
| 2 | **Long-prompt handling** (client cap + honest error, 3 layers) | High | Low | Turns "product is broken" into "here is what to do"; pure win |
| 3 | **Usage model -> 10/24h** | High | Medium | Better adoption + simpler code, but touches limits, route, migration, and copy - do it deliberately, not alongside bug fixes |
| 4 | **Do not charge for failed/undone improves** | Medium | Low | Cheap trust win; verify current behaviour first |
| 5 | **Decide the real length ceiling** | Medium | Medium | Needs data, not a guess. Instrument first, then decide |

**Suggested sequencing:** 1 and 2 together as one small, safe PR (both are
contained bug fixes with clear verification). Then 3 as its own PR with its own
testing, since it changes product behaviour and pricing copy. 4 alongside 3. 5
after we have a week of data.

---

## Verification plan

- **Issue 1:** paste 5,000 / 40,000 / 400,000 chars. Each must fail *instantly*
  with a clear message naming length, never a spinner, never "our end".
- **Issue 2:** paste a prompt long enough to make the composer fill the screen.
  Chip must stay pinned just above the composer, at every size, while typing,
  after paste, on scroll, and on window resize. Also check the fork chips and the
  connect box (same `anchorTo`).
- **Issue 3:** confirm a fresh account gets exactly N improves in 24h; confirm an
  errored or undone improve does not decrement; confirm answering fork/detail
  questions does not decrement a second time.
