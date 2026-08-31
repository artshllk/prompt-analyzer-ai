import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'What Is Artificial Intelligence? A Simple Guide for Beginners',
  description: 'Artificial intelligence is software that learns patterns and makes guesses instead of following fixed rules. Here is what AI really is, in plain English, with everyday examples.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-artificial-intelligence' },
  openGraph: {
    title: 'What Is Artificial Intelligence? A Simple Guide for Beginners',
    description: 'Artificial intelligence is software that learns patterns instead of following fixed rules. Here is what AI really is, in plain English.',
    url: 'https://deepclario.com/blog/what-is-artificial-intelligence',
    type: 'article',
  },
}

const post = getBlogPost('what-is-artificial-intelligence')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Is Artificial Intelligence? A Simple Guide for Beginners',
  description: 'A plain-English explanation of what artificial intelligence is, how it differs from normal software, and the main types of AI in everyday use.',
  author: { '@type': 'Person', name: 'Art Shllaku', url: 'https://deepclario.com' },
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
      name: 'what is artificial intelligence in simple words?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Artificial intelligence is software that learns from examples and makes its own guesses, instead of following fixed rules a person wrote by hand. It spots patterns in data and uses them to answer questions, make predictions, or create things like text and images.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is the difference between ai and normal software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Normal software follows exact rules a programmer wrote: if this, do that. AI is not told the rules. It is shown many examples and works out the patterns itself, so it can handle messy tasks like understanding language or recognizing images that would be almost impossible to write rules for.',
      },
    },
    {
      '@type': 'Question',
      name: 'is chatgpt artificial intelligence?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. ChatGPT, Claude, and Gemini are a type of AI called a large language model. They learned patterns from huge amounts of text and use those patterns to predict and generate written answers. They are one branch of AI, focused on language.',
      },
    },
    {
      '@type': 'Question',
      name: 'is artificial intelligence dangerous?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Today’s AI is a powerful tool, not a thinking being with its own goals. The real, everyday risks are practical ones: it can be confidently wrong, it can repeat biases from its training data, and it can be misused. Treating its output as a helpful draft to check, not as final truth, handles most of the risk.',
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
    { '@type': 'ListItem', position: 3, name: 'What Is Artificial Intelligence', item: 'https://deepclario.com/blog/what-is-artificial-intelligence' },
  ],
}

export default function WhatIsAIPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">AI Basics</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 8 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What Is Artificial Intelligence?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You hear &ldquo;AI&rdquo; everywhere, but the word covers a lot of ground and rarely gets
            a plain explanation. Here it is, without the jargon. Artificial intelligence is software
            that learns from examples and makes its own guesses, instead of following fixed rules
            someone typed out by hand. That one idea is the key to the whole thing.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The core idea: learning, not rules</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                To see what makes AI different, picture normal software first. A normal program follows
                exact rules a person wrote. A calculator adds two numbers because someone wrote the
                rule for adding. It never does anything it was not told to do.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Now think about a task like telling a cat from a dog in a photo. Nobody can write a
                clean list of rules for that. What counts as a cat? The ears? The whiskers? There are
                too many exceptions. This is where AI comes in.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Instead of being given rules, an AI system is shown thousands of example photos, each
                labeled cat or dog. It studies them and works out the patterns on its own. After
                enough examples, it can look at a brand new photo and make a good guess. Nobody wrote
                the rules. The system learned them from the examples.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A simple way to picture it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Think about how a child learns what a dog is. You do not hand them a rulebook. You
                point at dogs and say &ldquo;dog&rdquo; again and again. Big ones, small ones, fluffy
                ones. After a while, the child can spot a dog they have never seen before, even a
                breed you never showed them.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                AI learns in a roughly similar way: lots of examples, then the ability to handle new
                cases. It is not as flexible or as smart as a child in most ways, and it does not
                understand the world the way a person does. But the &ldquo;learn from examples&rdquo;
                part is a fair picture of what is going on.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The main types you will hear about</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                &ldquo;AI&rdquo; is a big umbrella. A few words sit under it that people often mix up.
                Here they are in plain terms.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Machine learning', d: 'The main method behind most modern AI. It is the general idea of software learning patterns from data instead of being given rules. Almost all the AI you use is machine learning.' },
                  { t: 'Deep learning', d: 'A more powerful kind of machine learning, loosely inspired by how brain cells connect. It is what made recent leaps possible, like understanding language and images well.' },
                  { t: 'Large language models', d: 'AI built for text. ChatGPT, Claude, and Gemini are examples. They learned patterns from huge amounts of writing and use them to predict and produce words.' },
                  { t: 'Generative AI', d: 'Any AI that creates new things, such as text, images, or music, rather than just sorting or labeling. Chatbots and image generators are generative AI.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                A quick way to hold it together: machine learning is the method, deep learning is a
                strong version of that method, and large language models are what you get when you
                point deep learning at text.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where you already meet AI</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                AI is not only chatbots. You have been using it for years, often without noticing.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The spam filter that keeps junk out of your inbox.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The suggestions on a streaming service or online shop.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The maps app that predicts traffic and picks a route.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The face recognition that unlocks your phone.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The autocomplete that finishes your sentences as you type.</li>
              </ul>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                All of these learned from examples rather than fixed rules. The chatbots that arrived
                recently are simply a newer, more visible kind of the same basic idea.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What AI still cannot do</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It is easy to overrate AI because it sounds so confident. So it helps to be clear about
                the limits. Today&apos;s AI does not truly understand the world, does not have goals or
                feelings of its own, and does not know when it is wrong.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                It is a powerful pattern-matcher, not a mind. It can write a confident answer that is
                completely false, because it is matching patterns in text, not checking facts. That is
                why the smartest way to use it is as a fast, helpful assistant whose work you still
                check, not as a source of final truth.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Put AI to work on your own writing</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write clearer prompts and check whether text looks AI-written. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the prompt improver →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/machine-learning-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Machine learning explained →
              </Link>
              <Link href="/blog/how-ai-predicts-words" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI predicts words →
              </Link>
              <Link href="/blog/how-chatbots-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How chatbots work →
              </Link>
              <Link href="/blog/ai-glossary-for-beginners" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI glossary for beginners →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-is-artificial-intelligence" />
        </main>
      </div>
    </>
  )
}
