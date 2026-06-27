import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
export const metadata: Metadata = {
  title: 'Chrome extension - Deepclario inside ChatGPT, Claude & Gemini',
  description:
    'Install the Deepclario extension and an Improve button appears in your ChatGPT, Claude, or Gemini chat box. One click. Your prompt gets rewritten in place. No copy-paste, no new tab.',
  alternates: { canonical: 'https://deepclario.com/extension' },
  openGraph: {
    title: 'Deepclario - Chrome extension',
    description:
      'An Improve button right in your ChatGPT, Claude, and Gemini chat box. One click, in place, no tab switching.',
    url: 'https://deepclario.com/extension',
    type: 'website',
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
    d: 'Open chatgpt.com, claude.ai, or gemini.google.com. A “✦ Improve prompt” button appears bottom-right.',
  },
  {
    n: '07',
    t: 'Connect your account (optional)',
    d: 'If you have a Deepclario account, open the extension panel, click “Connect account”, and paste the code from deepclario.com/extension/connect. The extension then uses your plan instead of the public free quota.',
  },
]

const EXTENSION_VERSION = 'v0.4.0'

export default function ExtensionPage() {
  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <MarketingNav current="extension" />

      <main className="max-w-5xl mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-16 md:pb-24">
        {/* Hero */}
        <div className="max-w-3xl">
          <p className="eyebrow mb-6">Browser extension · Chrome · Brave · Edge · Arc</p>
          <h1
            className="display text-5xl md:text-[5rem] leading-tight tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            Improve your prompt{' '}
            <span className="accent">without leaving ChatGPT.</span>
          </h1>
          <p className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
            An Improve button appears right in your ChatGPT, Claude, or Gemini chat box. Click it. Your prompt gets rewritten in place. No copy-paste. No new tab.
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
              Works in Chrome, Brave, Edge, Arc.
            </span>
            <span
              className="text-[11px] font-medium tracking-[0.16em] uppercase px-2.5 py-1 rounded-full"
              style={{
                color: 'var(--color-paper-mute)',
                border: '1px solid var(--color-rule-strong)',
              }}
            >
              {EXTENSION_VERSION}
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

        {/* Test it now - removes the "ok now what" dead-end after the
            install steps. Sends the visitor straight to ChatGPT to try
            the freshly installed Improve button on a real prompt. */}
        <section className="mt-16 md:mt-20 grid md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-3">
            <p className="eyebrow">Now try it</p>
          </div>
          <div className="md:col-span-9">
            <p
              className="font-serif text-2xl md:text-3xl leading-tight mb-5"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              Open a chat and look for the Improve button.
            </p>
            <p
              className="text-base md:text-lg leading-[1.6] max-w-xl mb-7"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Pick whichever you already use. Paste a prompt. Click Improve.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
                style={{
                  border: '1px solid var(--color-rule-strong)',
                  color: 'var(--color-paper)',
                }}
              >
                Open ChatGPT →
              </a>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
                style={{
                  border: '1px solid var(--color-rule-strong)',
                  color: 'var(--color-paper)',
                }}
              >
                Open Claude →
              </a>
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
                style={{
                  border: '1px solid var(--color-rule-strong)',
                  color: 'var(--color-paper)',
                }}
              >
                Open Gemini →
              </a>
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
              The only thing sent anywhere is the prompt you click Improve on. It goes to Deepclario, gets rewritten once, and is not stored.
            </p>
            <p className="text-base leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
              No account required, no tracking, no analytics inside the extension, no other network calls. It only activates on chatgpt.com, claude.ai, and gemini.google.com. Read the full{' '}
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
              Paste a prompt on the playground and get the exact same rewrite.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all btn-outline"
              style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
            >
              Open the playground
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-5xl mx-auto text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          © 2026 Deepclario{' '}
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}
