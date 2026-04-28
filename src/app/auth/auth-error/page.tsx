import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const message = reason ?? 'Your sign-in link is invalid or has expired.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-rose-600/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="glass rounded-2xl p-7 border border-[#1e2d4a] text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6V11M10 14H10.01M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10Z" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-[#f0f4ff] mb-2">Sign-in failed</h1>
          <p className="text-sm text-[#8b9cc8] mb-6 break-words">{message}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}
