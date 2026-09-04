import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Why Does AI Have Token Limits? (And What to Do About It)',
  description: 'Every AI tool has a limit on how much text it can handle at once. Here is why the limit exists, what happens when you hit it, and how to work around it.',
  alternates: { canonical: 'https://deepclario.com/blog/why-does-ai-have-token-limits' },
  openGraph: {
    title: 'Why Does AI Have Token Limits? (And What to Do About It)',
    description: 'Why every AI tool has a limit on text length, what happens when you hit it, and practical ways to work around it.',
    url: 'https://deepclario.com/blog/why-does-ai-have-token-limits',
    type: 'article',
  },
}

const post = getBlogPost('why-does-ai-have-token-limits')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why Does AI Have Token Limits? (And What to Do About It)',
  description: 'Why AI models have a limit on how much text they can process, what happens at the limit, and how to work with it.',
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
      name: 'why does ai have a token limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Processing text takes computing power, and the cost grows fast as the amount of text grows. A limit keeps responses fast and keeps the cost of running the model reasonable. It is a practical tradeoff, not an arbitrary restriction.',
      },
    },
    {
      '@type': 'Question',
      name: 'what happens if i go over the token limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It depends on the tool. Some will reject the request outright and ask you to shorten it. Others will quietly drop the oldest part of the conversation or cut off the earliest part of a long document, which can be more confusing because nothing tells you what was left out.',
      },
    },
    {
      '@type': 'Question',
      name: 'is the input limit the same as the output limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not always. Some tools cap how much you can send in and separately cap how long the answer can be. A long input can leave less room for a long answer, since both usually draw from the same overall limit. Check the specific tool if you need a long response.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i work with a long document that goes over the limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Split it into sections and handle each one separately, or ask for a summary of each part first and work from the summaries. Many long-document problems are really several short-document problems that got pasted in as one.',
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
    { '@type': 'ListItem', position: 3, name: 'Why Does AI Have Token Limits', item: 'https://deepclario.com/blog/why-does-ai-have-token-limits' },
  ],
}

export default function WhyDoesAIHaveTokenLimitsPage() {
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
            Why Does AI Have Token Limits?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You paste in a long document, hit send, and get an error saying you have gone over the
            limit. It can feel like an arbitrary wall someone put up for no reason. It isn&apos;t.
            There is a real, practical reason every AI tool caps how much text it will handle, and
            once you know it, the limit is a lot easier to work around.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">More text means more work, every single time</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Reading and responding to text takes real computing power, and that cost does not
                grow slowly as the text gets longer. It grows fast. Doubling the length of what you
                send does not just double the work the model has to do, it can multiply it several
                times over.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Without a limit, one enormous request could tie up huge amounts of computing power
                and take far too long to answer. A limit keeps every response fast and keeps the tool
                affordable to run for everyone using it, not just the person who happened to paste in
                a small book.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">It is a tradeoff, not a flaw</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It helps to think of the limit as a deliberate choice rather than a shortcoming. A
                tool with no limit at all would be slower for everyone, cost more to run, and be
                harder to keep available at scale. The limit is the price of getting fast, affordable
                answers most of the time.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Different tools draw the line in different places, and the line keeps moving as
                technology improves. But some line will always exist, because the tradeoff itself
                does not go away.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What actually happens when you hit it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is not the same for every tool, and it is worth knowing which kind you are
                dealing with.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'A clear rejection', d: 'Some tools tell you plainly that your request is too long and ask you to shorten it. This is the better outcome, because you know exactly what happened.' },
                  { t: 'A silent cut', d: 'Others quietly drop the earliest part of a long conversation or document to make room. This is more frustrating, because nothing on screen tells you information was lost.' },
                  { t: 'A shortened answer', d: 'If your input used up most of the available space, the reply itself may come back shorter or cut off mid-thought, simply because there was no room left for a longer one.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Input and output usually share the same budget</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A detail that trips people up: what you send in and what the model sends back
                typically draw from the same overall limit, not two separate ones. If you paste in a
                huge amount of text, you leave less room for a long answer. If you need a detailed,
                lengthy response, going in with a shorter prompt leaves more space for it. This is
                worth remembering when a reply feels shorter than you expected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Working with the limit instead of around it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Most of the time, a limit only becomes a real problem with genuinely long material: a
                full report, a long transcript, a big batch of data. A few habits handle almost every
                case.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Split a long document into sections and work through them one at a time.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Ask for a summary of each section first, then work from the summaries instead of the full text.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Trim anything in your prompt that is not doing real work, so more of your budget goes to what matters.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> If you need a long answer, keep your own prompt short so there is room left for it.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Make every token count</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario helps you write tighter prompts that leave more room for the answer. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-a-context-window" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a context window? →
              </Link>
              <Link href="/blog/what-is-a-token-in-ai" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is a token in AI? →
              </Link>
              <Link href="/blog/how-to-reduce-ai-token-costs" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to reduce AI token costs →
              </Link>
            </div>
          </div>
          <PostFooter slug="why-does-ai-have-token-limits" />
        </main>
      </div>
    </>
  )
}
