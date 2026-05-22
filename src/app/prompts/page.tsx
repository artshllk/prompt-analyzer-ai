import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROMPT_LIBRARY, type PromptEntry } from '@/lib/prompt-library'

export const metadata: Metadata = {
  title: 'Free ChatGPT Prompt Library - Copy-Paste Prompts That Work',
  description:
    'A free library of ready-to-use ChatGPT prompts for cover letters, emails, summaries, code review and more. Copy, paste, fill in the blanks. Works with Claude and Gemini too.',
  alternates: { canonical: 'https://deepclario.com/prompts' },
  openGraph: {
    title: 'Free ChatGPT Prompt Library',
    description:
      'Ready-to-use prompts for real tasks: cover letters, emails, summaries, code review. Copy and paste.',
    url: 'https://deepclario.com/prompts',
    type: 'website',
    images: [{ url: 'https://deepclario.com/logo.png', width: 512, height: 512, alt: 'Deepclario' }],
  },
}

// Group entries by category, preserving library order within each.
function groupByCategory(entries: PromptEntry[]): [string, PromptEntry[]][] {
  const groups = new Map<string, PromptEntry[]>()
  for (const e of entries) {
    if (!groups.has(e.category)) groups.set(e.category, [])
    groups.get(e.category)!.push(e)
  }
  return Array.from(groups.entries())
}

export default function PromptsIndexPage() {
  const grouped = groupByCategory(PROMPT_LIBRARY)

  return (
    <div
      className="editorial grain min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Nav */}
      <header
        className="border-b px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderColor: 'var(--color-rule)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
          <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
            Deepclario
          </span>
        </Link>
        <Link
          href="/playground"
          className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
        >
          Improve a prompt free
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Hero */}
        <div className="max-w-2xl">
          <p className="eyebrow mb-6">Free prompt library</p>
          <h1
            className="display text-5xl md:text-[4.5rem] leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            Prompts that{' '}
            <span style={{ color: 'var(--color-paper-mute)' }}>actually work.</span>
          </h1>
          <p className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
            Ready-to-use prompts for real tasks. Copy one, paste it into ChatGPT, Claude,
            or Gemini, and fill in the blanks. Each one is written the way a prompt
            engineer would write it, and free.
          </p>
        </div>

        {/* Categories */}
        <div className="mt-16 md:mt-20 space-y-16">
          {grouped.map(([category, entries]) => (
            <section key={category}>
              <p className="eyebrow mb-5">{category}</p>
              <ul className="space-y-px">
                <li className="rule-strong" />
                {entries.map(entry => (
                  <li key={entry.slug}>
                    <Link
                      href={`/prompts/${entry.slug}`}
                      className="block py-6 px-3 -mx-3 rounded-md row-hover"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h2
                          className="font-serif text-xl md:text-2xl"
                          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
                        >
                          {entry.heading}
                        </h2>
                        <span className="shrink-0" style={{ color: 'var(--color-paper-mute)' }}>→</span>
                      </div>
                      <p className="mt-2 text-sm md:text-base leading-[1.55] max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
                        {entry.intro}
                      </p>
                    </Link>
                    <div className="rule" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section
          className="mt-20 rounded-2xl p-8 md:p-10"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <h2 className="font-serif text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Already have a prompt of your own?
          </h2>
          <p className="text-base md:text-lg leading-[1.6] mb-6 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            Templates are a starting point. Deepclario takes the prompt <em>you</em> wrote,
            scores it, and rewrites it for your exact task. Free, no account needed.
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Improve my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-4xl mx-auto text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          © 2026 Deepclario{' '}
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}
