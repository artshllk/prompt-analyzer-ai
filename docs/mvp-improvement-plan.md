# Deepclario MVP Presentation & UX Improvement Plan

## Context

The product is near MVP. Goal before acquiring users: no new features, no over-engineering. Improve presentation, trust, onboarding, copy, and SEO so a first-time visitor understands the product in seconds and trusts it enough to try it. This document is the audit + improvement plan; nothing is implemented yet.

**Product as it exists today:** Deepclario rewrites rough prompts for ChatGPT/Claude/Gemini, asks one clarifying question when context is missing, scores clarity, and offers a Chrome extension, an AI text detector, a 25-prompt library, and 48 blog posts. Free: 5 rewrites/48h. Pro: $4.99/mo (launch price), Deep Rewrite, unlimited, insights, full history.

---

## Part 1: Current problems found

### A. Credibility / trust (most serious)

1. **Fake testimonials are live on the homepage.** `src/components/marketing/Testimonials.tsx` renders three invented quotes with invented names ("Mira L.", "Devansh K.", "Mateus R.") and a fabricated "90% of my bad answers were my fault" stat. The file's own comment says they must be replaced before launch. Shipping fake social proof is the single biggest trust risk; one skeptical user tweet about it can sink an MVP launch.

2. **The free-tier numbers contradict each other in at least 4 places:**
   - Reality (`src/lib/limits.ts`): 5 rewrites per rolling 48h, anon limit = 1.
   - Home metadata, FAQPage schema, `FAQSection.tsx`: "25 prompt rewrites per month".
   - `SignupGate.tsx` / `DemoSignupGate.tsx`: "25 analyses every month", "Sign up free for 25/month".
   - `PlaygroundClient.tsx` hard-codes `ANON_LIMIT = 2` vs `ANON_REWRITE_LIMIT = 1` in limits.ts.
   - Pricing card correctly says "5 prompt rewrites / 48h".
   A user who signs up expecting 25/month and hits a wall at 5 will feel misled. **Decided: 5 per 48h is the real plan** — all copy/schema gets aligned to it; anon limit aligned to `limits.ts`.

3. **FAQ promises "persona memory"** which the pricing component comment explicitly says is NOT shipped (`EditorialPricing.tsx:11-16`, `FAQSection.tsx`). Overselling an unshipped feature.

4. **No data-handling reassurance where it matters.** The product asks users to paste their prompts (work emails, code, business ideas). The only "do you store my prompts?" answer is buried in the FAQ. Nothing near the input, nothing on the landing page.

### B. Messaging / copy

5. **Headline is the exact vague-AI phrase to avoid.** H1 + OG title: "AI that actually understands what you mean." It's abstract, unfalsifiable, and could describe any AI product. It doesn't say what Deepclario *does*.

6. **"One layer between you and ChatGPT..." (footer, FAQ)** — "one layer" is undefined jargon to a normal person.

7. **Unexplained feature jargon:** "Five-dimension clarity scoring" (which five? never explained), "our strongest model" (which?), "Deep Rewrite: multi-pass rewrites" (technical framing, not a benefit).

8. **Repetition reads robotic:** "ChatGPT, Claude, and Gemini" appears in nearly every section; "a senior teammate would ask" simile repeated across hero, meta, schema, FAQ.

9. **Terminology drift inside the product:** "Improve" vs "Analyze prompt" vs "New analysis" vs "rewrites" vs "analyses" vs "sessions" — five words for one action. Pick one ("rewrite" as noun, "Improve" as verb) and use it everywhere.

### C. Onboarding

10. **No first-run guidance beyond a 2.4s splash.** The welcome splash (`WelcomeMoment.tsx`) is pretty but teaches nothing. After it, users land on a Dashboard, not the Playground — the dashboard is empty and the value moment (a rewrite) is one more click away.

11. **New users land on `/dashboard` instead of `/playground`.** The dashboard empty state is decent, but the fastest path to activation is putting a new user directly in the Playground with an example pre-loaded.

12. **The clarifying-question step — the product's signature moment — is never previewed** to new users before it happens. First time it fires, a user may think something went wrong ("why is it asking me a question instead of answering?").

### D. UI/UX consistency

13. **Two visual languages coexist.** Editorial ink/paper theme (marketing, dashboard, playground, paywall) vs a legacy violet/navy "glass" theme on `SettingsClient.tsx` and `SignupGate.tsx`. Settings sits inside the polished app shell, so the clash is very visible.

14. **Two sample-prompt sets** (dashboard vs playground) and an orphaned `PromptEditor.tsx` component with different button copy.

### E. SEO gaps (foundation is already strong — sitemap, robots, JSON-LD, canonicals, RSS all exist)

15. `/refund` has no exported metadata and is missing from the sitemap; `/privacy` and `/terms` lack canonicals.
16. FAQPage schema on the homepage repeats the wrong "25/month" claim (schema lies get flagged).
17. Blog internal linking is hand-curated and uneven; no related-posts by tag.
18. Blog mixes two topic clusters (prompt engineering + AI detection) — fine, but the detection cluster should funnel to `/detector`, the prompting cluster to `/playground`, consistently.
19. Author schema is Organization-only; a named founder author would strengthen E-E-A-T (and matches the "reply to my email, I read everything" founder voice already used in emails).

---

## Part 2: Recommended improvements, by priority

### 🔴 Must have before launch

**1. Replace fake testimonials with an honest early-days block** (`Testimonials.tsx`) — *decided*
Replace the section with a real before/after prompt example plus a short founder note ("Deepclario is new. Here's exactly what it does to a rough prompt."). No invented people, no invented stats.

**2. Fix the limits contradiction everywhere — the real plan is 5 rewrites per 48h** (*decided*; matches `limits.ts`, no backend change)
Files: `FAQSection.tsx`, `SignupGate.tsx`, `DemoSignupGate.tsx`, `PlaygroundClient.tsx` (ANON_LIMIT), home + pricing FAQPage JSON-LD, home metadata. Remove "persona memory" from FAQ.

**3. Rewrite the hero** (`src/app/(marketing)/page.tsx`) — see Part 3 for copy.

**4. Add a one-line trust note near every prompt input**
Playground, demo modal, detector: something like "Your prompts are private. We never train on them or share them." linking to /privacy. Also add a short "Your data" trio (private / not used for training / delete anytime — only claim what's true) above the pricing section on the landing page. Verify claims against the actual privacy policy before writing them.

**5. Land new users in the Playground, not the Dashboard**
Change post-signup redirect in `login/page.tsx` (and auth callback) to `/playground` for first-session users (dashboard for returning). Cheapest possible activation win; no new feature needed.

**6. Fix SEO hygiene:** add metadata + sitemap entry for `/refund`, canonicals for `/privacy` and `/terms`, correct the FAQPage schema numbers.

### 🟡 Should improve soon (first weeks after launch)

**7. Lightweight first-run guidance in the Playground** (see Part 4 — not a heavy tour library)

**8. Unify terminology:** verb = "Improve", noun = "rewrite". Rename "New analysis" → "New rewrite" (dashboard CTA), align `PromptEditor.tsx` or delete it, merge the two sample-prompt sets into one.

**9. Restyle `SettingsClient.tsx` and `SignupGate.tsx` to the editorial theme.** Pure CSS/token work, no logic changes.

**10. Explain the two named features where they appear:**
- "Five-dimension clarity scoring" → either name the five dimensions in a tooltip/one-liner or simplify the label to "Clarity score" everywhere.
- Deep Rewrite tooltip is fine; add one benefit sentence on the pricing card ("It drafts, critiques its own draft, then rewrites. Like getting a second opinion built in.").

**11. Related-posts by tag on blog** (small component reading `BLOG_POSTS`, filter by tag, 3 links) to even out internal linking automatically.

**12. Founder author on blog posts:** add `Person` author (Art) to Article schema + a one-line byline. Matches the founder-voice emails, boosts E-E-A-T.

### 🟢 Nice to have later

13. Real social proof pipeline: in-app "enjoying this?" prompt after 3rd successful rewrite → ask for a quote/tweet; add Chrome Web Store rating badge once reviews exist.
14. A `/vs` or "why not just ask ChatGPT to improve my prompt?" page — this is the #1 competitor objection and a strong SEO page.
15. Programmatic SEO expansion of the prompt library (25 → 50+ prompts; each category gets a hub page `/prompts/coding` etc.).
16. Simple changelog or "what's new" page (trust signal that the product is alive).
17. OG image polish per marketing page (already have dynamic OG for blog).
18. Use `NEXT_PUBLIC_APP_URL` for metadataBase instead of hardcoded domain so previews don't emit prod canonicals.

---

## Part 3: Suggested copy changes

Principles: plain English an intermediate speaker follows, benefit-first, short, no "actually/really understands you" style claims, concrete over clever.

### Hero (`src/app/(marketing)/page.tsx`)

| Element | Current | Suggested |
|---|---|---|
| H1 | "AI that actually understands what you mean." | **"Turn a rough prompt into a great one."** (alt: "Your prompt, rewritten so AI gets it right the first time.") |
| Subhead | "You type the rough idea. Deepclario fixes what is missing and asks the questions a senior teammate would ask. ChatGPT, Claude, and Gemini stop guessing. You stop editing." | **"Paste your prompt. Deepclario spots what's missing, asks you one quick question, and rewrites it. Works with ChatGPT, Claude, and Gemini."** |
| Primary CTA | "Try with your prompt" | Keep — it's good. Consider "Try it free, no signup" if the demo truly needs no account. |
| OG title | "Deepclario - AI that actually understands what you mean" | "Deepclario - Turn a rough prompt into a great one" |

### Other copy fixes

- Footer blurb "One layer between you and ChatGPT..." → **"Deepclario rewrites your prompts before you send them, so ChatGPT, Claude, and Gemini give you better answers."**
- FAQ "One layer between you and every AI model. Same model. Better output." → **"You paste your prompt into Deepclario first. We fix it, then you use it in ChatGPT, Claude, or Gemini. Same AI, much better answers."**
- Testimonials heading (if section survives with real quotes): keep "The first time it asks you a clarifying question, you stop blaming the model." — it's genuinely good.
- "Five-dimension clarity scoring" (pricing feature list) → **"Clarity score for every prompt"**.
- "Deep Rewrite: multi-pass rewrites on our strongest model" → **"Deep Rewrite: drafts, critiques, and refines your prompt for the hardest tasks"**.
- Reduce the "ChatGPT, Claude, and Gemini" triad to ~3 appearances on the landing page (hero, extension section, footer); use "your AI" or "the model" elsewhere.
- Use-case hooks: keep them (they're distinctive), but soften the two most try-hard ones ("No 'I am writing to apply' energy", "generic value-prop soup") if aiming for intermediate-English readability.
- Keep the pricing section framing "Free until you outgrow it." / "The free plan is the product, not a trial." — this is the best copy on the site; don't touch it.

### Landing page section order (recommended)

1. Hero with live demo (exists)
2. **NEW: 3-step "How it works"** — the copy already exists as the playground idle state ("We read your prompt / we ask one question / you get a rewrite"); surface the same three steps on the landing page. Some of this exists commented-out in `page.tsx`; resurrect the simple version.
3. Extension section (exists, good)
4. Use cases (exists, good)
5. Trust block (new, small: privacy line + Paddle payments + founder note)
6. Real proof or honest early-days block (replaces fake testimonials)
7. Pricing (exists)
8. FAQ link + footer

---

## Part 4: Suggested onboarding flow

Keep it minimal — no tour library, no multi-screen wizard. The product has one core action; onboarding should get the user to it in <30 seconds.

**Flow for a brand-new signed-in user:**

1. **Redirect to `/playground` (not `/dashboard`)** after first signup.
2. Keep the `WelcomeMoment` splash but change the eyebrow from "Bring your worst prompt" to something that sets up the next screen, e.g. "Let's improve your first prompt."
3. **Pre-fill the playground textarea** with one example prompt (reuse the existing `?example=` deep-link mechanism from the dashboard empty state) and show a single dismissible hint above the button: *"This is a rough prompt on purpose. Hit Improve to see what happens."*
4. **Prime the clarifying question.** When the first-ever clarifying question appears, show a one-time caption: *"This is the important part. Deepclario asks when something is missing instead of guessing."* (one-time flag in localStorage, same pattern as `dc:welcomed:{userId}`).
5. **After the first successful rewrite**, the existing "value-moment nudge" area shows: *"That's the whole product. Install the extension to do this inside ChatGPT →"* — cross-sell the extension at the moment of success instead of only via the sidebar promo card.
6. All hints dismissible, never shown twice, gated behind the same `isNew` logic that already exists. Mobile: hints render inline (no floating tooltips), which the current layout already supports.

**Explicitly NOT recommended:** react-joyride-style multi-step overlays, checklists, videos. The product is one input + one button; a tour would be over-engineering. The existing empty states + lifecycle email sequence (which is already unusually good) cover the rest.

---

## Part 5: SEO opportunities

Foundation is strong (sitemap.ts, robots.ts, rich JSON-LD, canonicals, RSS, 48 posts, 25 indexable prompt pages). Remaining work:

**Fixes (in Must-have list):** /refund metadata + sitemap, legal canonicals, correct FAQPage schema numbers, hero H1 keyword alignment (the suggested H1 "Turn a rough prompt into a great one" loses keywords, which is fine — the meta title "AI Prompt Improver for ChatGPT, Claude & Gemini" already carries them; keep that split).

**Content opportunities (later):**
- Category hub pages for the prompt library (`/prompts/coding`, `/prompts/writing`...) — currently 25 prompts share one index.
- "ChatGPT prompt not working" / "why are my ChatGPT answers bad" style posts — problem-aware search intent that maps directly to the product, mostly missing from the current cluster.
- The comparison page ("Deepclario vs asking ChatGPT to improve your prompt") for branded + objection-handling search.
- Consolidate CTAs by cluster: AI-detection posts → /detector; prompting posts → /playground.
- Named author (Person schema) on posts.

**Do NOT do yet:** more blog volume for its own sake (48 posts is plenty for MVP), programmatic thin pages, backlink campaigns.

---

## Verification (when implementing)

- Run the app locally (`npm run dev`), walk the full flow as a fresh anonymous visitor and as a new signup: landing → demo → signup → playground first rewrite → limit hit → paywall. Confirm every limit number shown matches `src/lib/limits.ts`.
- Grep for the old strings after copy changes: `actually understands`, `25 prompt`, `25 analyses`, `persona memory`, `One layer` — zero matches expected outside git history.
- Validate structured data on /, /pricing, /prompts/[slug] with Google's Rich Results test after schema edits.
- Check /sitemap.xml includes /refund; check /privacy and /terms emit canonicals.
- Mobile pass: playground, paywall bottom-sheet, settings after restyle, at 375px width.
