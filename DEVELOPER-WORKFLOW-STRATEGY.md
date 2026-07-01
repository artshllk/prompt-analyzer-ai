# Developer Workflow Strategy — Deepclario

## Context

Deepclario improves AI prompts. Today it reaches developers only through the **browser extension** (ChatGPT/Claude/Gemini) and the **web playground**. Neither sits where developers actually spend their day: the **code editor**. The goal is to decide the single best next surface to embed Deepclario into a developer's daily workflow, optimizing for **fast adoption** with a **solo/very-lean** build capacity, and to lay out a phased roadmap.

**Key architectural fact that drives the whole recommendation:** the core `analyzePrompt()` in `src/lib/engine/index.ts` is a **pure, portable function** — no Next.js, Supabase, or HTTP dependencies. The API already exposes a client-agnostic endpoint (`POST /api/anon/analyze`) that accepts an optional `dc_` bearer token, and there is already a **token-issuance auth flow** (`/api/extension/issue-token` + `/extension/connect`). Any new client is therefore **~80% UI**: the engine, API, auth, rate-limiting, and billing are already built and reusable. This makes a **VS Code extension cheap to build and the obvious beachhead.**

This document is the deliverable itself — a strategy `.md`. No code changes are proposed here beyond writing this file.

---

## The four options, compared

| Option | What it is | Build effort (solo) | Adoption potential | Enterprise fit | Revenue path | Reuses existing stack? |
|---|---|---|---|---|---|---|
| **A. VS Code extension** | Native extension; improve prompts for Copilot/Cursor/inline AI, or any selected text | **Low–Med** | **High** (huge marketplace, devs live here) | Medium (later: private registry, SSO) | Strong (same Pro/token model) | **Yes — ~80%** |
| **B. Claude integration** | Work alongside Claude (Claude Code, MCP server, or Projects) | **Low** (MCP) to Med | Med–High (fast-growing, but you already cover claude.ai via the browser ext) | Low now | Indirect | Yes (engine as MCP tool) |
| **C. Desktop app** | Standalone Win/Mac/Linux app, global hotkey, system-wide | **High** | Medium | Medium | Medium | Partial (new shell, updater, signing) |
| **D. VM / Enterprise** | Self-hosted / air-gapped install for orgs | **Very High** | Low (few, slow deals) | **High** | High per-deal, low volume | Partial (needs self-host of API + swap Gemini/Paddle/Supabase) |

### A. VS Code Extension — the beachhead

**Discovery & access:** VS Code Marketplace (millions of devs, built-in search, one-click install, auto-update). This is the single biggest distribution channel in the option set and requires no new infrastructure from you.

**UI/UX placement (ranked by value/effort):**
1. **Command Palette** (`Deepclario: Improve Prompt`) — trivial to build, discoverable, keybindable. **Ship first.**
2. **Editor context menu** on a text selection ("Improve prompt with Deepclario") — natural for improving a prompt sitting in a file, a comment, or a `.prompt`/markdown doc.
3. **Sidebar view** — a panel (webview) mirroring the web playground: paste → score → clarify → rewrite. Reuses the two-column streaming UX already built for `/playground`.
4. **Inline code action / CodeLens** on detected prompt strings (e.g. inside `messages: [...]`, template literals) — higher effort, do later.

**Auth & onboarding:** Reuse the existing token flow verbatim. Extension opens `deepclario.com/extension/connect` in a browser → user copies the `dc_` token → paste into a VS Code input → store in `context.secrets` (encrypted, OS-backed). Anonymous use works with zero setup (IP-throttled), exactly like the browser extension. **No new auth to build.**

**Pros:** highest adoption ceiling; ~80% code reuse (engine + `/api/anon/analyze` + token auth + Pro billing all exist); low maintenance (thin client over a stable API); clean Pro upsell (same 25/mo → unlimited); a credible path to enterprise later (VS Code supports private extension registries + SSO).
**Cons:** the marketplace is crowded; must nail a *specific* use case (improving prompts devs write for AI, not "another AI panel"); webview UI needs building (but the design already exists on the web).
**Complexity:** Low for Palette+context-menu MVP; Medium for the full sidebar webview.

### B. Claude Integration (MCP server)

**Best entry point:** ship an **MCP server** exposing `analyzePrompt` as a tool. Then Claude Desktop, Claude Code, Cursor, and any MCP-aware client can call "improve this prompt" natively. This is a *complement* to A, not a competitor — and it's low effort because it's a thin wrapper over the already-portable engine/API.

**User journey / limitations:** great for power users already in Claude/Cursor; discovery is weaker (no marketplace push like VS Code); monetization is indirect (MCP calls would need the same token/limit model wired in). You **already** cover the claude.ai web surface via the browser extension, so this mainly adds Claude *Code/Desktop* reach.

**Verdict:** high-leverage **Phase 2** add-on, not the beachhead. Cheap because the engine is portable.

### C. Desktop App

**What it buys:** system-wide global hotkey to improve any highlighted text in any app; offline-ish feel; a "serious tool" perception.
**Cost (solo):** high and ongoing — Electron/Tauri shell, code signing (Apple notarization + Windows cert), auto-updater, three-OS QA, its own distribution. None of this reuses the current web stack meaningfully.
**Verdict:** **defer.** The adoption-per-effort ratio is poor for a lean team, and VS Code already covers "where developers work."

### D. VM / Enterprise Install

**What it needs:** self-hostable API (containerize the Next API + engine), swap Gemini/Paddle/Supabase for customer-controlled equivalents or bring-your-own-key, SSO (SAML/OIDC), audit logging, private update channel, security review/DPA.
**Verdict:** **highest revenue per deal, lowest volume, heaviest build.** Wrong first move for a solo founder chasing adoption. Becomes viable **only after** bottom-up adoption creates pull ("our devs already use this, can we get it approved company-wide?"). Design the token/tenant model now so you don't block it later, but **do not build it yet.**

---

## Recommendation

**Build the VS Code extension as the beachhead (Option A), add the Claude/MCP server as a fast follow (Option B), and hold C and D until pulled by demand.**

**Why this is the right strategic choice:**
- **Fast adoption (your top priority):** the VS Code Marketplace is the largest, lowest-friction distribution channel available, and it's exactly where developers already are.
- **Lowest effort for the payoff (solo/lean):** ~80% is already built. You're shipping a thin client over a proven engine, API, auth, and billing. Options C and D require large net-new infrastructure.
- **Long-term maintainability:** a thin client over a stable, versioned API is the cheapest thing to keep alive.
- **Revenue continuity:** the exact same anon → free(25/mo) → Pro (\$5/mo, Paddle) funnel and `dc_` token carry over unchanged.
- **Enterprise optionality:** VS Code supports private registries and SSO, and bottom-up dev adoption is the standard on-ramp to enterprise deals — so A seeds D without committing to D now.

---

## Roadmap

### Phase 1 — VS Code MVP (fastest path to daily use)
- **Command Palette** `Deepclario: Improve Prompt` + **editor context menu** on selection.
- Calls the existing `POST /api/anon/analyze`; anonymous works out of the box.
- Result shown in a lightweight webview (or, minimally, replaces the selection / inserts below it).
- **Auth reuse:** `/extension/connect` token → store in `context.secrets`.
- Publish to Marketplace. Instrument `source: "vscode"` (the API already tags `source`).
- *Goal: prove devs invoke it in real editing sessions.*

### Phase 2 — Depth + second surface
- **Sidebar webview** mirroring the `/playground` two-column streaming + clarify flow (reuse the design).
- **MCP server** wrapping `analyzePrompt` (Option B) → Claude Code / Cursor / Claude Desktop reach.
- In-editor Pro upsell at the 25/mo limit (reuse `PaywallModal` patterns).

### Phase 3 — Reach + enterprise groundwork
- **Inline code actions / CodeLens** on detected prompt strings in code.
- **Enterprise readiness (only if demand appears):** containerize API + engine, add SSO + bring-your-own-key (Gemini/Anthropic), private VS Code registry distribution, audit logging → unlocks Option D.
- Consider the desktop app (Option C) only if a clear "outside the editor" need emerges.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Marketplace is crowded; "just another AI panel" | Position narrowly: *improve the prompts you write for AI*, invoked on selection. Lead with the clarify-then-rewrite differentiator. |
| In-memory rate limiting won't scale across many clients | Swap to Redis/Upstash behind the same call sites in `src/lib/rate-limit.ts` (already flagged in-code) before a big launch. |
| Copy-paste token onboarding adds friction | Ship anonymous-first (zero setup); offer token connect only when the user hits the free ceiling. Consider a deep-link/URI-handler connect flow later. |
| Engine coupled to Gemini | `callGemini()` is the only provider seam; keep it swappable so enterprise BYO-model (D) stays cheap. |
| Solo bandwidth spread thin | Ship Phase 1 (Palette + context menu) only; resist the sidebar/MCP until the MVP shows real invocation. |

---

## Estimated implementation complexity

| Option | Complexity (solo) | Notes |
|---|---|---|
| A · VS Code — Palette + context menu (Phase 1) | **Low** | Thin client over existing API + token auth |
| A · VS Code — Sidebar webview (Phase 2) | **Medium** | Rebuild `/playground` UX in a webview |
| B · Claude MCP server | **Low–Med** | Thin wrapper over portable `analyzePrompt` |
| C · Desktop app | **High** | New shell, signing, updater, 3-OS QA |
| D · VM / Enterprise | **Very High** | Self-host API, SSO, BYO-model/billing, security review |

---

## Deliverable / verification

This task's deliverable **is** this strategy document — there is no code to run or test. "Done" = the doc clearly compares the four options and lands a defensible, phased recommendation aligned to fast adoption + lean capacity, grounded in the real architecture (portable engine, reusable API + token auth + billing).

If you approve the direction, the natural **next action** (a separate task) is to scaffold the Phase 1 VS Code extension: a new top-level `vscode-extension/` package with a Command Palette command + context-menu action that POSTs the selected text to `/api/anon/analyze` and shows the rewrite — reusing the `dc_` token flow for Pro.
