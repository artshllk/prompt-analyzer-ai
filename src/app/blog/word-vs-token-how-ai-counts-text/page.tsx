import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('word-vs-token-how-ai-counts-text')

export const metadata: Metadata = {
  title: 'Word Count vs Token Count: Why AI Counts Text Differently',
  description: 'AI models count text in tokens, not words. This guide shows the difference, gives a simple words-to-tokens rule, and explains why the two rarely match.',
  alternates: { canonical: 'https://deepclario.com/blog/word-vs-token-how-ai-counts-text' },
  openGraph: {
    title: 'Word Count vs Token Count: Why AI Counts Text Differently',
    description: 'AI models count text in tokens, not words. Here is the difference and a simple rule to convert between them.',
    url: 'https://deepclario.com/blog/word-vs-token-how-ai-counts-text',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Word Count vs Token Count: Why AI Counts Text Differently',
  description: 'The difference between word count and token count, why AI models use tokens, and a simple rule to convert between the two.',
  image: 'https://deepclario.com/blog/word-vs-token-how-ai-counts-text/opengraph-image',
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
      name: 'what is the difference between words and tokens?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A word is a unit of language you already know. A token is a chunk of text an AI model reads, which can be a whole word, part of a word, or a piece of punctuation. Short common words are one token, but longer words split into several, so the two counts rarely match.',
      },
    },
    {
      '@type': 'Question',
      name: 'how many tokens is 1000 words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For everyday English, 1,000 words is roughly 1,300 to 1,400 tokens. The common rule is that 100 tokens is about 75 words, so tokens run a bit higher than the word count.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does ai use tokens instead of words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Models cannot store a slot for every possible word, so they keep a fixed set of common text pieces and build any word from those pieces. Counting in tokens lets the model handle rare words, other languages, and symbols with one consistent system.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i estimate how many tokens my text is?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Three quick ways: take your word count and add about a third, divide the character count by four, or count roughly 650 to 700 tokens per page of normal text. For anything that has to be exact, like staying under a hard limit, use a real token counter instead of a guess.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does the word and token difference matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It shows up in limits and cost. A document that looks short by word count can still be too long once counted in tokens, so part of it gets cut. And paid AI tools charge by the token, which runs higher than the word count, so a job can cost more than you expect. Planning in tokens avoids both surprises.',
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
    { '@type': 'ListItem', position: 3, name: 'Word Count vs Token Count', item: 'https://deepclario.com/blog/word-vs-token-how-ai-counts-text' },
  ],
}

export default function WordVsTokenPage() {
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
            Word Count vs Token Count
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You count text in words. An AI model counts it in tokens. Those two numbers are
            almost never the same, and the gap is why a document that looks short to you can be
            too long for the model. Here is how the two counts differ, and how to convert between
            them in your head.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Two different ways to count the same text</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A word is a unit you already understand. You can see where one word ends and the
                next begins. A token is different. It is a chunk of text the model reads as one
                piece, and that chunk does not respect the spaces between words.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A short, common word is usually one token. A longer or rarer word gets broken into
                two, three, or more tokens. Punctuation and spaces count too. So the same sentence
                has one word count and a higher token count, and the two only line up by accident.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The same sentence, counted both ways</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                Take this sentence: <span className="italic text-[color:var(--color-paper)]">&ldquo;Tokenization is surprisingly simple.&rdquo;</span>
                {' '}Four words. But here is how a model tends to break it into tokens.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Token', 'ization', ' is', ' surprising', 'ly', ' simple', '.'].map((t, i) => (
                    <span key={i} className="font-mono text-sm px-2 py-1 rounded border border-[color:var(--color-rule)] text-[color:var(--color-paper)]">
                      {t === ' is' || t === ' surprising' || t === ' simple' ? `·${t.trim()}` : t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[color:var(--color-paper-mute)]">
                  4 words, but 7 tokens. &ldquo;Tokenization&rdquo; alone splits into two pieces, and
                  &ldquo;surprisingly&rdquo; splits into two more. The leading dot marks a space that
                  travels with the word.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A simple rule to convert in your head</h2>
              <div className="p-6 rounded-xl border border-[color:var(--color-rule)]">
                <p className="text-sm text-[color:var(--color-paper)] leading-relaxed mb-3">
                  For plain English, the numbers work out close to this:
                </p>
                <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> 100 tokens ≈ 75 words</li>
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> 1,000 words ≈ 1,300 to 1,400 tokens</li>
                  <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> To go from words to tokens, add about a third</li>
                </ul>
              </div>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                So if your word processor says 1,000 words, plan for roughly 1,350 tokens. That
                small habit stops you from being surprised when a model rejects a document you
                thought was well within its limit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When the ratio shifts</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The one-third rule holds for normal English prose. It breaks down when the text is
                unusual, and knowing when helps you avoid nasty surprises.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Code, numbers, and symbols use more tokens per character than plain words.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Other languages, especially ones that do not use spaces, can cost far more tokens.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Names, technical terms, and made-up words split into many small pieces.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to estimate tokens in your head</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                You rarely need an exact count. You just need a good enough guess to know if your text
                will fit or what it might cost. Here are three quick ways, from roughest to closest.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'From words', d: 'Take your word count and add about a third. 1,000 words is roughly 1,350 tokens. This is the fastest check when your word processor already shows a word count.' },
                  { t: 'From characters', d: 'Divide the character count by four. This is handy for short text like a single prompt, where counting words is awkward.' },
                  { t: 'From pages', d: 'One page of normal text is very roughly 500 words, so about 650 to 700 tokens. Useful for guessing whether a long document will fit.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                For anything that has to be exact, like staying just under a hard limit, use a real
                token counter rather than a guess. For everyday planning, these estimates are plenty.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where the difference bites you</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The gap between words and tokens is not just a curiosity. It shows up in two ways that
                can catch you out.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The first is limits. Every model can only handle so many tokens at once. If you paste a
                document that looks fine by word count, it may still be too long once counted in
                tokens, and the model will cut part of it. Planning in tokens, not words, stops that
                surprise.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The second is cost. Paid AI tools charge by the token. Because tokens run higher than
                words, a job that feels short by word count can cost more than you expect, especially
                if it involves code or another language. Knowing the real ratio helps you budget.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the model bothers with tokens at all</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It would be simpler for us if models just counted words. But a model cannot keep a
                slot for every possible word in every language, plus every name and typo people
                invent. So it keeps a fixed set of common pieces and builds everything from those.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Tokens are the result of that trade. They let one system handle any text you throw
                at it. The cost is that the model&apos;s count of your writing will never quite match
                your own.
              </p>
            </section>
          </article>

          {/* No product CTA: the token counter does not have a live page yet.
              When it ships, add a CTA card here pointing at its route, matching
              the styled CTA used in the prompt-engineering posts. */}

          <div className="mt-14 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-a-token-in-ai" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a token in AI? A plain-English explanation →
              </Link>
              <Link href="/blog/prompt-length-vs-response-quality" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt length vs response quality →
              </Link>
              <Link href="/blog/how-to-write-better-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to write better prompts: 7 proven techniques →
              </Link>
            </div>
          </div>
          <PostFooter slug="word-vs-token-how-ai-counts-text" />
        </main>
      </div>
    </>
  )
}
