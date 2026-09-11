import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('how-chatbots-work')

export const metadata: Metadata = {
  title: 'How Do AI Chatbots Work? A Simple Explanation',
  description: 'AI chatbots like ChatGPT read your message, break it into small pieces, and predict a reply one word at a time. Here is the whole process in plain English.',
  alternates: { canonical: 'https://deepclario.com/blog/how-chatbots-work' },
  openGraph: {
    title: 'How Do AI Chatbots Work? A Simple Explanation',
    description: 'AI chatbots read your message and predict a reply one word at a time. Here is the whole process in plain English.',
    url: 'https://deepclario.com/blog/how-chatbots-work',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How Do AI Chatbots Work? A Simple Explanation',
  description: 'A plain-English walkthrough of how AI chatbots read a message, predict a reply, and remember a conversation.',
  image: 'https://deepclario.com/blog/how-chatbots-work/opengraph-image',
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
      name: 'how do ai chatbots work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A chatbot reads your message, breaks it into small chunks called tokens, and predicts a reply one word at a time based on patterns it learned from huge amounts of text. It keeps predicting words until the answer is complete, then sends it back to you.',
      },
    },
    {
      '@type': 'Question',
      name: 'do chatbots remember previous messages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Within one conversation, yes, up to a point. The chatbot re-reads the recent chat each time it replies, so it can follow along. But it can only hold so much at once, so in a very long chat the oldest messages drop out of view and it may seem to forget how the conversation began.',
      },
    },
    {
      '@type': 'Question',
      name: 'is a chatbot the same as a search engine?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A search engine finds existing pages and links you to them. A chatbot writes a fresh answer by predicting words, and unless it is connected to live search, it is not looking anything up. That is why a chatbot can sound sure while being wrong, and why you should check facts that matter.',
      },
    },
    {
      '@type': 'Question',
      name: 'why do chatbots sometimes give wrong answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because they predict words that fit, not words they have verified. If a wrong answer fits the pattern of the text, the chatbot may produce it confidently. It has no built-in fact checker, so treat its answers as a helpful draft to check.',
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
    { '@type': 'ListItem', position: 3, name: 'How Chatbots Work', item: 'https://deepclario.com/blog/how-chatbots-work' },
  ],
}

export default function HowChatbotsWorkPage() {
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
            How Chatbots Work
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You type a message and a helpful reply comes back in seconds. It feels like talking to
            someone. Behind the scenes, though, a chatbot is running a clear, step-by-step process.
            Here is what happens between your message and its answer, in plain English.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Step 1: It reads your message in small pieces</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The first thing a chatbot does is chop your message into small chunks called tokens. A
                token is usually a short word or part of a word. &ldquo;Cat&rdquo; is one token.
                &ldquo;Unbelievable&rdquo; might be three. The chatbot does not read whole sentences
                the way you do; it reads this list of chunks.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This step matters more than it sounds, because everything the chatbot does, including
                how much it can handle and what it costs to run, is measured in tokens. But for now,
                just picture your message being turned into a tidy list of small pieces.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Step 2: It predicts a reply, one word at a time</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Now the main event. The chatbot looks at your message and starts building a reply by
                guessing the next word, then the next, then the next. Each guess is based on the
                patterns it learned from reading an enormous amount of text before you ever showed up.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It is a bit like a very advanced version of the autocomplete on your phone. Your phone
                suggests the next word; a chatbot does the same thing, but far better, and it keeps
                going until it has written a full answer.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)]">
                  You ask: &ldquo;What is the capital of France?&rdquo; The chatbot starts its reply and
                  predicts, word by word: &ldquo;The&rdquo; → &ldquo;capital&rdquo; → &ldquo;of&rdquo; →
                  &ldquo;France&rdquo; → &ldquo;is&rdquo; → &ldquo;Paris.&rdquo; Each word is chosen
                  because it fits what came before.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Step 3: It stops and sends the answer</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The chatbot keeps predicting words until the answer feels complete, then stops and
                sends it to you. If you are watching the reply appear word by word on the screen, you
                are literally watching it predict, one piece at a time. That streaming effect is not
                for show. It is the process, made visible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How it seems to remember the conversation</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Chatbots feel like they remember what you said earlier, and within a single chat they
                mostly do. The trick is simple: each time you send a new message, the chatbot re-reads
                the recent conversation before it replies. So it always has the context fresh in front
                of it.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                But there is a limit to how much it can read at once. In a very long conversation, the
                oldest messages eventually fall out of view. That is why a chatbot can seem to forget
                something you said way at the start of a long chat. It is not being forgetful on
                purpose; the early part simply no longer fits in what it can see.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why it is not a search engine</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the most useful thing to understand. A search engine finds real pages that
                already exist and links you to them. A chatbot does something different. Unless it is
                specifically connected to live search, it is not looking anything up. It is writing a
                fresh answer by predicting words.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This explains the chatbot&apos;s biggest weakness. It predicts words that sound right,
                not words it has checked. So it can hand you a confident, well-written answer that is
                simply wrong. There is no built-in fact checker. That is not a reason to avoid
                chatbots, just a reason to treat their answers as a helpful draft, and to verify
                anything that matters.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The one habit that gets better answers</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Since a chatbot builds its reply off the words you give it, the quality of your message
                shapes the quality of its answer. A vague message gives it little to work with. A
                clear message that says what you want, who it is for, and how long it should be points
                it toward a much better reply. This is why learning to write good prompts is the
                single fastest way to get more out of any chatbot.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">The reply sounds sure. Check it anyway.</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">A chatbot can hand you a real link next to a number that page never mentions. Deepclario opens each one and shows you the sentence that is there. Free, no account needed.</p>
            <Link href="/" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Check my sources →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-predicts-words" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI predicts words →
              </Link>
              <Link href="/blog/what-is-a-token-in-ai" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a token in AI? →
              </Link>
              <Link href="/blog/why-ai-makes-mistakes" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why AI makes mistakes →
              </Link>
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
            </div>
          </div>
          <PostFooter slug="how-chatbots-work" />
        </main>
      </div>
    </>
  )
}
