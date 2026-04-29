import Link from 'next/link'
import Image from 'next/image'

export function PublicNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3.5 border-b border-[#1e2d4a]/60 backdrop-blur-md bg-[#0a0e1a]/70">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="Deepclario" width={28} height={28} className="rounded-md" />
        <span className="font-bold text-[#f0f4ff] tracking-tight">Deepclario</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-[#8b9cc8] hover:text-[#f0f4ff] px-3 py-1.5 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/login?mode=signup"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
        >
          Sign up free
        </Link>
      </div>
    </header>
  )
}
