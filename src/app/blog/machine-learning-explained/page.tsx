import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Machine Learning Explained: A Simple Guide for Beginners',
  description: 'Machine learning is software that learns from examples instead of following rules. Here is what it is, how it works, and where you meet it, in plain English.',
  alternates: { canonical: 'https://deepclario.com/blog/machine-learning-explained' },
  openGraph: {
    title: 'Machine Learning Explained: A Simple Guide for Beginners',
    description: 'Machine learning is software that learns from examples instead of following rules. Here is what it is and how it works, in plain English.',
    url: 'https://deepclario.com/blog/machine-learning-explained',
    type: 'article',
  },
}

const post = getBlogPost('machine-learning-explained')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Machine Learning Explained: A Simple Guide for Beginners',
  description: 'A plain-English explanation of machine learning: learning from examples instead of rules, the main types, and where it shows up in daily life.',
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
      name: 'what is machine learning in simple terms?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Machine learning is a way of making software learn from examples instead of following rules a person wrote by hand. You show it many examples, it works out the patterns, and then it can handle new cases it has never seen. It is the main method behind most modern AI.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is the difference between ai and machine learning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI is the broad goal of making software act smart. Machine learning is the main method used to get there today. So machine learning is a part of AI. Almost all the AI you use, including chatbots, is built with machine learning.',
      },
    },
    {
      '@type': 'Question',
      name: 'how does machine learning learn?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It is shown examples and makes a guess, then checks the guess against the right answer and adjusts to do better. Repeating this across huge amounts of data, it slowly tunes itself until its guesses are good. This training step is where the learning happens.',
      },
    },
    {
      '@type': 'Question',
      name: 'do you need to be a programmer to understand machine learning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Building machine learning systems takes technical skill, but the core idea, software that learns patterns from examples instead of following fixed rules, is simple and does not require any coding to understand.',
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
    { '@type': 'ListItem', position: 3, name: 'Machine Learning Explained', item: 'https://deepclario.com/blog/machine-learning-explained' },
  ],
}

export default function MachineLearningExplainedPage() {
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
            Machine Learning Explained
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Machine learning is behind almost every AI tool you use, but the name makes it sound
            harder than it is. Stripped down, it is one clear idea: software that learns from examples
            instead of following rules. Here is what that means, how it works, and why it changed
            technology, all in plain English.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The old way vs the machine learning way</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                For most of computing history, software worked by following rules a person wrote. If a
                customer spends over $100, give free shipping. If the temperature drops below zero,
                show a warning. The programmer thinks of every rule and types it out. This works great
                when the rules are clear.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                But many useful tasks have no clean rules. How do you write a rule to tell a cat from a
                dog in a photo, or to know if an email is spam, or to understand a spoken sentence?
                People do these things easily but cannot explain the exact rules, and there are far too
                many exceptions to list.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Machine learning flips the approach. Instead of writing the rules, you give the
                computer lots of examples and let it work out the rules itself. Show it thousands of
                emails marked spam or not spam, and it learns what spam tends to look like. Nobody
                wrote those rules. The system found them in the examples.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How the learning actually happens</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The learning is a loop of guess, check, and adjust. It sounds basic, and it is. The
                power comes from doing it a huge number of times.
              </p>
              <div className="space-y-4">
                {[
                  { n: '1. Guess', d: 'The system looks at an example and makes a guess. Early on, with nothing learned yet, the guess is basically random.' },
                  { n: '2. Check', d: 'It compares its guess to the real answer in the example. Was the email actually spam or not? It measures how wrong it was.' },
                  { n: '3. Adjust', d: 'It nudges itself a tiny bit so that next time it would be a little less wrong on that kind of example.' },
                  { n: '4. Repeat', d: 'It does this across millions of examples. Each tiny adjustment adds up, and slowly the guesses get good.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                This whole process is called training. When people say a model was &ldquo;trained,&rdquo;
                this loop, run at enormous scale, is what they mean.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why examples matter so much</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Because a machine learning system learns only from its examples, the examples decide
                what it becomes. This has a big, practical consequence: the system is only as good, and
                only as fair, as the data it learned from.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Show it mostly one kind of example and it will struggle with the rest. If the examples
                carry a bias, the system quietly learns that bias too. This is not the machine being
                unfair on purpose. It is faithfully copying the patterns it was shown, good and bad.
                That is why the quality of the training data matters as much as the method.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where it fits with AI and deep learning</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                These words get tangled, so here is the simple sorting.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Artificial intelligence', d: 'The broad goal: software that acts smart. The big umbrella word.' },
                  { t: 'Machine learning', d: 'The main method used to reach that goal today: learning from examples. It sits inside AI.' },
                  { t: 'Deep learning', d: 'A powerful kind of machine learning, loosely inspired by how brain cells connect. It sits inside machine learning, and it is what made chatbots and image tools work so well.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Picture them as circles inside circles. Deep learning is part of machine learning,
                which is part of AI. When you use a chatbot, you are using all three at once.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where you already use it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Machine learning is not new or rare. It has been quietly running in the background of
                daily life for years.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Email spam filters that learned what junk looks like.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Product and video suggestions based on what you and others liked.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Banks flagging a purchase that does not fit your usual pattern.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Voice assistants turning your speech into text.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> The chatbots and writing tools that learned language from huge amounts of text.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Use AI more effectively</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write clearer prompts and check whether text looks AI-written. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the prompt improver →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-artificial-intelligence" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is artificial intelligence? →
              </Link>
              <Link href="/blog/how-ai-learns-language" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI learns language →
              </Link>
              <Link href="/blog/embeddings-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Embeddings explained →
              </Link>
              <Link href="/blog/ai-glossary-for-beginners" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI glossary for beginners →
              </Link>
            </div>
          </div>
          <PostFooter slug="machine-learning-explained" />
        </main>
      </div>
    </>
  )
}
