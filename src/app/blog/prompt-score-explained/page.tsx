import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Prompt Score Explained: What Your Prompt Rating Means',
  description: 'A prompt score rates how clear and complete your prompt is, from 0 to 100. Here is what the number measures, why it matters, and how to read each part.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-score-explained' },
  openGraph: {
    title: 'Prompt Score Explained: What Your Prompt Rating Means',
    description: 'A prompt score rates how clear and complete your prompt is, from 0 to 100. Here is what the number measures and how to read each part.',
    url: 'https://deepclario.com/blog/prompt-score-explained',
    type: 'article',
  },
}

const post = getBlogPost('prompt-score-explained')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Prompt Score Explained: What Your Prompt Rating Means',
  description: 'What a prompt score measures, the parts that make it up, and how to read the number to write clearer prompts.',
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
      name: 'what is a prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt score is a rating, usually from 0 to 100, of how clear and complete your prompt is. It does not judge your idea. It measures whether you gave the AI what it needs to answer well: a clear goal, context, a format, and limits. A higher score means less guessing for the model.',
      },
    },
    {
      '@type': 'Question',
      name: 'what does a prompt score measure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It measures the parts of a strong prompt: whether the task is clear, whether you gave context the model cannot see, whether you named a format for the answer, and whether you set any limits. Each part is checked, and together they make the score.',
      },
    },
    {
      '@type': 'Question',
      name: 'is a higher prompt score always better?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Almost always, because a higher score means your prompt leaves the model less to guess. The exception is very simple requests, where a short prompt already says everything. The score is a guide to clarity, not a rule to chase for its own sake.',
      },
    },
    {
      '@type': 'Question',
      name: 'why did my prompt get a low score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usually because it is missing something the model needs. The most common gaps are a vague goal, no context about the audience or purpose, no stated format, and no limits. A low score points you to which part to add.',
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
    { '@type': 'ListItem', position: 3, name: 'Prompt Score Explained', item: 'https://deepclario.com/blog/prompt-score-explained' },
  ],
}

export default function PromptScoreExplainedPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Prompting</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 7 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            Prompt Score Explained
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            A prompt score gives your prompt a number, usually from 0 to 100. It sounds simple, but
            people often misread what it means. It is not grading your idea or your writing talent.
            It is measuring one thing: whether you gave the AI what it needs to answer you well.
            Here is exactly what the number is telling you.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What the number actually means</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A prompt score rates how clear and complete your prompt is. Think of it as a
                readiness check, not a report card. A low score does not mean your request is silly.
                It means you left gaps the model will have to fill by guessing.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This matters because an AI builds its answer from the words you give it. A prompt with
                gaps forces the model to guess the parts you left out, and a guess is often not what
                you wanted. A high score means there is little left to guess, so the answer is far
                more likely to match what you had in mind. The score is really a measure of how much
                guessing you have removed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The parts behind the score</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The number is not one vague judgment. It is built from a few clear parts, each one a
                question about whether the model has what it needs. When you understand the parts, the
                score stops being a mystery and becomes a checklist.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Clear goal', d: 'Is it obvious what you want done? "Write something about our app" is fuzzy. "Write a 200-word intro for our app for busy small-business owners" is clear.' },
                  { t: 'Context', d: 'Did you give the background the model cannot see? Who is the reader, what is the purpose, what is the situation.' },
                  { t: 'Format', d: 'Did you say how the answer should look? A list, a table, three bullets, under 100 words, a certain tone.' },
                  { t: 'Limits', d: 'Did you say what to avoid? "No jargon", "do not oversell", "assume no technical background".' },
                  { t: 'Specifics', d: 'Did you include the concrete details that anchor the answer? Real names, numbers, or examples instead of vague terms.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                A prompt that covers all of these scores high. A prompt missing several of them scores
                low. Most prompts sit in the middle, strong on one or two parts and thin on the rest.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A low score and a high score, side by side</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                The clearest way to feel what a score measures is to see the same request written two
                ways.
              </p>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Low score</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;Write a welcome email.&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)] mt-2">No goal detail, no context, no format, no limits. The model has to guess almost everything.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">High score</p>
                  <p className="text-sm text-[color:var(--color-paper)]">&ldquo;Write a welcome email for people who just signed up for our budgeting app. They are nervous about money and new to budgeting. Keep it under 120 words, warm and plain. No finance jargon, and do not oversell.&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)] mt-2">Goal, context, format, and limits are all there. Little is left to guess.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to read your own score</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When you see a score, do not just look at the number. Look at which parts are weak,
                because that is where the useful information is. The number tells you there is room to
                improve; the breakdown tells you exactly where.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A prompt scoring in the 80s or 90s is usually ready to send. Something in the middle is
                worth one quick fix to the weakest part. A low score means the model would be guessing
                a lot, and a minute of editing will change the answer completely. You do not need a
                perfect score, you need enough that the model is not guessing about the things that
                matter to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">One thing a score cannot do</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A prompt score measures clarity, not correctness. It can tell you your prompt is
                well-built. It cannot tell you the AI&apos;s answer will be true, because the model can
                still make things up. So use the score to write a clear request, and still check the
                important facts in the answer. A strong prompt gets you a better draft, not a
                guaranteed one.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See your own prompt&apos;s score</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any prompt into Deepclario. It scores each part, shows you the weak ones, and rewrites it. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-to-improve-a-prompt-score" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to improve a prompt score →
              </Link>
              <Link href="/blog/what-is-a-good-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What makes a good AI prompt? →
              </Link>
              <Link href="/blog/prompt-analyzer-guide" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt analyzer guide →
              </Link>
            </div>
          </div>
          <PostFooter slug="prompt-score-explained" />
        </main>
      </div>
    </>
  )
}
