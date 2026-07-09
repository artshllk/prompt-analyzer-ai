import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Embeddings Explained: How AI Turns Words Into Numbers',
  description: 'Embeddings are how AI turns words into numbers so it can measure which ones are related. Here is what embeddings are, in plain English, with everyday examples.',
  alternates: { canonical: 'https://deepclario.com/blog/embeddings-explained' },
  openGraph: {
    title: 'Embeddings Explained: How AI Turns Words Into Numbers',
    description: 'Embeddings are how AI turns words into numbers so it can measure which ones are related. Here is what they are, in plain English.',
    url: 'https://deepclario.com/blog/embeddings-explained',
    type: 'article',
  },
}

const post = getBlogPost('embeddings-explained')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Embeddings Explained: How AI Turns Words Into Numbers',
  description: 'A plain-English explanation of embeddings: how AI turns words into numbers so it can measure meaning and find related things.',
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
      name: 'what is an embedding in ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An embedding is a way of turning a word or piece of text into a list of numbers that captures its meaning. Words with similar meanings get similar numbers, so the AI can measure how related two things are by how close their numbers are.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does ai turn words into numbers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because computers work with numbers, not letters. To do anything useful with language, an AI first converts words into numbers. Embeddings do this in a smart way, so that the numbers actually reflect meaning and not just spelling.',
      },
    },
    {
      '@type': 'Question',
      name: 'what are embeddings used for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They power search that understands meaning, recommendation systems, grouping similar items, and helping chatbots find relevant information. Any time software needs to know whether two pieces of text are about the same thing, embeddings are often behind it.',
      },
    },
    {
      '@type': 'Question',
      name: 'are embeddings the same as tokens?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, but they are related. A token is a small chunk of text the model reads. An embedding is the list of numbers that represents the meaning of that chunk. First the text is split into tokens, then each token is turned into an embedding.',
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
    { '@type': 'ListItem', position: 3, name: 'Embeddings Explained', item: 'https://deepclario.com/blog/embeddings-explained' },
  ],
}

export default function EmbeddingsExplainedPage() {
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
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 7 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            Embeddings Explained
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            &ldquo;Embeddings&rdquo; sounds like a word only an engineer would use. The idea behind it
            is simple, though, and it explains how AI can tell that two things mean the same even when
            the words are different. Here it is in plain English, no math required.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Computers need numbers, not words</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Start with a basic fact. Computers work with numbers. They do not really deal in
                letters or meaning. So before an AI can do anything clever with language, it has to
                turn words into numbers.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The naive way would be to just number the words: cat is 1, dog is 2, and so on. But
                that is useless, because the numbers would not mean anything. There is no real sense in
                which cat being 1 and dog being 2 tells you they are both pets. An embedding is a
                smarter way to turn words into numbers, one where the numbers actually carry meaning.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A map of meaning</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The best way to picture an embedding is as a location on a giant map. Imagine a map
                where every word has a spot, and words with similar meanings sit close together.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                On this map, &ldquo;cat,&rdquo; &ldquo;dog,&rdquo; and &ldquo;hamster&rdquo; would all
                be clustered in one neighborhood, because they are all pets. &ldquo;Car,&rdquo;
                &ldquo;truck,&rdquo; and &ldquo;bus&rdquo; would sit in a different neighborhood.
                &ldquo;Happy&rdquo; and &ldquo;joyful&rdquo; would be almost on top of each other,
                while &ldquo;happy&rdquo; and &ldquo;sad&rdquo; would be far apart.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)]">
                  An embedding is just that spot on the map, written as a list of numbers. Close
                  numbers mean close meaning. So the AI can measure how related two words are simply by
                  checking how close their spots are. It has turned &ldquo;are these two things
                  similar?&rdquo; into &ldquo;how far apart are these numbers?&rdquo;
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Meaning, not spelling</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The clever thing is that embeddings capture meaning, not just how a word is spelled.
                &ldquo;Big&rdquo; and &ldquo;large&rdquo; look nothing alike as words, but they mean
                nearly the same thing, so they sit close together on the map. &ldquo;Bank&rdquo; the
                riverbank and &ldquo;bank&rdquo; the place for money are spelled the same but mean
                different things, and a good system can place them apart based on how they are used.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This all comes from the same learning process behind other AI. By seeing which words
                show up in similar situations across huge amounts of text, the model works out which
                words belong near each other. Nobody places the words on the map by hand.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What embeddings are used for</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This one idea, meaning as a location, powers a surprising amount of the technology you
                use.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Smart search that finds results by meaning, so a search for &ldquo;cheap flights&rdquo; also matches &ldquo;affordable airfare.&rdquo;</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Recommendations that suggest items similar to what you liked.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Grouping similar documents, reviews, or support tickets automatically.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Helping a chatbot pull up the right piece of information to answer a question.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How embeddings fit with tokens</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                If you have read about tokens, here is how the two connect. First, text is broken into
                tokens, the small chunks a model reads. Then each token is turned into an embedding,
                the list of numbers that stands for its meaning. Tokens are the pieces; embeddings are
                the meaning of those pieces, written in a form a computer can work with. Together they
                are the first steps that let an AI do anything at all with your words.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See how AI reads your text</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write clearer prompts and check whether text looks AI-written. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the prompt improver →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-a-token-in-ai" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a token in AI? →
              </Link>
              <Link href="/blog/how-ai-learns-language" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI learns language →
              </Link>
              <Link href="/blog/machine-learning-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Machine learning explained →
              </Link>
              <Link href="/blog/ai-glossary-for-beginners" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI glossary for beginners →
              </Link>
            </div>
          </div>
          <PostFooter slug="embeddings-explained" />
        </main>
      </div>
    </>
  )
}
