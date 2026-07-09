export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Deepclario handles your data: what we store, what we never do with your prompts, and how to delete everything.',
  alternates: { canonical: 'https://deepclario.com/privacy' },
}

export default function PrivacyPage() {
  return (
    <article className="space-y-6 leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
      <header>
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="display text-3xl md:text-4xl tracking-tight mb-2" style={{ color: 'var(--color-paper)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>Last updated: April 28, 2026</p>
      </header>

      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Strong>Account info</Strong> - your email and (if signing in with Google) your display name and avatar.</li>
          <li><Strong>Prompts you submit</Strong> - your original prompt, clarifications, and the AI-generated improvement, stored under your account.</li>
          <li><Strong>Usage events</Strong> - timestamp of each rewrite, used solely to enforce free-tier limits.</li>
          <li><Strong>Billing metadata</Strong> - Paddle customer and subscription IDs (not card numbers - those stay with Paddle).</li>
        </ul>
      </Section>

      <Section title="What we do NOT collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>We do not sell your data.</li>
          <li>We do not use your prompts to train models.</li>
          <li>We do not run third-party advertising or behavioral trackers.</li>
        </ul>
      </Section>

      <Section title="Third-party services">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Strong>Google Gemini</Strong> - your prompt is sent to Google to generate the improvement. Google&apos;s policy applies to that processing.</li>
          <li><Strong>Supabase</Strong> - auth and database hosting (data stored in the EU/US region of our project).</li>
          <li><Strong>Paddle</Strong> - payment processing for Pro subscriptions.</li>
          <li><Strong>Vercel</Strong> - application hosting.</li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>You can:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Export your sessions from the History page.</li>
          <li>Delete your account and all data immediately from Settings → Danger zone.</li>
          <li>Email us to request access, correction, or portability of your data.</li>
        </ul>
      </Section>

      <Section title="Data retention">
        <p>Account data is kept until you delete your account. After deletion, all rows are removed within 24 hours, including Paddle customer linkage. Backup snapshots may persist up to 30 days.</p>
      </Section>

      {/* <Section title="Contact">
        <p>
          Questions:{' '}
          <a
            href="mailto:hello@deepclario.com"
            className="underline underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-paper)' }}
          >
            hello@deepclario.com
          </a>
        </p>
      </Section> */}
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mt-6 mb-2" style={{ color: 'var(--color-paper)' }}>{title}</h2>
      {children}
    </section>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--color-paper)' }}>{children}</strong>
}
