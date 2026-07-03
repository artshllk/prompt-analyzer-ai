import type { Metadata } from 'next'

// Auth pages are thin utility surfaces with no search value; keep them out
// of the index so they don't dilute the site's crawl profile. The login
// page itself is a client component, so the noindex lives here.
export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
