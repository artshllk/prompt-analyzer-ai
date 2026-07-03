// Single source of truth for blog post metadata. The RSS feed
// (src/app/rss.xml/route.ts), the sitemap (src/app/sitemap.ts), the blog
// index (src/app/blog/page.tsx), and each post's Article JSON-LD all read
// from this list, so adding or editing a post here updates every surface
// at once. Newest first - this is the display order on /blog.
//
// When you meaningfully edit a post, bump its dateModified: search engines
// use it for freshness signals in the Article schema and sitemap.

export type BlogPost = {
  slug: string
  title: string
  description: string
  /** ISO date the post first went live. */
  datePublished: string
  /** ISO date of the last meaningful content edit. */
  dateModified: string
  readTime: string
  tag: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'what-is-deep-rewrite',
    title: 'What is Deep Rewrite? How the Pro Rewrite Mode Works',
    description: 'Deep Rewrite makes a stronger model draft your improved prompt, critique its own draft, then refine it before you see it. Here is exactly what you get compared to the normal rewrite.',
    datePublished: '2026-07-03',
    dateModified: '2026-07-03',
    readTime: '5 min read',
    tag: 'Product',
  },
  {
    slug: 'what-is-prompt-engineering',
    title: 'What is Prompt Engineering? A Complete Guide for Beginners',
    description: 'Prompt engineering is the practice of writing structured instructions for AI models to get better, more reliable results. Learn the fundamentals and key techniques.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-28',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'how-to-write-better-prompts',
    title: 'How to Write Better AI Prompts - 7 Proven Techniques',
    description: '7 practical techniques to write better prompts for ChatGPT, Claude, and Gemini. Includes real before and after examples for each technique.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-28',
    readTime: '7 min read',
    tag: 'Techniques',
  },
  {
    slug: 'chatgpt-prompt-tips',
    title: '10 ChatGPT Prompt Tips That Actually Work',
    description: 'Most ChatGPT users get mediocre results because their prompts are too vague. These 10 practical tips will immediately improve what you get back.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-29',
    readTime: '6 min read',
    tag: 'Tips',
  },
  {
    slug: 'prompt-engineering-examples',
    title: 'Prompt Engineering Examples - Real Before and After Prompts',
    description: 'Real prompt engineering examples with before and after comparisons across writing, coding, research, and business use cases.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-29',
    readTime: '9 min read',
    tag: 'Examples',
  },
  {
    slug: 'what-is-a-good-prompt',
    title: 'What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has',
    description: 'A good AI prompt has five elements: goal clarity, context, format specification, constraints, and examples. Here is what each one means in practice.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-29',
    readTime: '5 min read',
    tag: 'Fundamentals',
  },
  {
    slug: 'best-chatgpt-prompts-for-work',
    title: 'Best ChatGPT Prompts for Work (2026)',
    description: 'Ready-to-use ChatGPT prompts for emails, meeting notes, job descriptions, performance reviews, and SWOT analysis. Copy, fill in the blanks, get results.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '7 min read',
    tag: 'Templates',
  },
  {
    slug: 'how-to-use-chatgpt-for-writing',
    title: 'How to Use ChatGPT for Writing - A Practical Guide',
    description: 'How to use ChatGPT for writing without sounding like a robot. Covers blog posts, emails, stories, and marketing copy with real examples.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'how-to-get-better-results-from-chatgpt',
    title: 'How to Get Better Results from ChatGPT - 8 Techniques',
    description: '8 techniques that fix the most common reasons people get mediocre ChatGPT output. Each one with a weak vs. strong prompt example.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '8 min read',
    tag: 'Techniques',
  },
  {
    slug: 'claude-ai-prompts',
    title: 'Claude AI Prompts - How to Write Better Prompts for Claude',
    description: 'How Claude handles prompts differently from ChatGPT, what it excels at, and ready-to-use prompt examples optimized for Claude.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'ai-prompt-best-practices',
    title: 'AI Prompt Best Practices - What Actually Works in 2026',
    description: 'Eight prompt best practices that consistently produce better output across ChatGPT, Claude, and Gemini. Not theory - actual techniques.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '7 min read',
    tag: 'Best Practices',
  },
  {
    slug: 'chatgpt-system-prompt-examples',
    title: 'ChatGPT System Prompt Examples - What They Are and How to Use Them',
    description: 'What system prompts are, how to set them in ChatGPT, and four ready-to-use system prompt examples for writing, coding, research, and strategy.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'zero-shot-vs-few-shot-prompting',
    title: 'Zero-Shot vs Few-Shot Prompting - What the Difference Means in Practice',
    description: 'Zero-shot and few-shot prompting explained clearly. What each technique is, when to use which, and real examples showing how examples change output.',
    datePublished: '2026-05-01',
    dateModified: '2026-05-25',
    readTime: '6 min read',
    tag: 'Fundamentals',
  },
]

/** Look up a post by slug; throws at build time if a page references a slug missing from the registry. */
export function getBlogPost(slug: string): BlogPost {
  const post = BLOG_POSTS.find(p => p.slug === slug)
  if (!post) throw new Error(`Blog post "${slug}" is missing from BLOG_POSTS in src/lib/blog-posts.ts`)
  return post
}
