# Workflow: add a blog post

The exact process, done dozens of times. The `/new-blog-post` command automates
the scaffolding; this doc is the reference and the manual fallback. Read
`.claude/architecture/blog-system.md` first if you have not.

## Before writing

1. **Check for overlap.** Grep `src/lib/blog-posts.ts` titles and `ls src/app/blog/`
   for anything close. Do not create a near-duplicate; consolidate instead.
2. **Confirm the slug is free:** `ls src/app/blog/<slug>` should not exist.
3. **Pick the internal links and CTA** you will use, and confirm those routes/slugs
   exist. Never link to a page that does not exist.

## Create the files

For slug `<slug>`:

1. `src/app/blog/<slug>/page.tsx` — copy the structure of a recent post
   (e.g. `how-ai-detectors-work`). It must have:
   - `metadata` (title, description, canonical, openGraph)
   - `articleSchema`, `faqSchema` (natural spoken questions), `breadcrumbSchema`
   - the `editorial grain` shell + `MarketingNav current="blog"`
   - styled house cards for visuals (no `<img>`)
   - a CTA card to a real route
   - a "Related reading" block (3 to 4 real internal links)
2. `src/app/blog/<slug>/opengraph-image.tsx` — use `renderOGImage({ eyebrow, title })`.
3. Add a `BLOG_POSTS` entry in `src/lib/blog-posts.ts` (newest-first at the top):
   `slug`, `title`, `description`, `datePublished`, `dateModified` (today), `readTime`, `tag`.

## Voice and SEO

Follow `.claude/conventions.md`: simple plain English, no AI tells, no em-dashes
mid-sentence, FAQ questions phrased as real searches, ~1,200+ words when earned.

## Verify before committing

Run `/verify-blog`, or manually:
- `npx tsc --noEmit` (must be clean for the new files)
- scan for stray non-ASCII (a Cyrillic look-alike slipped in once):
  `grep -rlP '[А-Яа-яЁё]' src/app/blog/<slug>/*.tsx`
- dead-link scan: every `href="/blog/..."` must map to a real dir.

## Commit

Branch off `main`. Commit under Art's name only, **no Co-Authored-By trailer**.
Group multi-post work into logical commits. Bump `dateModified` on edits.
