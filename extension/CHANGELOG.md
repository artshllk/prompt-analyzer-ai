# Deepclario extension - changelog

## Read this first: the store is behind the repo

**Live on the Chrome Web Store: 0.7.0** (published 2026-07-13, commit `c7b093a`).
**Next submission: 0.9.0.**

Five versions were bumped locally and never published: 0.7.1, 0.8.0, 0.8.1,
0.8.2, 0.8.3. Nobody has ever run them. Every user on the store is sitting on
0.7.0 and will jump straight to 0.9.0 in one update.

That is why the next number is 0.9.0 rather than 0.8.3. The store shows users a
single version string, and 0.8.3 reads like a patch on a 0.8.x they never had.
One minor bump for everything since 0.7.0 is the honest label, and it leaves
0.9.x free for fixes that follow this submission. 1.0.0 is deliberately not
being spent here: part of this release is still unverified against a real
browser (see the release notes below).

The internal builds are recorded under the 0.9.0 entry so the trail from a
commit to a shipped version stays intact.

---

## 0.9.0 (unreleased)

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

### Known risk in this build

The Compare fix (`32f9889`) has not been verified in a browser. It depends on
`execCommand('insertText')` dispatching its `input` event synchronously, which
is true per spec and true in every implementation checked by reading, but was
not confirmed by running it against ChatGPT, Claude and Gemini. If that
assumption is wrong on one of them, the chip will disappear *immediately* rather
than after two seconds, which is loud enough to catch on the first improve.

**Load the unpacked build and do one improve on each of the three before
submitting.**

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
