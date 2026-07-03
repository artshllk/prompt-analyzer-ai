import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'What is Deep Rewrite? How the Pro Rewrite Mode Works',
  description: 'Deep Rewrite is the Pro rewrite mode in Deepclario: a stronger model that drafts your improved prompt, critiques its own draft, then refines it before you see it. Here is exactly what you get compared to the normal rewrite.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-deep-rewrite' },
  openGraph: {
    title: 'What is Deep Rewrite? How the Pro Rewrite Mode Works',
    description: 'A stronger model drafts your improved prompt, critiques its own draft, then refines it. Here is what Deep Rewrite does differently.',
    url: 'https://deepclario.com/blog/what-is-deep-rewrite',
  },
}

const post = getBlogPost('what-is-deep-rewrite')

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What is Deep Rewrite? How the Pro Rewrite Mode Works',
  description: 'Deep Rewrite runs your prompt through a stronger model with a three-pass process: draft, critique, refine.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://deepclario.com/blog/what-is-deep-rewrite' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Deep Rewrite in Deepclario?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Deep Rewrite is the Pro rewrite mode. Instead of returning the first draft, a stronger model writes your improved prompt, critiques its own draft like a strict reviewer, then rewrites it fixing every weakness it found. You only see the refined version.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is Deep Rewrite different from the normal rewrite?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The normal rewrite is a fast single pass on a smaller model: it fixes the obvious problems like a missing role or unclear structure. Deep Rewrite uses a stronger model and three passes (draft, critique, refine), so it also catches non-obvious problems: contradictory constraints, missing acceptance criteria, vague wording, and unstated assumptions. Deep rewrites can also run longer when the task needs it.',
      },
    },
    {
      '@type': 'Question',
      name: 'When should I use Deep Rewrite?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use Deep Rewrite for prompts where the output matters: specs, briefs, code-generation prompts, important emails, or anything you will reuse. For quick one-off questions, the normal rewrite is usually enough.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
    { '@type': 'ListItem', position: 3, name: 'What is Deep Rewrite', item: 'https://deepclario.com/blog/what-is-deep-rewrite' },
  ],
}

const PASSES = [
  {
    n: 1,
    title: 'Draft',
    body: 'The model writes the full improved prompt the way the normal rewrite would: a clear role, one unambiguous task, format, constraints, and the context you gave it.',
  },
  {
    n: 2,
    title: 'Critique',
    body: 'Then it attacks its own draft the way a strict senior reviewer would. Where is it still generic? Which element is weakest? What would ChatGPT most likely get wrong when given this prompt? Is any sentence filler?',
  },
  {
    n: 3,
    title: 'Refine',
    body: 'Finally it rewrites the draft resolving every critique: a sharper role, tighter constraints, and a concrete example or acceptance criterion when the task benefits from one. Only this refined version is returned to you.',
  },
]

const COMPARISON = [
  {
    label: 'Model',
    normal: 'Fast, lightweight model',
    deep: 'Stronger model that reasons more carefully and follows instructions better',
  },
  {
    label: 'Process',
    normal: 'One pass: the first draft is the answer',
    deep: 'Three passes: draft, critique, refine. You only see the refined version',
  },
  {
    label: 'What it catches',
    normal: 'The obvious: missing role, unclear goal, no structure',
    deep: 'The non-obvious: contradictory constraints, missing acceptance criteria, vague nouns, unstated assumptions',
  },
  {
    label: 'Rewrite length',
    normal: 'Typically 80 to 250 words',
    deep: 'Up to about 350 words when the task genuinely needs the detail',
  },
  {
    label: 'Speed',
    normal: 'Fastest',
    deep: 'A little slower: the extra passes are the point',
  },
  {
    label: 'Availability',
    normal: 'Free and Pro',
    deep: 'Pro only',
  },
]

export default function WhatIsDeepRewritePage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Nav */}
      <MarketingNav current="blog" />

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <Link href="/blog/what-is-a-good-prompt" className="text-xs text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
            ← What makes a good AI prompt?
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4 leading-tight">
            What is Deep Rewrite? How the Pro Rewrite Mode Works
          </h1>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-3">
            Every rewrite in Deepclario makes your prompt better. Deep Rewrite makes it better
            <em> twice</em>: a stronger model writes the improved prompt, tears its own draft apart,
            and rewrites it before you ever see it.
          </p>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            This guide explains exactly what happens in each mode, what you get for the upgrade,
            and when each one is the right choice.
          </p>
        </div>

        {/* The short version */}
        <div className="rounded-2xl border border-[color:var(--color-rule)] p-5 mb-12">
          <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider mb-3">The short version</p>
          <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">
            The normal rewrite gives you the model&apos;s first draft. Deep Rewrite makes a stronger
            model write it, critique it, and rewrite it. First drafts fix the obvious. The critique
            pass catches what first drafts miss.
          </p>
        </div>

        {/* Three passes */}
        <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-6">The three passes</h2>
        <div className="space-y-10 mb-14">
          {PASSES.map(p => (
            <div key={p.n}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[color:var(--color-paper)] flex items-center justify-center text-[color:var(--color-ink)] font-bold text-sm shrink-0">
                  {p.n}
                </span>
                <h3 className="text-lg font-bold text-[color:var(--color-paper)]">{p.title}</h3>
              </div>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-6">Normal rewrite vs Deep Rewrite</h2>
        <div className="rounded-2xl border border-[color:var(--color-rule-strong)] overflow-hidden mb-6">
          <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)]">
            <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider" />
            <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider">Normal</p>
            <p className="text-xs font-semibold text-[color:var(--color-paper)] uppercase tracking-wider">Deep Rewrite</p>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 gap-3 px-4 py-4 ${i < COMPARISON.length - 1 ? 'border-b border-[color:var(--color-rule)]' : ''}`}
            >
              <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider">{row.label}</p>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{row.normal}</p>
              <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">{row.deep}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed border-l-2 border-[color:var(--color-rule-strong)] pl-4 mb-14">
          Everything else stays the same in both modes: the five-dimension clarity score, the single
          clarifying question when something critical is missing, and the before/after score so you
          can see what changed.
        </p>

        {/* Example of what the critique pass catches */}
        <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-4">What the critique pass actually catches</h2>
        <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
          Take a prompt like this:
        </p>
        <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-red-500/5 p-4 mb-4">
          <p className="text-sm text-[color:var(--color-paper-mute)] italic">
            &ldquo;Write an email to my team about the new process changes. Some people won&apos;t like
            it. Make it sound good but also firm.&rdquo;
          </p>
        </div>
        <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mb-3">
          A first-draft rewrite fixes the surface: it adds a role, asks for a subject line, structures
          the email. But &ldquo;sound good but also firm&rdquo; is a contradiction the first draft
          usually just echoes back.
        </p>
        <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mb-14">
          The critique pass flags it. The refined prompt resolves it into something the AI can
          actually execute: &ldquo;empathetic in the opening, unambiguous about the decision being
          final, with one concrete channel for feedback.&rdquo; That resolution is the difference
          between an email you send and an email you rewrite yourself.
        </p>

        {/* When to use which */}
        <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-4">When to use which</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-14">
          <div className="rounded-xl border border-[color:var(--color-rule-strong)] p-4">
            <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider mb-2">Normal rewrite</p>
            <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">
              Quick one-off questions, brainstorming, everyday prompts where a solid improvement
              fast is worth more than a perfect one.
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-emerald-500/5 p-4">
            <p className="text-xs font-semibold text-[color:var(--color-paper)] uppercase tracking-wider mb-2">Deep Rewrite</p>
            <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">
              Prompts where the output matters: specs, briefs, code-generation prompts, important
              emails, and any prompt you plan to reuse.
            </p>
          </div>
        </div>

        {/* How to use it */}
        <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-4">How to turn it on</h2>
        <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mb-14">
          In the <Link href="/playground" className="text-[color:var(--color-paper)] underline underline-offset-4 hover:opacity-70 transition-opacity">playground</Link>,
          click the &ldquo;Deep Rewrite&rdquo; toggle next to the tone picker before you hit Improve.
          It stays on through any clarifying question. Deep Rewrite is part of the{' '}
          <Link href="/pricing" className="text-[color:var(--color-paper)] underline underline-offset-4 hover:opacity-70 transition-opacity">Pro plan</Link>,
          alongside unlimited rewrites, full history, and the weekly insights report.
        </p>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-[color:var(--color-rule)] space-y-4">
          <h2 className="text-lg font-bold text-[color:var(--color-paper)]">Try it on your own prompt</h2>
          <p className="text-sm text-[color:var(--color-paper-mute)]">
            Run the same prompt through the normal rewrite first, then with Deep Rewrite on, and
            compare the two side by side. The difference is easiest to see on a prompt you actually
            care about.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="inline-block px-5 py-2.5 rounded-xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] text-sm font-semibold transition-all"
            >
              Open the playground →
            </Link>
            <Link
              href="/pricing"
              className="inline-block px-5 py-2.5 rounded-xl border border-[color:var(--color-rule-strong)] text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper)] hover:border-[#4a5a80] text-sm font-medium transition-all"
            >
              See Pro pricing →
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Keep reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/what-is-a-good-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">What makes a good AI prompt? →</Link>
            <Link href="/blog/how-to-write-better-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">How to write better AI prompts →</Link>
            <Link href="/blog/prompt-engineering-examples" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Real before and after prompt examples →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
