# Roadmap

Near-, mid-, and long-term direction. The full four-option strategy analysis
(VS Code vs MCP vs Desktop vs Enterprise), with the detailed comparison table and
risks, lives in `.claude/architecture/dev-workflow-strategy.md`. This is the short
version.

## The strategic bet

Deepclario reaches users today through the **browser extension** and the **web
playground**. Neither sits where developers spend their day: the code editor. The
plan is to embed Deepclario there.

**Why this is cheap:** `analyzePrompt()` in `src/lib/engine/index.ts` is a pure,
portable function (no Next/Supabase/HTTP deps), exposed via `POST /api/anon/analyze`
with an optional `dc_` bearer token, and there is already a token-issuance flow
(`/api/extension/issue-token` + `/extension/connect`). Any new client is ~80% UI.
The engine, API, auth, rate-limiting, and billing are already built and reusable.

## Phases

### Phase 1 — VS Code extension MVP (the beachhead)
- Command Palette `Deepclario: Improve Prompt` + editor context menu on a selection.
- Calls existing `POST /api/anon/analyze`; anonymous works with zero setup.
- Reuse the `dc_` token flow (`/extension/connect` → store in `context.secrets`).
- Publish to the VS Code Marketplace. Tag `source: "vscode"` (the API already tags source).
- Goal: prove developers invoke it in real editing sessions.

### Phase 2 — Depth + second surface
- Sidebar webview mirroring the `/playground` two-column streaming + clarify flow.
- **MCP server** wrapping `analyzePrompt` → Claude Code / Cursor / Claude Desktop reach.
- In-editor Pro upsell at the free limit (reuse the paywall patterns).

### Phase 3 — Reach + enterprise groundwork
- Inline code actions / CodeLens on detected prompt strings in code.
- Enterprise readiness only if demand appears: containerize API + engine, SSO,
  bring-your-own-model (the `callGemini()` seam keeps this cheap), private registry.
- Desktop app only if a clear "outside the editor" need emerges.

## Known risks (carry forward)

- **In-memory rate limiting won't scale** across many clients. Swap to Redis/Upstash
  behind the existing call sites in `src/lib/rate-limit.ts` before a big launch.
- Marketplace is crowded — position narrowly as "improve the prompts you write for
  AI", not "another AI panel". Lead with the clarify-then-rewrite differentiator.
- Engine is coupled to specific providers via `callLLM`/`callGemini`. Keep those
  seams swappable so enterprise bring-your-own-model stays cheap.

## Backlog / open items

- **Token counter has no public page** yet, though the logic exists (`lib/tokens.ts`,
  `gpt-tokenizer`). The token blog posts currently have no product CTA because of this.
- **Stripe is a dead dependency** (`lib/stripe.ts`, `stripe` package, Stripe env vars).
  Billing is Paddle. Consider removing Stripe to avoid confusion. See `decisions/0001`.
- **3D dependencies** (`three`, `react-three-fiber`, `components/3d/`) exist but 3D is
  a rejected direction. Confirm whether they are still used anywhere before removing.
