# Deepclario extension - changelog

## Read this first

**Live on the Chrome Web Store: 0.9.0** (confirmed live 2026-07-25).
**Next submission: 0.9.1.**

The store and the repo are finally in step. 0.9.0 cleared review and carried
everything from the five internal builds that were never published, so every
user is now on the ask-first flow with a working Mac shortcut.

---

## 0.9.1 (unreleased)

### Improve stopped waiting to decide it had nothing to ask

Every press paid a 2-6 second round trip to a reasoning model before a single
word could appear, to find out whether the prompt was ambiguous. Most were not,
so most of that wait bought a decision to say nothing, while the chip read
"Improving" over a box that did not move.

The check now runs only when it might change something. A prompt that already
names its audience, its output shape, its limits or its tone is not sent for a
second opinion, and streams in under a second the way the fast path was built
to. Anything short or thin still goes through the check, which is the half
where a question is worth waiting for.

The rule is local and deliberately loose (`needsForkCheck` in `content.js`).
Guessing "specific" when it was not costs one unasked question, which is what
every other prompt tool does anyway. Guessing "vague" when it was not costs the
wait that already exists today. Neither can produce a wrong rewrite, which is
what makes a heuristic acceptable in front of a model call.

A length floor sits under it, because a short prompt can name a format and a
tone while still naming no task at all. "Summarize in 100 words, professional
tone" trips two patterns and is still missing the only thing that matters.

### Known gap in this build

Nothing measures whether any of this helps. The extension still records no
events, so accept-versus-undo, the rate at which questions are shown and
answered, and install-to-first-use are all unknown.

---

## 0.9.0 - live on the store

Rolled up from internal builds 0.7.1, 0.8.0, 0.8.1, 0.8.2 and 0.8.3.
12 commits, `c7b093a..eb50d56`.

### The extension has a new name

`Deepclario - Better AI prompts, one key` is now
**`Deepclario: AI Prompt Improver`**. "one key" described the mechanism, and
nobody wants a keystroke, they want a better prompt. The new title is also the
phrase people actually type into the store search box. The summary now leads
with what it does and where, and names the one thing no other prompt tool does:
it asks what you meant before it rewrites. (`eb50d56`)

**This makes the submission a fresh review, not a silent update.** A name change
is reviewed as a new listing would be.

### The Improve chip stayed where it belonged

Three separate position bugs, all of them the same mistake made in different
places: anchoring to an edge that moves.

- On a long prompt the chip flew to the top of the screen. It was positioned
  40px above the composer's top edge, and the composer grows upward, so on a big
  paste that edge went off screen and took the chip with it. (`fba0900`)
- The follow-up fix moved the chip 1px for every 1px typed, because it still
  measured the editable's top edge. The editable is the scroll content inside a
  capped box: past the cap the box stops growing and the text does not. It now
  anchors to the visible composer, so it stops when the box stops. (`1adbaba`)
- A safety rule that refused to place anything above the middle of the screen
  turned out to be false on the new-chat screens, where all three sites centre
  the composer. It was putting the chip on top of the box it was meant to sit
  above. Removed. (`1adbaba`)

### Compare stopped vanishing before you could click it

After a rewrite, the Compare button appeared and disappeared a second or two
later. The chip survived only while the text we wrote still matched the text we
read back, and those two strings are produced by different systems. The host
editors normalise what we insert, and reading it back through `innerText`
re-derives it from layout, so the strings drift apart on any rewrite with
paragraphs or bullets. The extension was deciding "the user edited this" about
text nobody had touched.

An edit is now an event, not a comparison. Compare stays until you type, send,
undo, or open it. (`32f9889`)

Also fixed: the "N free improvements left today" message was painting on top of
the chip for the 1.8 seconds it was on screen, which looked like the same bug.
It now stacks above. (`32f9889`)

### The keyboard shortcut works on a Mac

Option+I is a dead key on macOS: the system swallows it to compose an accent, so
the browser never reported the letter "i" and the shortcut did not exist on a
Mac at all. It now matches the physical key, which covers every layout. The chip
also shows the right symbol, so Mac users are not told to press a key that is not
on their keyboard. (`c9ae7c5`)

### It stopped sending prompts you never sent

Pressing Enter to submit a typed answer to one of our own questions let the
keystroke through to ChatGPT, which sent the half-finished prompt. (`4b4fa9b`)

Clicking undo reverted the prompt and immediately re-improved it, because the
click landed on the button and on the chip behind it. (`0b5b525`)

### A long prompt no longer blames us

A 40,000 character prompt was sent over the network to be rejected server side,
and came back as "Something went wrong on our end", which was both untrue and
unfixable by retrying. It now fails instantly with the actual reason, in words
rather than characters: "That prompt is too long to improve (roughly 7,250
words). Improve one section at a time." (`fba0900`)

### Smaller things you would notice

- Five free improvements before we ask for an account, up from two. Two is
  enough to be curious and not enough to be convinced. (`fba0900`)
- Signing in is now an approve button on deepclario.com instead of copying a
  code by hand. The code still exists as a fallback for when the page cannot see
  the extension. (`fba0900`)
- You can type your own answer to the first question, not just the follow-up
  ones. The tappable answers are a shortcut, never a cage. (`8e04e06`)
- The finished chip offers "+ N details" instead of jumping straight into the
  questions, so Compare and undo are reachable first. (`dd54cd9`)
- The busy chip holds one label instead of flashing through three that nobody
  could read. (`dd54cd9`)

### Risk this shipped with

The Compare fix (`32f9889`) went out without being verified in a browser. It
depends on `execCommand('insertText')` dispatching its `input` event
synchronously, which is true per spec and true in every implementation checked
by reading, but was never confirmed by running it against ChatGPT, Claude and
Gemini.

It is in front of users now, so the question is no longer whether to check
before submitting but whether it is currently broken on one of the three. The
symptom is loud: the Compare chip disappears the instant a rewrite lands
instead of staying put. **Do one improve on each of chatgpt.com, claude.ai and
gemini.google.com and watch whether Compare survives.** Nothing in the product
would tell us if it does not.

---

## Published history

### 0.7.0 - 2026-07-13 (`c7b093a`) - live on the store

The extension-first pivot. One streaming call improves the prompt in place, in
the box, instead of opening a panel. This is the version every current user is
running.

### 0.6.0 - 2026-07-09 (`c76e78f`)
Contact address moved to contact@deepclario.com.

### 0.5.0 - 2026-07-04 (`e6f801f`)
Deep Rewrite for Pro, tone picker, UX fixes.

### 0.4.2 - 2026-07-03 (`4d91859`)
Refreshed the served zip.

### 0.4.1 - 2026-07-01 (`19c2f88`)
Corrected icon.

### 0.4.0 - 2026-06-25 (`02d1bf1`)
Stopped keystrokes leaking into the host page's editor. A first attempt at an
inline Improve button shipped as 0.5.0 on 2026-06-26 and was reverted the same
day (`25eb060`, `380215f`), which is why 0.5.0 appears twice in the git history
with different contents.

### 0.3.0 - 2026-05-31 (`dc667b7`)
Clarifying questions capped at three.

### 0.2.0 - 2026-05-21 (`6730548`)
Connected the extension to Deepclario accounts.

### 0.1.0 - 2026-05-18 (`3d58744`)
First MV3 build.

---

## Submitting

1. Bump `manifest.json` version. The store rejects a resubmission that reuses a
   number, and the number must be higher than 0.7.0.
2. Keep `store-listing.md` TITLE and SUMMARY identical to the manifest `name`
   and `description`. They are the same strings in two files and they drift.
3. Rebuild the zip from `extension/` with the manifest, the four scripts, the
   popup, and `icons/`. No markdown files.
4. Check the screenshots. A listing that promises "AI Prompt Improver" over a
   screenshot captioned "one key" reads as sloppy.
5. Load the zip unpacked and improve one prompt on each of chatgpt.com,
   claude.ai and gemini.google.com. Every bug in the 0.9.0 list above reached a
   version bump without this step.
