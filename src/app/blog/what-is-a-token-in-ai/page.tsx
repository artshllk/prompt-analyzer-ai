import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'What Is a Token in AI? A Plain-English Explanation with Examples',
  description: 'A token is the small chunk of text an AI model actually reads. Not a word, not a letter. Here is what tokens are, with real examples you can check yourself.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-a-token-in-ai' },
  openGraph: {
    title: 'What Is a Token in AI? A Plain-English Explanation',
    description: 'A token is the small chunk of text an AI model actually reads. Here is what tokens are, with real examples.',
    url: 'https://deepclario.com/blog/what-is-a-token-in-ai',
    type: 'article',
  },
}

const post = getBlogPost('what-is-a-token-in-ai')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Is a Token in AI? A Plain-English Explanation with Examples',
  description: 'A token is the small chunk of text an AI model reads instead of whole words. This guide explains tokens with real examples.',
  author: { '@type': 'Organization', name: 'Deepclario' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a token in AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A token is a small chunk of text that an AI model reads as one unit. A token can be a whole word, part of a word, a single character, or a punctuation mark. Models break your text into tokens before they process it.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is a token the same as a word?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A short common word is often one token, but longer or rarer words get split into several tokens. As a rough guide, one token is about four characters of English, and 100 tokens is about 75 words.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do tokens matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tokens are how AI models measure length. Price, context limits, and speed are all counted in tokens, not words. So knowing roughly how many tokens your text uses helps you control cost and stay within a model’s limit.',
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
    { '@type': 'ListItem', position: 3, name: 'What Is a Token in AI', item: 'https://deepclario.com/blog/what-is-a-token-in-ai' },
  ],
}

export default function WhatIsATokenInAIPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="editorial grain min-h-screen">
        <MarketingNav current="blog" />

        <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-36 pb-16">
          <div className="mb-6">
            <Link href="/" className="text-xs text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper-mute)] transition-colors">← Back to Deepclario</Link>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Tokens</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What Is a Token in AI?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            A token is the small chunk of text an AI model actually reads. It is not a word,
            and it is not a letter. It sits somewhere in between. Once you can see how your text
            gets chopped up, a lot of confusing AI behavior starts to make sense.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The short version</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Before an AI model can read your text, it breaks the text into pieces. Each piece
                is a token. A token can be a whole word, part of a word, a single character, or a
                bit of punctuation. The model never sees your sentence the way you do. It sees a
                list of tokens.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This matters because everything about an AI model is measured in tokens. How much
                you pay, how much text fits in one request, and how fast you get an answer are all
                counted in tokens, not words.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A word is not a token</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                Common short words are usually one token. Longer or unusual words get split into
                several. Here is how a few real examples break down.
              </p>
              <div className="space-y-3">
                {[
                  { word: '"cat"', count: '1 token', note: 'Short, common. Stays whole.' },
                  { word: '"running"', count: '1–2 tokens', note: 'Often split into "run" and "ning".' },
                  { word: '"unbelievable"', count: '3 tokens', note: 'Roughly "un", "believ", "able".' },
                  { word: '"Deepclario"', count: '3–4 tokens', note: 'A made-up word, so it gets chopped into small pieces.' },
                  { word: '"🙂"', count: '1–2 tokens', note: 'Emoji and symbols cost tokens too.' },
                ].map(item => (
                  <div key={item.word} className="flex items-baseline justify-between gap-4 p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <span className="font-mono text-sm text-[color:var(--color-paper)]">{item.word}</span>
                    <span className="text-sm text-[color:var(--color-paper)] font-semibold whitespace-nowrap">{item.count}</span>
                    <span className="text-xs text-[color:var(--color-paper-mute)] flex-1 text-right">{item.note}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                The exact split depends on the model, so treat these as close estimates, not fixed rules.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why models split words at all</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                English has hundreds of thousands of words, and people invent new ones every day.
                A model cannot keep a slot for every possible word. So instead it keeps a fixed set
                of common pieces, and builds any word out of those pieces.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Think of it like building words out of a fixed box of Lego. Common words have a
                single ready-made brick. Rare words get assembled from smaller bricks. This is why
                a normal word like "the" is cheap, and a strange technical term costs more tokens.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A rule of thumb you can actually use</h2>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)] leading-relaxed mb-3">
                  For everyday English, one token is about <span className="font-semibold">four characters</span>.
                  That works out to roughly:
                </p>
                <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> 100 tokens ≈ 75 words</li>
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> 1,000 tokens ≈ 750 words, about a page and a half</li>
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> A short email ≈ 100 to 200 tokens</li>
                </ul>
              </div>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Code, other languages, and lots of numbers or symbols change the ratio. But for
                plain English writing, the four-characters rule gets you close enough to plan with.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why any of this is worth knowing</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                You do not need to count tokens by hand to use AI well. But knowing tokens exist
                explains a lot of things that otherwise feel random. Why a long document gets cut
                off. Why one request costs more than another. Why the model sometimes forgets the
                start of a long chat.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                All of those come back to tokens. The next few guides go deeper on each one.
              </p>
            </section>
          </article>

          {/* No product CTA: the token counter does not have a live page yet.
              When it ships, add a CTA card here pointing at its route, matching
              the styled CTA used in the prompt-engineering posts. */}

          <div className="mt-14 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/word-vs-token-how-ai-counts-text" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Word vs token: how AI models count your text →
              </Link>
              <Link href="/blog/why-token-limits-exist" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why token limits exist and what happens when you hit them →
              </Link>
              <Link href="/blog/how-token-count-affects-ai-costs" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How token count affects your ChatGPT and Claude costs →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
