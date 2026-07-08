# Browser extension (and future clients)

## Current: browser extension

- Source lives in `extension/` (Manifest V3, currently v0.5.0). Named
  "Deepclario - Improve your AI prompts". `host_permissions` includes
  `https://deepclario.com/*`.
- It targets ChatGPT / Claude / Gemini web surfaces, letting users improve a prompt
  in place.
- **Heads up:** built versions also exist as zips on the Desktop
  (`deepclario-extension-v0.4.1.zip`, `deepclario-extension-v0.5.0/`, etc.). The
  in-repo `extension/` is the source; the zips are packaged builds. Confirm which is
  current before shipping a new version.

## How a client authenticates (the `dc_` token flow)

Every client (extension, and future VS Code / MCP) uses the same flow:

1. The user opens `deepclario.com/extension/connect` and copies a `dc_` token.
2. The client stores it securely (extension storage; for VS Code, `context.secrets`).
3. The client sends it as a `Bearer` token to `POST /api/anon/analyze`.
4. `validateToken` (`lib/db/api-tokens.ts`) resolves the token to the user's plan.
   No token means anonymous, IP-rate-limited use with no DB write.

Tokens are minted by `POST /api/extension/issue-token`. The API tags each call with
a `source` (`extension` / `web` / future `vscode`).

## Why new clients are cheap

`analyzePrompt()` is pure and portable, and `/api/anon/analyze` already handles auth,
rate limiting, and the Pro gate. A new client is ~80% UI over an existing, stable
API. This is the basis for the VS Code beachhead in `.claude/roadmap.md`.

## Future clients (see roadmap.md)

- **VS Code extension** — the planned beachhead (Command Palette + context menu MVP,
  then a sidebar webview).
- **MCP server** — a thin wrapper exposing `analyzePrompt` as a tool for Claude
  Code / Cursor / Claude Desktop.
