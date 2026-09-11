import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('what-is-an-llm')

export const metadata: Metadata = {
  title: 'What Is an LLM? Large Language Models Explained Simply',
  description: 'LLM stands for large language model, the technology behind ChatGPT, Claude, and Gemini. Here is what that actually means, without the jargon.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-an-llm' },
  openGraph: {
    title: 'What Is an LLM? Large Language Models Explained Simply',
    description: 'What LLM actually means, how these models are built, and why the term is everywhere right now.',
    url: 'https://deepclario.com/blog/what-is-an-llm',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Is an LLM? Large Language Models Explained Simply',
  description: 'A plain-English explanation of what a large language model is, how it is built, and why the term matters.',
  image: 'https://deepclario.com/blog/what-is-an-llm/opengraph-image',
  author: { '@type': 'Organization', '@id': 'https://deepclario.com/#organization', name: 'Deepclario', url: 'https://deepclario.com' },
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
      name: 'what does llm stand for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LLM stands for large language model. It is a type of AI trained on enormous amounts of text to predict and generate words. ChatGPT, Claude, and Gemini are all built on large language models.',
      },
    },
    {
      '@type': 'Question',
      name: 'what makes a language model large?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Two things: the amount of text it was trained on, and the size of the model itself, meaning how much internal capacity it has to learn patterns. Earlier language models were trained on far less text and had far less capacity, which is why they could not hold a real conversation the way current models can.',
      },
    },
    {
      '@type': 'Question',
      name: 'is chatgpt an llm or something different?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ChatGPT is a product built around a large language model. The LLM is the underlying technology that does the actual reading and writing. Think of the LLM as the engine and ChatGPT as the car built around it, with a chat interface, memory features, and other tools layered on top.',
      },
    },
    {
      '@type': 'Question',
      name: 'why is everyone talking about llms now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because a jump in scale, training on far more text with far more computing power, produced a jump in ability. Language models existed for years before this, but they were noticeably worse at holding a real conversation or following complex instructions. The recent generation crossed a threshold where they became genuinely useful for everyday tasks.',
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
    { '@type': 'ListItem', position: 3, name: 'What Is an LLM', item: 'https://deepclario.com/blog/what-is-an-llm' },
  ],
}

export default function WhatIsAnLLMPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">AI Models</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What Is an LLM?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            LLM shows up constantly in any article about AI, usually with no explanation, as if
            everyone already knows what it means. Most people don&apos;t, and there is no reason you
            should have to guess. Here is what the letters actually stand for and why the idea behind
            them matters.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The three words, broken down</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                LLM stands for large language model. Each word is actually doing work, so it helps to
                take them one at a time.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A <span className="text-[color:var(--color-paper)]">language model</span> is
                software built to work with human language, specifically to predict which words are
                likely to come next in a piece of text. That idea existed long before ChatGPT.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                <span className="text-[color:var(--color-paper)]">Large</span> is the part that
                changed everything. It means the model was trained on a huge amount of text, far more
                than earlier versions, and built with far more internal capacity to learn from all of
                it. Scale turned out to matter more than anyone expected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why size made such a big difference</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Older language models could do simple things: finish a sentence, suggest the next word
                as you typed. They could not hold a real conversation, follow multi-step
                instructions, or explain a complicated topic clearly. They simply had not seen enough
                to learn those skills.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Once models were trained on vastly more text with vastly more computing power behind
                them, something changed. Abilities nobody explicitly trained for, holding a coherent
                conversation, reasoning through a problem step by step, writing in a specific style,
                started showing up on their own. Researchers refer to this as an emergent ability: a
                skill that appears once a model gets large enough, without anyone building it in
                directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The engine, not the car</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Here is a distinction worth having clear in your head. ChatGPT is not itself an LLM.
                ChatGPT is a product, a chat interface with memory, settings, and other features built
                around an LLM that does the actual reading and writing underneath.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Think of the LLM as the engine and the chat app as the car built around it. The same
                basic engine can power different cars with different features. This is why you will
                hear both the model name and the product name used somewhat interchangeably, and why
                that can get confusing if nobody explains the difference.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What LLMs are actually good and not good at</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Knowing the term is one thing. Knowing what it implies about the tool in front of you
                is more useful.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Strong at language tasks: writing, summarizing, explaining, translating, and following instructions given in plain English.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Weak at knowing what is actually true. An LLM predicts likely words, not verified facts, which is why it can state something false with total confidence.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Limited to what it learned during training, plus whatever you give it directly in a conversation. It does not automatically know about things that happened after its training ended, unless it is connected to a live search feature.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Every LLM can cite a page that does not say it</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The link is real, it opens, and it still does not back the number next to it. Deepclario shows you the sentence that is actually there. Free, no account needed.</p>
            <Link href="/" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Check my links →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-predicts-words" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI predicts words →
              </Link>
              <Link href="/blog/what-are-ai-model-parameters" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What are AI model parameters? →
              </Link>
              <Link href="/blog/ai-glossary-for-beginners" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI glossary for beginners →
              </Link>
              <Link href="/how-it-works" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How we check a link →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-is-an-llm" />
        </main>
      </div>
    </>
  )
}
