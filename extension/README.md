# Deepclario browser extension - Phase 1

A Manifest V3 Chrome/Edge/Brave extension that adds an **Improve prompt**
button on ChatGPT, Claude, and Gemini. It reads the prompt you're about to
send, scores it, asks one clarifying question if needed, and gives you a
rewrite - without leaving the page.

It reuses the existing public endpoint `https://deepclario.com/api/anon/analyze`
(no backend changes, no auth, IP rate-limited).

## What it does

1. Floating "✦ Improve prompt" button, bottom-right, on:
   - chatgpt.com / chat.openai.com
   - claude.ai
   - gemini.google.com
2. Click → panel slides in, pre-filled with whatever is in the chat input.
3. Click → clarity score → (optional) one clarifying question → rewrite.
4. **Copy** (always works) or **Replace in chat** (writes back into the page input).

## Test it now (no review needed)

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. Open chatgpt.com - the button appears bottom-right

Works in Chrome, Edge, Brave, Arc (anything Chromium).

## Publish to the Chrome Web Store (your steps, ~1–3 day review)

This part is gated by Google, not by code:

1. Create a developer account at
   https://chrome.google.com/webstore/devconsole (one-time $5 USD fee).
2. Zip the **contents** of this folder (not the folder itself):
   ```
   cd extension && zip -r ../deepclario-extension.zip . -x "*.DS_Store"
   ```
3. In the dev console: **New item** → upload the zip.
4. Fill the store listing:
   - Name: Deepclario - Improve your AI prompts
   - Summary: Score and rewrite your prompt before sending it to ChatGPT,
     Claude, or Gemini.
   - Category: Productivity
   - Privacy policy URL: https://deepclario.com/privacy
   - Screenshots: 1280×800 (capture the panel open on chatgpt.com)
5. Justify permissions in the form:
   - `host_permissions: deepclario.com` → "calls our analysis API"
   - content scripts on the 3 chat sites → "injects the Improve button"
6. Submit. Review is typically **1–3 business days** for a new publisher.

## Privacy / data handling (state this in the listing)

- The only data sent anywhere is the prompt text you choose to improve.
- It goes to `deepclario.com/api/anon/analyze`, is analyzed once, and is
  not stored (no account, no DB write on the anon endpoint).
- No analytics, no tracking, no other network calls.

## Known Phase-1 limitations (intentional - this is a test)

- "Replace in chat" is best-effort. ChatGPT/Claude/Gemini use custom
  rich-text editors whose DOM changes often; if a replace fails, the
  Copy button always works. This is acceptable for a validation test -
  we're measuring "does anyone click Improve twice", not polish.
- No accounts, no saved history, no live-as-you-type scoring. That's
  Phase 2, only if Phase 1 shows real repeat usage.
- Selectors for the three host sites may need occasional updates as
  those sites change. The `READ_SELECTORS` list in `content.js` is the
  single place to fix that.

## Files

| File            | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `manifest.json` | MV3 manifest, host perms, content-script matches   |
| `background.js` | Service worker - does the cross-origin API fetch   |
| `content.js`    | Injected UI (Shadow DOM), prompt read/write, panel |
| `icons/`        | 16 / 48 / 128 px (generated from the site logo)    |
