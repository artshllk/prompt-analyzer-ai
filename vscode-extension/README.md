# Deepclario for VS Code

Improve the prompts you write for AI — right inside your editor. Select the
text, run **Improve Prompt**, and Deepclario scores it, asks one quick
question if something's missing, and hands back a clearer rewrite you can
drop straight in.

Works with prompts anywhere in your editor: a `.prompt` file, a system
prompt in code, a comment, a markdown doc — anything you'd paste into
ChatGPT, Claude, or Gemini.

## Usage

1. **Select** the prompt text.
2. Run **Deepclario: Improve Prompt** from the Command Palette, the editor
   right-click menu, or the shortcut **⌘⌥I / Ctrl+Alt+I**.
3. If Deepclario needs one detail, it asks; answer or press Esc to let it
   assume.
4. Review the rewrite, then **Replace selection** or **Copy**.

## Free vs Pro

- **Anonymous** — works with zero setup (rate-limited by IP).
- **Free account** — 25 rewrites/month. Run **Deepclario: Connect Account**,
  grab your code from [deepclario.com/extension/connect](https://deepclario.com/extension/connect),
  and paste it. The code is stored securely via VS Code's secret storage.
- **Pro** — unlimited. Upgrade at [deepclario.com/pricing](https://deepclario.com/pricing).

## Settings

| Setting | Default | Description |
|---|---|---|
| `deepclario.tone` | `professional` | Tone the rewrite aims for (professional / friendly / persuasive / concise / creative). |
| `deepclario.apiBaseUrl` | `https://deepclario.com` | API base URL. Override only for local dev or a self-hosted instance. |

## Commands

- **Deepclario: Improve Prompt**
- **Deepclario: Connect Account**
- **Deepclario: Disconnect Account**

## Develop

```bash
npm install
npm run build      # bundle to dist/extension.js
npm run watch      # rebuild on change
npm run typecheck  # tsc --noEmit
```

Press **F5** in VS Code to launch an Extension Development Host with the
extension loaded.

## How it works

A thin client over Deepclario's public analyze API
(`POST /api/anon/analyze`). The prompt-improvement engine, rate limiting,
accounts, and billing all live server-side and are shared with the web app
and browser extension. The connection token uses the same `dc_` flow as the
browser extension.
