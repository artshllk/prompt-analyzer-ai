import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Zero-Shot vs Few-Shot Prompting — What the Difference Means in Practice',
  description: 'Zero-shot vs few-shot prompting explained clearly. What each technique is, when to use which, and real examples showing how few-shot examples change AI output quality.',
  alternates: { canonical: 'https://deepclario.com/blog/zero-shot-vs-few-shot-prompting' },
  openGraph: {
    title: 'Zero-Shot vs Few-Shot Prompting',
    description: 'Zero-shot vs few-shot prompting — what each one is and when to use which, with real examples.',
    url: 'https://deepclario.com/blog/zero-shot-vs-few-shot-prompting',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Zero-Shot vs Few-Shot Prompting',
  description: 'Clear explanation of zero-shot and few-shot prompting with real examples.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: '2026-05-01',
  dateModified: '2026-05-25',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is zero-shot prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zero-shot prompting means asking the AI to perform a task without giving it any examples. You describe what you want and let the model apply its training to the task. It works well for straightforward tasks where the format and expected output are standard, but falls short when you need output in a very specific style or format.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is few-shot prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Few-shot prompting means including 2-5 examples of the desired input and output in your prompt before asking the model to do the task. The examples show the model the exact format, tone, and structure you want. It consistently produces more accurate and on-format results for tasks where style and structure matter.',
      },
    },
    {
      '@type': 'Question',
      name: 'When should I use few-shot instead of zero-shot prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use few-shot prompting when: the output format is unusual or very specific, you need a consistent style across many outputs, the task involves classification or structured extraction, or you have tried zero-shot and the output keeps missing the mark. For simple, standard tasks, zero-shot with a clear instruction is usually sufficient.',
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
    { '@type': 'ListItem', position: 3, name: 'Zero-Shot vs Few-Shot Prompting', item: 'https://deepclario.com/blog/zero-shot-vs-few-shot-prompting' },
  ],
}

export default function ZeroShotVsFewShotPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="border-b border-[color:var(--color-rule)] px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
          <span className="text-[15px] tracking-tight font-medium" style={{ color: 'var(--color-paper)' }}>Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-full text-sm btn-paper font-medium transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
          Improve a prompt free
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <nav className="mb-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          <Link href="/blog" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>Blog</Link>
          <span className="mx-2">/</span>
          <span>Zero-shot vs few-shot prompting</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Fundamentals</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 6 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          Zero-shot vs few-shot prompting
        </h1>
        <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--color-paper-mute)' }}>
          Two terms that sound technical but describe something simple: whether you give the AI examples of what you want before asking it to do the task. Here is what each means, when each works, and how to use them.
        </p>

        <div className="space-y-10" style={{ color: 'var(--color-paper-mute)' }}>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>Zero-shot prompting</h2>
            <p className="leading-relaxed mb-4">
              Zero-shot means no examples. You describe the task and the AI uses its training to produce output.
              Most everyday prompts are zero-shot.
            </p>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-paper)' }}>Zero-shot example</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper)' }}>
                Classify the sentiment of this customer review as Positive, Negative, or Neutral.<br /><br />
                Review: "The product arrived on time but the packaging was damaged."
              </p>
            </div>
            <p className="leading-relaxed">
              Works fine here — sentiment classification is a standard task with a clear expected output.
              The AI has seen thousands of similar examples in training.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>Few-shot prompting</h2>
            <p className="leading-relaxed mb-4">
              Few-shot means including 2-5 examples of input and output before your actual task.
              The examples show the model exactly what "correct" looks like for your specific situation.
            </p>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-paper)' }}>Few-shot example</p>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>{`Classify each customer review using this format:
Sentiment: [Positive/Negative/Neutral]
Key issue: [1 phrase]

Examples:

Review: "Fast shipping, product works exactly as described."
Sentiment: Positive
Key issue: Delivery speed

Review: "Broke after two uses. Complete waste of money."
Sentiment: Negative
Key issue: Product durability

Review: "Does the job. Nothing special."
Sentiment: Neutral
Key issue: Met expectations

Now classify this review:
"The product arrived on time but the packaging was damaged."`}</pre>
            </div>
            <p className="leading-relaxed">
              The few-shot version does more: it produces a structured, consistent output with both sentiment
              and a key issue — which is more useful for downstream processing than a single label.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>When to use each</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-paper)' }}>Use zero-shot when</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'The task is standard and well-defined',
                    'The output format does not need to be precise',
                    'Speed matters more than format consistency',
                    'You are exploring what the model can do',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: 'var(--color-paper)' }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-paper)' }}>Use few-shot when</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'You need a very specific output format',
                    'You want consistent style across many outputs',
                    'The task involves classification or extraction',
                    'Zero-shot keeps missing the mark',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: 'var(--color-paper)' }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>One-shot: the middle ground</h2>
            <p className="leading-relaxed">
              One-shot prompting means a single example. It is often enough to anchor the output format
              without the overhead of writing multiple examples. If your task has a clear, repeatable
              structure, one well-chosen example usually produces consistent output. Use two or three
              examples if the task has meaningful variation across inputs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>The practical rule</h2>
            <p className="leading-relaxed mb-4">
              Start zero-shot. If the output does not match what you want in format or style, add one example.
              If it is still inconsistent, add two more. Three examples almost always produces reliable output
              for structured tasks.
            </p>
            <p className="leading-relaxed">
              The examples do not need to be long. They just need to show the exact input-output pattern you want.
              A 3-line example is often more effective than a 3-paragraph description of what you want.
            </p>
          </section>

        </div>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Not sure why your prompt is not working?
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Deepclario scores your prompt across five dimensions and tells you exactly what is missing. Free to use.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Analyze my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/what-is-prompt-engineering" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>What is prompt engineering? →</Link>
            <Link href="/blog/prompt-engineering-examples" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Prompt engineering examples with before and after →</Link>
            <Link href="/blog/ai-prompt-best-practices" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>AI prompt best practices →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all free prompt templates →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
