# Blog system

The blog is a big part of the SEO strategy (37+ posts across clusters: tokens, AI
detection, prompting, AI models, AI basics). Understanding this pattern saves a lot
of time, since we add posts often.

## How it works

- **Single source of truth:** `src/lib/blog-posts.ts` exports `BLOG_POSTS[]`.
  Each entry has `slug`, `title`, `description`, `datePublished`, `dateModified`,
  `readTime`, `tag`.
- Adding or editing an entry auto-updates every surface at once:
  - the blog index (`src/app/blog/page.tsx`),
  - the sitemap (`src/app/sitemap.ts`),
  - the RSS feed (`src/app/rss.xml/route.ts`),
  - and each post's Article JSON-LD reads its dates from the registry via `getBlogPost(slug)`.
- **Posts are React pages, not markdown.** Each post is a directory under
  `src/app/blog/<slug>/` with a `page.tsx` and an `opengraph-image.tsx`.
- `getBlogPost(slug)` throws at build time if a page references a slug missing from
  `BLOG_POSTS`, so registry and pages stay in sync.

## The post pattern (what every page.tsx has)

1. `metadata` (title, description, canonical, openGraph).
2. Three JSON-LD blocks: `articleSchema`, `faqSchema`, `breadcrumbSchema`.
3. The `editorial grain` shell + `MarketingNav current="blog"`.
4. Styled house components (bordered cards) for the visual element. **No `<img>`
   tags** — the blog has no image pattern (see `decisions/0004`).
5. A CTA card to a real route (`/detector`, `/playground`, `/tools/prompt-improver`).
6. A "Related reading" block with 3 to 4 internal links to real posts.

The `opengraph-image.tsx` uses `renderOGImage({ eyebrow, title })` from
`@/lib/og-image`.

## Rules

- Voice and SEO rules live in `.claude/conventions.md`. Simple plain English,
  no AI tells, no em-dashes mid-sentence, FAQ questions phrased as natural searches.
- Do not invent internal links to posts that do not exist. Check the slug dir first.
- Bump `dateModified` on a meaningful edit.
- To add a post, follow `.claude/workflows/add-blog-post.md` or run `/new-blog-post`.
- Before committing blog work, run `/verify-blog` (typecheck + stray-char scan +
  dead-link scan).
