---
description: Scaffold a new blog post (page + OG image + registry entry) from a topic
argument-hint: <topic or slug>
---

Scaffold a new Deepclario blog post for: **$ARGUMENTS**

Follow `.claude/workflows/add-blog-post.md` and `.claude/architecture/blog-system.md`.
Follow the voice and SEO rules in `.claude/conventions.md` exactly: simple plain
English for an average reader, no AI tells, no em-dashes mid-sentence, FAQ questions
phrased as real Google searches, roughly 1,200+ words when the topic earns it.

Steps:

1. **Derive a clean slug** from the topic (kebab-case). Check it is free:
   `src/app/blog/<slug>/` must not exist. Check `src/lib/blog-posts.ts` for any
   near-duplicate title and stop to flag it if you find one, rather than making a
   thin duplicate.

2. **Pick a strong, keyword-first title** (Title Case) and a 150-160 char meta
   description. Pick a `tag` that matches an existing cluster
   (Tokens, AI Detection, Prompting, Models, AI Basics) unless the topic needs a new one.

3. **Choose real internal links and a CTA.** Only link to posts/routes that exist —
   verify each slug/route first. CTA goes to a real route (`/detector`, `/playground`,
   `/tools/prompt-improver`).

4. **Create `src/app/blog/<slug>/page.tsx`** matching a recent post's structure
   (e.g. `how-ai-detectors-work`): `metadata`, the three JSON-LD blocks
   (Article, FAQ with 4-5 natural-question entries, Breadcrumb), the `editorial grain`
   shell + `MarketingNav current="blog"`, styled house cards (no `<img>`), a CTA card,
   and a Related-reading block.

5. **Create `src/app/blog/<slug>/opengraph-image.tsx`** using
   `renderOGImage({ eyebrow, title })`.

6. **Add the `BLOG_POSTS` entry** at the top of `src/lib/blog-posts.ts` (newest-first)
   with today's date for both `datePublished` and `dateModified`.

7. **Run `/verify-blog`** (typecheck + stray-char + dead-link scan) and fix anything
   it reports.

Do not commit unless asked. When done, tell me the slug, the title, the word count,
and which internal links and CTA you used.
