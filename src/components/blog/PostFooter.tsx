import Link from 'next/link'
import { BLOG_POSTS, LISTED_POSTS } from '@/lib/blog-posts'

/**
 * Shared footer for every blog post: a founder byline plus three related
 * posts picked automatically by tag from the registry. Hand-curated
 * "Related reading" blocks inside individual posts stay; this evens out
 * the internal linking across all posts without per-page curation.
 *
 * The current post is resolved against the FULL registry so an unlisted post
 * can still find itself and render its own footer. What it recommends comes
 * from LISTED_POSTS only: an unlisted post is one we have stopped advertising,
 * so it must not reappear as someone else's "related reading".
 */
export function PostFooter({ slug }: { slug: string }) {
  const current = BLOG_POSTS.find((p) => p.slug === slug)
  const sameTag = LISTED_POSTS.filter(
    (p) => p.slug !== slug && current && p.tag === current.tag,
  )
  const fallback = LISTED_POSTS.filter(
    (p) => p.slug !== slug && !sameTag.includes(p),
  )
  const related = [...sameTag, ...fallback].slice(0, 3)

  return (
    <footer className="mt-14 pt-8" style={{ borderTop: '1px solid var(--color-rule)' }}>
      <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--color-paper-mute)' }}>
        Written by <span style={{ color: 'var(--color-paper)' }}>Art, founder of Deepclario</span>.
        Deepclario opens every link in your writing and checks that the page really says it.{' '}
        <Link
          href="/"
          className="underline underline-offset-4 transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-paper)' }}
        >
          Check your sources free
        </Link>
        .
      </p>

      {related.length > 0 && (
        <div>
          <p className="eyebrow mb-4">Keep reading</p>
          <ul className="space-y-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-sm transition-opacity hover:opacity-80 underline underline-offset-4"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {p.title}
                </Link>
                <span className="ml-2 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
                  {p.tag} · {p.readTime}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </footer>
  )
}
