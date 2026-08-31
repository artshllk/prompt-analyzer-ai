import Link from 'next/link'
import Image from 'next/image'

/**
 * Landing page for any failed sign-in. Supabase's raw error strings are
 * developer-speak ("PKCE code verifier not found in storage...") and used
 * to be shown verbatim - the single most confusing screen in the funnel.
 * Each known failure is translated into plain language plus the one
 * action that actually fixes it.
 */

interface ErrorCopy {
  title: string
  body: string
  cta: string
}

function copyFor(reason: string | undefined): ErrorCopy {
  const r = (reason ?? '').toLowerCase()

  if (r.includes('code verifier') || r.includes('different browser')) {
    return {
      title: 'Open the link where you asked for it.',
      body: 'For your security, a sign-in link only works in the same browser it was requested from. This one was opened somewhere else - a different browser, device, or your email app’s built-in viewer. Go back to the browser where you typed your email, or request a fresh link here.',
      cta: 'Request a new link',
    }
  }
  if (r.includes('expired') || r.includes('invalid')) {
    return {
      title: 'That link has expired.',
      body: 'Sign-in links work once and expire after an hour. No harm done - request a fresh one and you’re in.',
      cta: 'Request a new link',
    }
  }
  if (r.includes('security purposes') || r.includes('rate')) {
    return {
      title: 'One moment.',
      body: 'We just sent you a link, so a new one can’t be requested for about a minute. Check your inbox first - the link that’s already there still works.',
      cta: 'Back to sign in',
    }
  }
  return {
    title: 'Sign-in didn’t go through.',
    body: 'Something interrupted the sign-in. It’s safe to try again - nothing about your account was changed.',
    cta: 'Try again',
  }
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const { title, body, cta } = copyFor(reason)

  return (
    <div
      className="editorial grain min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 mb-12 transition-opacity hover:opacity-80"
      >
        <Image src="/logo.png" alt="Deepclario" width={32} height={32} priority />
        <span
          className="text-[15px] tracking-tight"
          style={{ color: 'var(--color-paper)', fontWeight: 500 }}
        >
          Deepclario
        </span>
      </Link>

      <div className="w-full max-w-sm text-center">
        <p className="eyebrow mb-4">Sign in</p>
        <h1 className="display text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
          {title}
        </h1>
        <p
          className="text-base leading-[1.6] mb-8"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {body}
        </p>
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all btn-brand"
          style={{ fontWeight: 500 }}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}
