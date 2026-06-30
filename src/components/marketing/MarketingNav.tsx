import Link from 'next/link'
import Image from 'next/image'

/**
 * Shared marketing nav used across every public-facing surface
 * (homepage, /faq, /detector, /extension, /prompts, /blog, blog posts).
 *
 * Keeps the link set in one place so a content page never drifts from
 * the homepage. Pass `current` to subtly highlight the active link.
 *
 * Anchors that target the homepage are scoped as `/#anchor` so they
 * also work from non-home pages (Next router handles the scroll on
 * arrival).
 */

type NavKey = 'home' | 'detector' | 'prompts' | 'extension' | 'pricing' | 'faq' | 'blog'

const LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: 'detector', href: '/detector', label: 'Detector' },
  { key: 'prompts', href: '/prompts', label: 'Prompts' },
  { key: 'extension', href: '/extension', label: 'Extension' },
  { key: 'pricing', href: '/#pricing', label: 'Pricing' },
  { key: 'faq', href: '/faq', label: 'FAQ' },
  { key: 'blog', href: '/blog', label: 'Blog' },
]

interface MarketingNavProps {
  current?: NavKey
}

export function MarketingNav({ current }: MarketingNavProps = {}) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
      style={{
        background: 'rgba(14,14,16,0.72)',
        borderBottom: '1px solid var(--color-rule)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
          <span
            className="text-[15px] tracking-tight"
            style={{ color: 'var(--color-paper)', fontWeight: 500 }}
          >
            Deepclario
          </span>
        </Link>
        <nav
          className="hidden md:flex items-center gap-7 text-sm"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {LINKS.map(link => {
            const isCurrent = current === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className={
                  isCurrent
                    ? 'opacity-100'
                    : 'hover:opacity-100 transition-opacity opacity-80'
                }
                style={isCurrent ? { color: 'var(--color-paper)' } : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm hover:opacity-100 transition-opacity opacity-80"
            style={{ color: 'var(--color-paper)' }}
          >
            Sign in
          </Link>
          <Link
            href="/playground"
            className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            Try free
          </Link>
        </div>
      </div>
    </header>
  )
}
