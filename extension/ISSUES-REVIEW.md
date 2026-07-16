# Extension issues review

Investigation of two reported issues. **No code changed** - this is diagnosis and
proposed fixes for review. Line numbers are against `extension/content.js` and
`src/app/api/anon/sharpen/route.ts` at the time of writing.

> **Update after the real second-improve prompt was shared.** The user's second
> improve produced a giant nested "Ask me 5 questions before you write the post,
> then write a 120-180 word post that must include (1)... (2)..." prompt, which
> then auto-sent. This confirms all three sub-parts of Issue 2 AND reveals the
> deeper problem the user actually cares about: **the flow is invisible.** The
> chip flips through several half-second labels ("Reading your prompt" -> "One
> quick question" -> "Improving" -> "Detail 1 of N") that appear and vanish, so
> the user never understands what Deepclario is doing or why. See the new
> **"Issue 3: the flow is opaque"** section - this is the priority.

---

## Issue 1: A brand-new (not connected) user sees "Pro: unlimited improvements"

### What you observed
On a fresh install, before connecting any account, after the first improve a
green toast says **"Pro: unlimited improvements."** This is confusing - the user
is not Pro, and it is unclear what it means.

### Root cause (confirmed)
The server tells the extension how many improvements are left via the
`X-Improvements-Left` response header. The extension reads it into `state.left`
and `noteHeadroom()` decides what to say.

The value **`-1` is meant to mean "Pro, unlimited"** (`content.js:833-841`):

```js
// Pro (-1): confirm the benefit exactly once, ever, then never again.
if (left === -1) {
  if (!prefs.proSeen) { ... toast('Pro: unlimited improvements.', ...) }
  return
}
```

But look at how the server sets that header (`src/app/api/anon/sharpen/route.ts`):

```js
let remaining = null                      // line 95
if (auth && auth.tier === 'free') {       // line 97 - ONLY free users
  ...
  remaining = decision.remaining          // line 162
}
...
'X-Improvements-Left': remaining === null ? '-1' : String(remaining)  // line 223
```

`remaining` stays `null` for **two** cases, not one:
1. **Pro users** (the `if` requires `tier === 'free'`, so Pro never enters it), and
2. **Anonymous users** (no `auth` at all).

Both cases send `-1`. The extension cannot tell "Pro, unlimited" from "anonymous,
untracked" - so a brand-new anonymous user gets the Pro toast.

### Why it is worse than just wrong copy
- It is the **first thing** a new user sees, and it misrepresents their status.
- `prefs.proSeen` is then set to `true` and persisted, so if that same user
  later actually goes Pro, they will **never** see the real confirmation.

### Proposed fix
The server already knows the true tier. Make the header carry three distinct
states instead of overloading `-1`:

- **Pro** -> `-1` (unlimited)
- **Free, N left** -> `N`
- **Anonymous (untracked)** -> omit the header entirely, or send an explicit
  sentinel like `anon`.

Then in `noteHeadroom()`:
- `-1` -> the Pro line (only for genuinely Pro users).
- a number -> the "N more before a short break" line.
- missing / `anon` -> **say nothing at all** on first use. A new user who has
  not connected does not need a limits message; if they should be nudged to
  connect, that is a separate, clearer message ("Connect a free account to keep
  improving") shown only when they actually approach the anonymous cap.

Smallest correct change: in the route, set `remaining` for the Pro branch too
(e.g. `-1` explicitly) and leave anonymous as a **missing header**, then in
`noteHeadroom()` treat "missing / non-numeric" as silence (it already partly
does at line 843-844, but the `-1` branch above it fires first for anon).

---

## Issue 2: Re-improving during the "details" step re-runs on the whole prompt, and it auto-sends

### What you observed
1. Wrote `write a linkedin post about me leaving my job`, clicked Improve. It
   worked, but you **did not see compare / undo** and did not get to review it.
2. Clicked Improve a **second** time. It **changed the whole prompt** and it
   **ran automatically** in ChatGPT.
3. The improved text was a mess: it told ChatGPT to ask *you* questions and gave
   advice about what to do once you answer - so the prompt that got sent was
   really just "here are questions to ask the user," which is redundant.

There are actually **three separate problems** stacked here.

### 2a. The re-improve guard has a hole (the core bug)

The extension has a guard meant to stop you improving an already-improved prompt
(`content.js:562`):

```js
if (boxHoldsOurOutput()) { toast('Already improved...'); return }
```

But `boxHoldsOurOutput()` only counts the `done` phase (`content.js:553-554`):

```js
function boxHoldsOurOutput() {
  return state.phase === 'done' && !!state.after && readPrompt() === state.after
}
```

Here is the timeline for a vague prompt like the LinkedIn one:

1. First improve completes -> `finishSharpen()` sets `phase = 'done'`, writes the
   rewrite, then **immediately calls `fetchGaps()`** (`content.js:812`).
2. `fetchGaps` finds missing details and calls `openGaps()`, which sets
   **`phase = 'filling'`** (`content.js:909`) and shows "Detail 1 of N · skip"
   on the chip - **this is why you never saw compare/undo**. Those only appear
   on the `done` chip (`showDoneChip`, line 439-440); the filling chip
   (`showFillingChip`, line 462-464) shows only "skip".
3. You press Improve again. The guard checks `phase === 'done'` - but the phase
   is `'filling'`, so **the guard does not fire**.
4. `onSharpen` proceeds. `readPrompt()` now returns **our already-improved text**
   (it is sitting in the box), so `state.before` is set to the *improved* prompt
   and we improve the improvement. That is the "changed the whole prompt" mess.

**Fix:** `boxHoldsOurOutput()` must also be true during `filling` (and any state
where our output is in the box). Change it to something like:

```js
function boxHoldsOurOutput() {
  return (state.phase === 'done' || state.phase === 'filling')
    && !!state.after && readPrompt() === state.after
}
```

Or, more robustly, gate on "we have unconsumed output in the box" independent of
phase. Either way, pressing Improve while our rewrite (or the in-progress details
flow) is live should offer to continue/undo, never silently re-improve.

### 2b. The rewrite itself produces a "ask me questions" prompt for vague input

Separately from the guard, the rewrite for `write a linkedin post about me
leaving my job` came back as "ask the user these questions, then...". That comes
from the sharpen engine prompt (`src/lib/engine/sharpen.ts:56,58`):

- Line 56: *"If a detail is truly unknown, make ONE reasonable assumption and
  fold it in naturally"* - good.
- Line 58: *"If the prompt asks the AI to clarify or to push back, say so
  plainly: 'Ask me anything you need before you start. Do not guess.'"*

For a vague prompt the model leans on the "ask me questions" pattern instead of
making reasonable assumptions. The result is a prompt whose entire job is to make
ChatGPT interrogate the user - which, if sent, wastes a turn.

This is arguably **by design working against us here**: the extension *already*
asks the clarifying question (the fork) and the details, so the *rewritten prompt*
should NOT also instruct ChatGPT to ask. The two mechanisms overlap and produce
the redundancy you saw.

**Fix options (pick one):**
- Tighten the sharpen prompt so the rewrite **commits to assumptions** and does
  not tell ChatGPT to ask the user questions - because our extension is the thing
  that asks. i.e. remove/soften line 58 for the fast path.
- Or, only allow the "ask me first" style when the user explicitly requested it
  in their original prompt (the current wording half-says this but the model
  over-applies it).

### 2c. The prompt auto-sent to ChatGPT

You said the second improve "ran automatically." We never call submit ourselves,
and `writePrompt` only sets text / dispatches `input`. The realistic causes:

- A stray **Enter** reaching ChatGPT. There is Enter handling at
  `content.js:1235` and in the typed-answer field. During the messy re-improve
  in `filling` phase, an Enter (yours, or one that leaked) would send whatever is
  in the box. Note the typed-answer handler DOES `preventDefault` now
  (line ~772), and digit keys are guarded (line 1183-1187), but the **global
  Enter branch at 1235 fires for any `phase !== 'idle'`** and only schedules
  `syncChip` - it does not itself send, but it also does not stop ChatGPT's own
  Enter handler, so if focus is in ChatGPT's box an Enter still submits.
- Because 2a put us in a broken state (improving our own output), the box was
  left focused with content and the normal "user presses Enter to send" became
  "send the garbage rewrite."

**Fix:** primarily fixing 2a removes the path that leaves the box in a sendable
messy state. Additionally, we should make sure that while our questions/choices UI
is open, an Enter in the host box does not both send AND get treated as our
flow - the two should be mutually exclusive.

---

---

## Issue 3: the flow is opaque (the real problem)

### What you observed
"I couldn't understand the flow and what's happening behind the scenes... don't
show a text for 2 seconds and then remove it."

### Why this happens
Deepclario does a genuinely multi-step thing, but it communicates each step as a
**transient chip label that appears and disappears in under a second or two**:

| Behind the scenes | What the chip shows | How long |
|---|---|---|
| Checking ambiguity (quick-fork) | "Reading your prompt" (dots) | ~1-2s, then gone |
| Prompt was ambiguous | "One quick question" + options | until answered/skipped |
| Rewriting | "Improving" (dots) | ~1s, streaming |
| Rewrite done, fetching details | "Improved" briefly, then... | flickers |
| Missing details found | "Detail 1 of N · skip" | until answered/skipped |
| Finally settled | "Improved · compare · undo" | sticky |

The user sees a rapid sequence of different words, each vanishing before they can
read or act, and **no explanation of what the tool is even doing**. There is no
persistent "here is the flow / here is where you are" surface. Every state is a
pill that replaces the last one.

Two concrete failures from this:
1. The user never saw **compare / undo** because the flow jumped straight from
   "Improving" to "Detail 1 of N" (the `filling` phase). Those affordances only
   exist on the `done` chip, which was skipped past.
2. When the second improve corrupted things, the user had **no mental model** to
   understand why - because the flow was never made legible in the first place.

### Proposed direction (for discussion, not final)
The goal: the user should always be able to answer "what is Deepclario doing, and
what can I do right now?" without anything disappearing on them.

Options, roughly in increasing effort:

**A. Make the states legible and stop them vanishing.**
- Keep the chip, but give each phase a clear, stable label that stays put:
  `Checking...` -> `Improving...` -> `Improved` (sticky). Never flip through
  three labels in two seconds; if two steps are that fast, collapse them into one
  ("Improving...") and only change the label when the user's available actions
  change.
- Crucially: after a rewrite, **always land on the `done` state (compare / undo)
  first**, even if details are coming. Surface "+ N details" as an OFFER on that
  done chip (which the code already supports), rather than auto-jumping into the
  `filling` phase and hiding compare/undo. This directly fixes failure #1 above
  and is also part of the Issue 2a fix.

**B. A small persistent status line / stepper.**
- A tiny, always-visible strip near the box: `1 Understand -> 2 Improve ->
  3 Add details`, with the current step highlighted. It does not vanish; it just
  advances. This makes the multi-step nature explicit so nothing feels like a
  flash.

**C. First-run explainer.**
- The very first time the chip appears, a one-time, dismissible line: "Deepclario
  improves your prompt right here. It may ask one quick question first." Shown
  once, then never again (same pattern as the current `proSeen` flag but done
  right). This sets expectations so the subsequent states are not a surprise.

Recommended: **A + C**. A makes the existing flow honest and non-flickering and
removes the compare/undo skip; C sets expectations on first use. B is nice but
heavier and can come later.

### What NOT to do
- Do not just speed up or slow down the toasts. The problem is not timing, it is
  that the states are unexplained and non-persistent. A 2-second toast that the
  user cannot act on is the thing to remove, per the user's own words.

---

## Suggested priority

1. **2a + 3A** together - the guard hole AND always landing on the `done`
   (compare/undo) state before offering details. These are the same underlying
   change: stop the `filling` phase from hijacking the flow invisibly. This fixes
   the corruption bug AND the "I never saw compare/undo" opacity in one move.
2. **1** - the Pro/anon header ambiguity. Small server + client change, removes a
   confusing first-run message.
3. **3C** - the one-time first-run explainer. Cheap, high clarity payoff.
4. **2b** - the "ask me questions" rewrite style. Prompt-engineering change; test
   against a batch of vague prompts before/after. (This is why the corrupted
   prompt was specifically a "5 questions" interrogation.)
5. **2c** - Enter/auto-send hardening. Largely mitigated by 2a; revisit after.
6. **3B** - the persistent stepper. Optional polish, later.

## Verification plan once fixed
- Repro 2a directly: vague prompt -> improve -> while "Detail 1 of N" shows,
  press Improve again -> must NOT re-improve; must offer continue/undo.
- Repro 3A: vague prompt -> improve -> must land on the `Improved · compare ·
  undo` chip FIRST, with "+ N details" as an offer, never auto-jumping past it.
- Repro 1: fresh profile (clear extension storage), no account -> first improve
  -> must NOT show "Pro: unlimited".
- Repro 2b: run 10 vague prompts through the sharpen route, confirm none of the
  rewrites are "ask the user these questions" loops.
- Repro 2c: after 2a fix, confirm no path leaves the box in a state where a
  single Enter sends an unreviewed rewrite.

---

## Exact reconstruction of the user's second-improve (for reference)

The prompt that got sent on the second improve was a nested interrogation:
"Ask me 5 quick questions only before you write the post... 1) role 2) company
3) achievements 4) what's next 5) tone. After I answer, write one authentic
LinkedIn post (120-180 words)..."

How it got there:
1. First improve of "write a linkedin post about me leaving my job" (a vague
   prompt) produced a rewrite already in the "ask me questions first" style
   (Issue 2b, `sharpen.ts:58`).
2. That put the chip into the `filling` phase (details), skipping the
   `done`/compare/undo chip (Issue 3, failure #1).
3. Second Improve press: the guard `boxHoldsOurOutput()` only fires in `done`,
   not `filling`, so it did not block (Issue 2a). `onSharpen` read the
   already-improved "ask me 5 questions" text as the new input and improved IT,
   producing the compounded, even longer interrogation.
4. A stray Enter (box was focused, full of text, in a broken state) sent it
   (Issue 2c).

Every step here is a direct consequence of a specific, verified code path above.
