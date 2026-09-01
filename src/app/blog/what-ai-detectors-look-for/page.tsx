import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'
import { CheckCTA } from '@/components/blog/CheckCTA'

export const metadata: Metadata = {
  title: 'What AI Detectors Look For in Writing (The Real Signals)',
  description: 'AI detectors do not read for meaning. They measure a handful of surface patterns: word predictability, sentence variety, phrasing, and formatting. Here is exactly what each one is.',
  alternates: { canonical: 'https://deepclario.com/blog/what-ai-detectors-look-for' },
  openGraph: {
    title: 'What AI Detectors Look For in Writing (The Real Signals)',
    description: 'AI detectors do not read for meaning. They measure a handful of surface patterns in the writing. Here is exactly what each one is.',
    url: 'https://deepclario.com/blog/what-ai-detectors-look-for',
    type: 'article',
  },
}

const post = getBlogPost('what-ai-detectors-look-for')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What AI Detectors Look For in Writing (The Real Signals)',
  description: 'The specific patterns AI detectors measure, including word predictability, sentence variety, phrasing, and formatting, explained without jargon.',
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
      name: 'what do ai detectors look for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They look at how predictable the writing is and how much the sentence length and rhythm vary. AI text tends to be smooth and even, so low surprise and low variety push the AI score up. Some tools also weigh common AI phrasing, uniform punctuation, and tidy formatting.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is perplexity and burstiness in ai detection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Perplexity is how surprised a model is by each word. Low perplexity means the words are easy to predict, which looks machine-made. Burstiness is how much sentence length and rhythm vary. Human writing is bursty, with long and short sentences mixed together; AI writing is smoother, so low burstiness raises the AI score.',
      },
    },
    {
      '@type': 'Question',
      name: 'do ai detectors understand the meaning of text?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. They do not judge whether the ideas are good or true. They measure surface patterns in the writing, like word predictability and sentence variety, and guess from those. A detector cannot tell a brilliant essay from a dull one.',
      },
    },
    {
      '@type': 'Question',
      name: 'what words and phrases make text look ai-written?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Transition-heavy, hedge-heavy phrasing that AI produces by default: openings like "In conclusion" and "It is important to note," balanced "on one hand, on the other hand" structures, and words like "delve," "leverage," and "furthermore." No single word proves anything, but a pile of them nudges the score up.',
      },
    },
    {
      '@type': 'Question',
      name: 'can you change writing so it does not look ai-generated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, and it is easy, which is the core weakness of detection. Adding sentence variety, using a few surprising words, and breaking up even rhythm all lower the AI score. That is also why plain, careful human writing sometimes gets flagged by mistake.',
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
    { '@type': 'ListItem', position: 3, name: 'What AI Detectors Look For', item: 'https://deepclario.com/blog/what-ai-detectors-look-for' },
  ],
}

export default function WhatAIDetectorsLookForPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">AI Detection</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 9 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What AI Detectors Look For
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            An AI detector does not read your writing the way a teacher does. It does not care if
            the ideas are good, whether the argument holds up, or if the facts are right. It scans
            for a small set of patterns on the surface of the text and turns them into a score.
            Once you know what those patterns are, the number stops feeling like magic, and you can
            see exactly where it goes wrong.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">It measures the writing, not the meaning</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the part most people get wrong, so it is worth saying plainly. A detector
                cannot tell whether an argument is smart, whether an essay is honest, or whether a
                claim is true. It has no idea what your text is about. It only sees the shape of the
                words on the page.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Think of it like a music teacher who is deaf but can read sheet music. They cannot
                hear whether the song is beautiful. But they can look at the notes and say &ldquo;this
                rhythm is very even and predictable&rdquo; or &ldquo;this one jumps around a lot.&rdquo;
                An AI detector does the same thing with sentences. It reads the pattern, not the tune.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Everything a detector reports comes from that pattern. There are four things it tends
                to measure, in rough order of how much they matter: word predictability, sentence
                variety, phrasing, and formatting. Here is each one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 1: How predictable each word is</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the big one. AI models write by choosing the most likely next word, over and
                over. So AI text is full of words that are easy to guess from the ones before them.
                A detector checks how surprising each word is. Low surprise looks like a machine.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Detectors have a technical name for this: <span className="italic text-[color:var(--color-paper)]">perplexity</span>.
                It sounds complicated, but it just means &ldquo;how surprised is the model by this
                word?&rdquo; If every word is the obvious next choice, perplexity is low, and the text
                reads as AI. If the writing keeps making unexpected choices, perplexity is high, and it
                reads as human.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)] mb-2">Easy to predict, so it reads as AI:</p>
                <p className="text-sm text-[color:var(--color-paper)] italic">&ldquo;In conclusion, it is important to consider the many benefits and drawbacks of this approach.&rdquo;</p>
                <p className="text-sm text-[color:var(--color-paper-mute)] mt-3 mb-2">Harder to predict, so it reads as human:</p>
                <p className="text-sm text-[color:var(--color-paper)] italic">&ldquo;Anyway, the whole benefits-and-drawbacks thing kind of misses the point.&rdquo;</p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Read those two out loud. In the first, you can almost finish each phrase before you
                reach it. In the second, &ldquo;kind of misses the point&rdquo; is a small swerve you
                did not see coming. That swerve is what a detector reads as human.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 2: How much the rhythm varies</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                People mix long and short sentences without thinking about it. One sentence runs on
                for a while, packing in a couple of ideas and a clause or two, and then the next is
                three words. AI text tends to keep a steadier beat, with sentences of similar length
                marching one after another. A detector measures that variety, and low variety pushes
                the score toward AI.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The technical name here is <span className="italic text-[color:var(--color-paper)]">burstiness</span>.
                Human writing is bursty. It speeds up and slows down. It has a short punchy line, then
                a long winding one. AI writing is smoother and flatter, so it has low burstiness. The
                two words to remember are perplexity and burstiness, and together they carry most of
                the weight in any score.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Low variety (reads as AI)</p>
                <p className="text-sm text-[color:var(--color-paper-mute)] italic mb-3">&ldquo;The city has many parks. The parks are popular with families. The families enjoy the open space. The space is well maintained.&rdquo;</p>
                <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">High variety (reads as human)</p>
                <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;The parks are packed on weekends. Families love them. On a good Saturday you can barely find a patch of grass, though the city keeps the place spotless somehow.&rdquo;</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 3: Word choice and phrasing</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Some detectors also weigh the words themselves. AI models lean on a recognizable set
                of transitions and hedges by default. You have probably noticed them: sentences that
                open with &ldquo;In conclusion,&rdquo; or &ldquo;It is important to note that,&rdquo;
                balanced &ldquo;on one hand, on the other hand&rdquo; structures, and words like
                &ldquo;delve,&rdquo; &ldquo;leverage,&rdquo; &ldquo;furthermore,&rdquo; and
                &ldquo;moreover.&rdquo;
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                No single word proves anything. Plenty of people write &ldquo;furthermore.&rdquo; But
                a page that stacks a dozen of these habits together starts to look machine-made,
                because that stack is exactly what a model produces when nobody tells it to sound like
                a person. This signal is softer and less reliable than the first two, so treat it as a
                nudge, not proof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 4: Punctuation and formatting</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the weakest signal, but some tools still glance at it. AI output is often very
                tidy. Even paragraph lengths. Consistent use of the same punctuation. Neat bulleted
                lists with parallel structure. Curly quotes and dashes placed the same way every time.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Human drafts are messier. A stray double space, an inconsistent list, a sentence that
                trails off with a dash. That mess reads as human. It is a small signal and easy to
                fake in either direction, so no serious tool leans on it much, but it is part of the
                picture.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How the signals become one score</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A detector does not just add these up by hand. It has looked at huge piles of writing,
                some human and some AI, and learned which mix of these patterns tends to come from a
                machine. When you paste in new text, it measures the same patterns and asks: does this
                look more like the AI pile or the human pile?
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The answer comes back as a single number, usually a percent. That percent is a
                confidence, not a fact. It is the tool saying &ldquo;based on the texture, I am this
                sure it is AI.&rdquo; It is a guess built from surface patterns, and guesses can be
                wrong.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a detector cannot see</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Knowing what a detector measures also tells you what it is blind to. It cannot see:
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Whether the writing is true, original, or any good.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Who actually typed it, or whether a person and a model worked on it together.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Whether AI text was edited by a human afterward, which usually erases the smoothness.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Intent. It cannot tell honest AI help from dishonest AI use.</li>
              </ul>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                All of those matter to a real decision, and none of them show up in the texture of the
                words. That gap is why a score should start a conversation, never end one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the signals fail, in both directions</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Once you know a detector only measures smoothness, its two failure modes make sense.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It flags real people. Plain, careful, formal human writing is smooth and even by
                nature. A student taught to write in a clean five-paragraph structure, a lawyer
                writing a contract, or a non-native English speaker using simple sentences all produce
                low-perplexity, low-burstiness text. The detector sees the texture and calls it AI,
                even though a person wrote every word. This is a false positive, and it is the most
                damaging mistake the tool can make.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                It misses real AI. The same logic works in reverse. Because the signals are about
                texture, anyone can change the texture. Adding sentence variety, swapping in a few
                surprising words, and breaking up the even rhythm all lower the score. A few minutes of
                editing is usually enough for AI text to slip past. The tool is not judging authorship.
                It is judging texture, and texture and authorship are not the same thing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The one thing to take away</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                An AI detector is a texture meter. It measures how smooth and predictable your writing
                is, gives that a score, and calls it a guess about authorship. That is genuinely useful
                as a first filter or a prompt to look closer. It is not proof, and it was never built
                to be. Read the score for what it is, and you will use it well.
              </p>
            </section>
          </article>

          <CheckCTA variant="detector" />

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See these signals on real text</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any text into the Deepclario detector and see how predictable and even it is. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
              <Link href="/blog/human-text-vs-ai-text" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Human text vs AI text: what actually differs →
              </Link>
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                False positives: why human writing gets flagged →
              </Link>
              <Link href="/blog/ai-detection-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection score explained →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-ai-detectors-look-for" />
        </main>
      </div>
    </>
  )
}
