import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'What Is a Context Window? Why AI Forgets Things',
  description: 'AI can only "see" so much text at once. Here is what a context window is, why long chats trail off, and how to work with the limit instead of against it.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-a-context-window' },
  openGraph: {
    title: 'What Is a Context Window? Why AI Forgets Things',
    description: 'What a context window is, why AI seems to forget things in a long chat, and how to work around it.',
    url: 'https://deepclario.com/blog/what-is-a-context-window',
    type: 'article',
  },
}

const post = getBlogPost('what-is-a-context-window')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Is a Context Window? Why AI Forgets Things',
  description: 'An explanation of the AI context window, why long conversations cause a model to lose earlier details, and how to work around the limit.',
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
      name: 'what is a context window in ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A context window is the amount of text an AI model can look at in one go, measured in tokens. It includes your prompt, any documents you paste in, the earlier messages in the conversation, and the answer it writes back. Once the total goes past the limit, the oldest text stops being visible to the model.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does chatgpt forget things i said earlier?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because the conversation has grown past the context window. Older messages get pushed out to make room for newer ones, the same way an overflowing desk pushes old papers off the edge. The model is not confused, it genuinely no longer has that part of the conversation in front of it.',
      },
    },
    {
      '@type': 'Question',
      name: 'how big is a context window?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It varies by model and changes often as models improve, so any specific number goes out of date fast. What matters more than the exact size is knowing the limit exists: every model has one, and a long enough conversation or document will eventually reach it.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i stop ai from forgetting earlier parts of a chat?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Keep the important facts near the top of the conversation, or repeat them if the chat has gone on for a while. For anything long-running, summarizing the key points so far in one message resets what the model can see, without you having to start over completely.',
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
    { '@type': 'ListItem', position: 3, name: 'What Is a Context Window', item: 'https://deepclario.com/blog/what-is-a-context-window' },
  ],
}

export default function WhatIsAContextWindowPage() {
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
            What Is a Context Window?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You are deep into a long chat with an AI, and suddenly it seems to forget something you
            told it twenty messages ago. It is not being careless. It genuinely cannot see that part
            of the conversation anymore. The reason comes down to something called a context window,
            and once you understand it, the whole thing stops feeling like a glitch.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Think of it as a desk, not a memory</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A context window is the total amount of text an AI model can look at at one time. Not
                store forever, look at right now, in this exact reply. It includes your original
                prompt, anything you have pasted in, every message back and forth in the
                conversation, and the answer the model is about to write.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Picture a desk with a fixed amount of space. Every new page you add takes up room. The
                desk does not grow. So once it is full, adding a new page means an old one falls off
                the back. The model is not deciding what to forget. It simply cannot see anything that
                does not fit on the desk anymore.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why it feels like forgetting</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Early in a conversation, everything fits easily, so the model tracks details perfectly.
                You mention your name, your project, your preferences, and it uses all of it
                naturally. That is because the whole conversation still fits inside the window.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Keep chatting long enough, though, and the earliest messages get pushed out to make
                room for the newest ones. Ask about something you mentioned at the start, and the
                model has no way to answer correctly, because that part of the conversation is no
                longer in front of it. It is not a bug. It is the desk running out of room.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">This is also why long documents get cut off</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The same limit explains a different frustration: pasting in a long document and
                getting an answer that only seems to cover part of it. If the document, plus your
                question, plus the model&apos;s answer, add up to more than the window allows,
                something has to give.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Sometimes the tool will simply refuse the whole thing. Other times it quietly works
                with only part of what you sent, which is worse, because you may not realize anything
                was left out.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How big is the window, really?</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Every model has a different size, and the sizes keep growing as models improve. That
                is exactly why we are not going to hand you a specific number here. Whatever we said
                today would likely be out of date within a year, and different models have very
                different limits at any given time.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                What matters is the habit, not the number. Assume every model has some limit, and that
                a conversation or document long enough will eventually reach it. Check the specific
                tool you are using if the exact size matters for what you are doing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to work with the limit instead of fighting it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A few habits make this a non-issue for almost everything you do.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> If a conversation has drifted far from where it started, begin a new one rather than dragging the old context along.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> For anything long-running, summarize the key points so far in one message. This resets what matters without losing it.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Put the most important facts near the start of your prompt, not buried at the end of a long document.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> If a document is huge, consider splitting it into sections and asking about each one separately.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Write prompts that respect the window</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write clear, focused prompts that don&apos;t waste the space you have. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-a-token-in-ai" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a token in AI? →
              </Link>
              <Link href="/blog/why-does-ai-have-token-limits" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why does AI have token limits? →
              </Link>
              <Link href="/blog/how-chatbots-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How do AI chatbots work? →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-is-a-context-window" />
        </main>
      </div>
    </>
  )
}
