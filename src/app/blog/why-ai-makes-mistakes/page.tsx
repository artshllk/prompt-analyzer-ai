import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Why Does AI Make Mistakes? Hallucinations Explained Simply',
  description: 'AI makes confident mistakes because it predicts words that sound right, not words it has checked. Here is why AI hallucinations happen and how to protect yourself.',
  alternates: { canonical: 'https://deepclario.com/blog/why-ai-makes-mistakes' },
  openGraph: {
    title: 'Why Does AI Make Mistakes? Hallucinations Explained Simply',
    description: 'AI makes confident mistakes because it predicts words that sound right, not words it has checked. Here is why it happens and how to protect yourself.',
    url: 'https://deepclario.com/blog/why-ai-makes-mistakes',
    type: 'article',
  },
}

const post = getBlogPost('why-ai-makes-mistakes')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why Does AI Make Mistakes? Hallucinations Explained Simply',
  description: 'A plain-English explanation of why AI models make confident mistakes, what an AI hallucination is, and how to reduce the risk.',
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
      name: 'why does ai make mistakes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI predicts words that fit the pattern of the text, not words it has checked are true. If a wrong answer fits the pattern, the model may write it with full confidence. It has no built-in fact checker and does not know when it is wrong, so mistakes come out sounding just as sure as correct answers.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is an ai hallucination?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A hallucination is when an AI confidently states something that is false or made up, such as a fake quote, a wrong date, or a book that does not exist. It happens because the model produces text that looks right rather than text it has verified.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does ai sound so confident when it is wrong?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because confidence is just a writing style to the model, not a measure of truth. It learned to write in a clear, assured tone from the text it read, and it uses that tone whether the facts are right or wrong. The smooth wording tells you nothing about whether the answer is correct.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i stop ai from giving wrong answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You cannot fully stop it, but you can reduce the risk: ask for sources, give it the facts to work from instead of relying on its memory, keep questions specific, and always check anything that matters. Treat AI output as a helpful first draft, not a final answer.',
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
    { '@type': 'ListItem', position: 3, name: 'Why AI Makes Mistakes', item: 'https://deepclario.com/blog/why-ai-makes-mistakes' },
  ],
}

export default function WhyAIMakesMistakesPage() {
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
            Why AI Makes Mistakes
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            AI can be wildly helpful and then, without warning, tell you something completely false
            with total confidence. It can invent a quote, a date, or a book that never existed. This
            is not a random glitch. It comes straight from how AI works, and once you understand it,
            you can protect yourself easily.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">It writes what sounds right, not what is true</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Here is the root of every AI mistake. An AI model builds its answer by predicting words
                that fit, one after another. It is chasing text that sounds right, not text it has
                checked. Those are two different goals, and most of the time they happen to line up.
                Sometimes they do not.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                When a wrong answer fits the pattern of the sentence just as well as the right one, the
                model may write the wrong one. It is not lying and it is not broken. It is doing
                exactly its job, predict the next fitting word, on a spot where the fitting word
                happens to be false.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What people call a hallucination</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                You will hear these confident mistakes called &ldquo;hallucinations.&rdquo; It is a
                fancy word for a simple thing: the AI states something false as if it were fact. A made
                up statistic. A quote no one ever said. A study that does not exist. A wrong step in a
                set of directions.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The tricky part is that a hallucination looks exactly like a correct answer. Same
                smooth wording, same confident tone. There is no red flashing light. That is what makes
                it risky, and why you cannot rely on how sure the AI sounds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why it sounds so sure of itself</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                People trust confident writing. We assume that if someone sounds sure, they probably
                know. With AI, that instinct works against you.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Confidence is just a style of writing to the model. It read countless clear, assured
                sentences and learned to write that way, and it uses that same steady tone no matter
                what. A wild guess and a rock-solid fact come out sounding identical. So the confidence
                in an AI answer tells you nothing at all about whether it is correct.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When mistakes are most likely</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Mistakes are not evenly spread. They cluster in a few predictable places, and knowing
                them tells you when to be extra careful.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Exact facts: names, dates, numbers, quotes, and citations. These are easy to get slightly wrong.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Recent events. If something happened after the model was trained, it may not know and may guess.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Niche or obscure topics, where it saw little text to learn from.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Anything where you push it to answer even when it does not really know.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to protect yourself</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                You cannot make AI perfect, but a few simple habits cut the risk sharply and let you
                use it with confidence.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Give it the facts', d: 'Instead of asking it to recall a fact, paste the source and ask it to work from that. It is far more reliable when it summarizes text you give it than when it digs through its memory.' },
                  { t: 'Ask for sources', d: 'Ask where a claim comes from. If it cannot point to a real source, treat the claim as unverified. Do check the source, since it can invent those too.' },
                  { t: 'Keep it specific', d: 'Vague questions invite vague, made-up answers. A clear, narrow question gives the model less room to drift.' },
                  { t: 'Check what matters', d: 'For anything important, health, money, legal, or public, verify with a trusted source. Use AI to draft and explain, not to have the final word.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The mindset that keeps you safe</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Think of AI as a bright, fast, and slightly unreliable assistant. It will get you a
                strong first draft in seconds, and it will occasionally be confidently wrong. Both
                things are true at once. Use it for speed and ideas, keep your guard up on facts, and
                you get the benefit without the trap.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Fewer mistakes start with a better prompt</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">A clear, specific prompt gives the model less room to drift. Paste yours into Deepclario for a stronger version. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-predicts-words" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI predicts words →
              </Link>
              <Link href="/blog/how-chatbots-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How chatbots work →
              </Link>
              <Link href="/blog/how-context-improves-ai-responses" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How context improves AI responses →
              </Link>
              <Link href="/blog/what-is-artificial-intelligence" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is artificial intelligence? →
              </Link>
            </div>
          </div>
          <PostFooter slug="why-ai-makes-mistakes" />
        </main>
      </div>
    </>
  )
}
