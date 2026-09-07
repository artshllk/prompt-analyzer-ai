import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('what-is-a-token-in-ai')

export const metadata: Metadata = {
  title: 'What Is a Token in AI? A Plain-English Explanation with Examples',
  description: 'A token is the small chunk of text an AI model actually reads. Not a word, not a letter. Here is what tokens are, with real examples you can check yourself.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-a-token-in-ai' },
  openGraph: {
    title: 'What Is a Token in AI? A Plain-English Explanation',
    description: 'A token is the small chunk of text an AI model actually reads. Here is what tokens are, with real examples.',
    url: 'https://deepclario.com/blog/what-is-a-token-in-ai',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Is a Token in AI? A Plain-English Explanation with Examples',
  description: 'A token is the small chunk of text an AI model reads instead of whole words. This guide explains tokens with real examples.',
  image: 'https://deepclario.com/blog/what-is-a-token-in-ai/opengraph-image',
  author: { '@type': 'Person', '@id': 'https://deepclario.com/#art', name: 'Art Shllaku', url: 'https://deepclario.com' },
  publisher: { '@id': 'https://deepclario.com/#organization' },
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
    {
      '@type': 'Question',
      name: 'how many tokens is 1000 words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For everyday English, about 1,300 to 1,400 tokens. The common rule is that 100 tokens is roughly 75 words, so tokens run a little higher than the word count. Code, numbers, and other languages use more tokens for the same amount of text.',
      },
    },
    {
      '@type': 'Question',
      name: 'do tokens work the same for code and other languages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The four-characters rule is for plain English. Code is token-heavy because of brackets and symbols, and many non-English languages, especially those without spaces or using non-Latin scripts, cost more tokens for the same meaning. The idea is the same, but the ratio changes.',
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
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The three places tokens actually show up</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Tokens are not just trivia. They are the unit behind three things you deal with every
                time you use an AI tool, even if nobody names them.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Cost', d: 'If you pay for an AI tool or its API, you pay per token, not per word. Input tokens and output tokens are usually priced separately. A wordy prompt and a long answer both cost more, because both are more tokens.' },
                  { t: 'Limits', d: 'Every model has a maximum number of tokens it can handle at once, called the context window. Your prompt, any documents you paste, the chat history, and the answer all share that budget. Go over it and something gets cut.' },
                  { t: 'Memory', d: 'In a long chat, the model can only "see" the tokens that fit in the window. Once a conversation gets long enough, the oldest tokens fall out of view, which is why a model can seem to forget how a long chat began.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Tokens outside plain English</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The four-characters rule holds for everyday English. It bends, sometimes a lot, once
                you leave that comfort zone. This matters if your work involves any of the following.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Code. Brackets, symbols, and indentation are token-heavy, so a page of code uses more tokens than a page of prose.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Other languages. Many non-English languages, especially ones that do not use spaces or use non-Latin scripts, cost noticeably more tokens for the same meaning.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Numbers and data. Long numbers, tables, and IDs break into small pieces and add up fast.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Emoji and symbols. A single emoji can be one or more tokens, and decorative symbols are not free.</li>
              </ul>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                None of this changes the idea, only the ratio. If you work heavily in code or another
                language, expect the same text to use more tokens than the English rule of thumb
                suggests.
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
                All of those come back to tokens. Once you can picture your text as a list of small
                chunks instead of a block of words, the way AI tools behave stops feeling like magic
                and starts making sense.
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
              <Link href="/blog/prompt-length-vs-response-quality" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt length vs response quality →
              </Link>
              <Link href="/blog/what-is-prompt-engineering" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is prompt engineering? →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-is-a-token-in-ai" />
        </main>
      </div>
    </>
  )
}
