import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Chrome extension - Sharpen prompts inside ChatGPT, Claude & Gemini',
  description:
    'The Deepclario browser extension adds a Sharpen button inside ChatGPT, Claude, and Gemini. Score and rewrite your prompt before you send it - without leaving the page.',
  alternates: { canonical: 'https://deepclario.com/extension' },
  openGraph: {
    title: 'Deepclario - Chrome extension',
    description:
      'Sharpen your prompt inside ChatGPT, Claude, and Gemini. One click, in-page, no tab switching.',
    url: 'https://deepclario.com/extension',
    type: 'website',
    images: [{ url: 'https://deepclario.com/logo.png', width: 512, height: 512, alt: 'Deepclario' }],
  },
}

const STEPS = [
  {
    n: '01',
    t: 'Download',
    d: 'Get the extension folder. It is a small zip - no installer, no account.',
  },
  {
    n: '02',
    t: 'Unzip it',
    d: 'Double-click the downloaded file. You will get a folder called “extension”.',
  },
  {
    n: '03',
    t: 'Open your extensions page',
    d: 'In Chrome, Edge, Brave or Arc, go to the address bar and visit chrome://extensions (edge://extensions on Edge).',
  },
  {
    n: '04',
    t: 'Turn on Developer mode',
    d: 'Toggle “Developer mode” on - it is the switch in the top-right corner of that page.',
  },
  {
    n: '05',
    t: 'Load it',
    d: 'Click “Load unpacked”, then select the unzipped “extension” folder. That is it.',
  },
  {
    n: '06',
    t: 'Use it',
    d: 'Open chatgpt.com, claude.ai, or gemini.google.com. A “✦ Sharpen prompt” button appears bottom-right.',
  },
]

export default function ExtensionPage() {
  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
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
          Try the web app
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Hero */}
        <div className="max-w-3xl">
          <p className="eyebrow mb-6">Browser extension · Chrome · Edge · Brave · Arc</p>
          <h1
            className="display text-5xl md:text-[5rem] leading-tight tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            Sharpen your prompt{' '}
            <span style={{ color: 'var(--color-paper-mute)' }}>where you write it.</span>
          </h1>
          <p className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
            Adds a Sharpen button directly inside ChatGPT, Claude, and Gemini.
            Score your prompt, answer one question if something is missing, and
            get a rewrite - without leaving the page or opening another tab.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/deepclario-extension.zip"
              download
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
              style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
            >
              Download the extension
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V10M7 10L3 6M7 10L11 6M2 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Free. No account. ~30&nbsp;KB.
            </span>
          </div>
        </div>

        {/* Install steps */}
        <section className="mt-20 md:mt-28">
          <div className="grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              <p className="eyebrow">Install · 2 minutes</p>
            </div>
            <div className="md:col-span-9 space-y-px">
              <div className="rule-strong" />
              {STEPS.map(s => (
                <div key={s.n}>
                  <div className="grid grid-cols-12 gap-4 md:gap-8 py-7">
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-serif text-2xl md:text-3xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                        {s.n}
                      </p>
                    </div>
                    <div className="col-span-10 md:col-span-4">
                      <h3 className="font-serif text-xl md:text-2xl" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                        {s.t}
                      </h3>
                    </div>
                    <div className="col-span-12 md:col-span-7">
                      <p className="text-base md:text-lg leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                        {s.d}
                      </p>
                    </div>
                  </div>
                  <div className="rule" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / privacy */}
        <section className="mt-20 md:mt-28 grid md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-3">
            <p className="eyebrow">What it does with your data</p>
          </div>
          <div className="md:col-span-9 space-y-5">
            <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper)' }}>
              The only thing sent anywhere is the prompt text you choose to
              sharpen. It goes to Deepclario, is analyzed once, and is not stored.
            </p>
            <p className="text-base leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
              No account, no tracking, no analytics inside the extension, no other
              network calls. It only activates on chatgpt.com, claude.ai, and
              gemini.google.com. Read the full{' '}
              <Link href="/privacy" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Prefer not to install */}
        <section className="mt-20 md:mt-28 grid md:grid-cols-12 gap-8 md:gap-16 pt-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="md:col-span-3">
            <p className="eyebrow">Rather not install anything?</p>
          </div>
          <div className="md:col-span-9">
            <p className="font-serif text-2xl md:text-3xl leading-tight mb-6" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              The same engine runs on the web.
            </p>
            <p className="text-base md:text-lg leading-[1.6] mb-8 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
              Paste a prompt on the homepage and get the exact same score and
              rewrite - no extension, no signup.
            </p>
            <Link
              href="/#try"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all btn-outline"
              style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
            >
              Try it on the web
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-5xl mx-auto text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          © 2026 Deepclario·{' '}
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}
