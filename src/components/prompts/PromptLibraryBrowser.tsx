'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PromptEntry } from '@/lib/prompt-library'

const CATEGORIES = ['All', 'Writing', 'Work', 'Coding', 'Learning', 'Business'] as const
type Category = (typeof CATEGORIES)[number]

/**
 * Client-side search + category filter for the prompt library.
 *
 * SEO-safe: every entry is server-rendered into the initial HTML (this is
 * a client component, so Next still SSRs it), so crawlers see every prompt
 * link. Filtering only hides nodes on the client. `initialQuery` seeds the
 * box from ?q=, which makes the site's sitelinks-searchbox schema work.
 */
export function PromptLibraryBrowser({
  entries,
  initialQuery = '',
}: {
  entries: PromptEntry[]
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<Category>('All')

  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      entries.filter(e => {
        if (category !== 'All' && e.category !== category) return false
        if (!q) return true
        return (
          e.heading.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.intro.toLowerCase().includes(q) ||
          e.searchTerm.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        )
      }),
    [entries, q, category],
  )

  // Default view (no query, All) keeps the editorial category grouping.
  const grouped = q === '' && category === 'All'
  const groups = useMemo(() => {
    const m = new Map<string, PromptEntry[]>()
    for (const e of filtered) {
      if (!m.has(e.category)) m.set(e.category, [])
      m.get(e.category)!.push(e)
    }
    return Array.from(m.entries())
  }, [filtered])

  return (
    <div>
      {/* Search field */}
      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-paper-mute)' }}
          aria-hidden
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search prompts — “cover letter”, “debug”, “summarize”…"
          aria-label="Search prompts"
          className="w-full rounded-full pl-11 pr-11 py-3.5 text-[15px] outline-none transition-colors focus:border-[color:var(--color-paper-mute)]"
          style={{
            background: 'var(--color-ink-card)',
            border: '1px solid var(--color-rule-strong)',
            color: 'var(--color-paper)',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map(c => {
          const active = category === c
          return (
            <button
              key={c}
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c)}
              className="text-[13px] px-3.5 py-1.5 rounded-full transition-colors chip-hover"
              style={
                active
                  ? { background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }
                  : { color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }
              }
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div className="mt-12 md:mt-14">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg" style={{ color: 'var(--color-paper)' }}>
              No prompts match “{query}”.
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Try a broader word, or{' '}
              <button
                onClick={() => { setQuery(''); setCategory('All') }}
                className="underline underline-offset-4"
                style={{ color: 'var(--color-paper)' }}
              >
                clear the search
              </button>
              .
            </p>
          </div>
        ) : grouped ? (
          <div className="space-y-16">
            {groups.map(([cat, list]) => (
              <section key={cat} id={cat.toLowerCase()} className="scroll-mt-28">
                <p className="eyebrow mb-5">{cat}</p>
                <PromptList list={list} />
              </section>
            ))}
          </div>
        ) : (
          <section>
            <p className="eyebrow mb-5">
              {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
              {category !== 'All' && ` in ${category}`}
            </p>
            <PromptList list={filtered} showCategory />
          </section>
        )}
      </div>
    </div>
  )
}

function PromptList({ list, showCategory }: { list: PromptEntry[]; showCategory?: boolean }) {
  return (
    <ul className="space-y-px">
      <li className="rule-strong" />
      {list.map(entry => (
        <li key={entry.slug}>
          <Link href={`/prompts/${entry.slug}`} className="block py-6 px-3 -mx-3 rounded-md row-hover">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-serif text-xl md:text-2xl" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                {entry.heading}
              </h2>
              <span className="shrink-0" style={{ color: 'var(--color-paper-mute)' }}>→</span>
            </div>
            <p className="mt-2 text-sm md:text-base leading-[1.55] max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
              {entry.intro}
            </p>
            {showCategory && (
              <span
                className="inline-block mt-3 text-[11px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                {entry.category}
              </span>
            )}
          </Link>
          <div className="rule" />
        </li>
      ))}
    </ul>
  )
}
