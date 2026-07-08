# Conventions

House rules for working on Deepclario. CLAUDE.md links here; this is the full version.

## Writing voice (all user-facing copy)

This is the brand. Deepclario must never read as AI-written.

- Simple, professional, everyday English for an average or non-native reader.
- Short and medium sentences. Concrete words. One idea at a time.
- **No em-dashes mid-sentence.** Use commas, colons, periods, parentheses, or
  "and"/"so". (Em-dashes as list bullets or in code comments are fine.)
- No filler or AI tells: never "delve", "leverage", "unlock", "navigate the
  landscape", "in today's fast-paced world", "tapestry", "embark on",
  "seamless", "robust", "furthermore/moreover" stacks, or a closing paragraph
  that just repeats the intro.
- No openers like "Certainly!", "Of course!", "Great question!".
- No hype template words in marketing copy: "powerful", "supercharge",
  "seamlessly", "unleash".
- Say something genuinely useful. Simple is not thin. Never pad to a word count.

## SEO / blog rules

- Prioritize search intent, topical depth, internal linking, and FAQ rich results.
- Prefer a few strong, deep posts over many thin ones (thin content hurts rankings).
- Target roughly 1,200+ words when the topic earns it; let real substance set length.
- Each post: proper `<title>`, meta description, 3 JSON-LD blocks (Article, FAQ,
  Breadcrumb), styled house components (no `<img>`), a real internal-link set,
  and a CTA to a real route.
- Do not invent internal links to pages that do not exist. Check the route first.
- Bump `dateModified` in `BLOG_POSTS` on a meaningful edit (freshness signal).

## Accuracy (this space moves fast)

- Never state AI model names, specs, or prices from memory. There is no "Claude 4";
  current Claude models are Opus 4.8, Sonnet 5, Haiku 4.5, Fable 5, and lineups
  change often. Verify anything version-specific before publishing.
- Do not invent statistics. If a claim needs a source, say so.
- When simplifying something technical for a blog post, say plainly that it is a
  simplification rather than state something subtly wrong.

## Commits and git

- **Commits are under Art's name only:** `Art Shllaku <artshllaku48@gmail.com>`.
- **Never** add a `Co-Authored-By: Claude` or any AI attribution trailer.
- Branch off `main`. Do not commit directly to `main`.
- Prefer `git revert` over rewriting history.
- Commit or push only when asked. When Art says "ship it" / "commit it", commit + push.

## Code and file style

- Match the surrounding code: comment density, naming, idioms.
- The codebase uses rich file-header comments to explain *why* (see
  `lib/detector/index.ts`, `lib/engine/index.ts`). Keep that style; do not strip it.
- Use dedicated file/search tools over shell `cat`/`sed` where possible.
- Reference code as `file_path:line` so it is clickable.

## Verifying changes

- Typecheck (`npx tsc --noEmit`) is necessary but not sufficient.
- For real changes, run `npm run build` or drive the affected flow.
- For blog changes specifically, run the `/verify-blog` command (typecheck +
  stray-character scan + dead internal-link scan) before committing.

## Things to never do

- Don't recommend or add 3D hero treatments, voice input, or audio features
  (explicitly rejected; see `decisions/0004`).
- Don't pivot the visual aesthetic — it's locked (`decisions/0004`).
- Don't promise features in pricing/marketing copy that are not built.
- Don't add new paid third-party services unless asked.
- Don't reintroduce Stripe or assume Stripe billing (it's Paddle; `decisions/0001`).
- Don't make the detector output a numeric percentage (`decisions/0002`).
