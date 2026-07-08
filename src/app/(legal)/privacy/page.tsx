export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Deepclario handles your data: what we store, what we never do with your prompts, and how to delete everything.',
  alternates: { canonical: 'https://deepclario.com/privacy' },
}

export default function PrivacyPage() {
  return (
    <article className="text-[#cdd5ee] space-y-5 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold text-[#f0f4ff] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#8b9cc8]">Last updated: April 28, 2026</p>
      </header>

      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account info</strong> - your email and (if signing in with Google) your display name and avatar.</li>
          <li><strong>Prompts you submit</strong> - your original prompt, clarifications, and the AI-generated improvement, stored under your account.</li>
          <li><strong>Usage events</strong> - timestamp of each analysis, used solely to enforce free-tier limits.</li>
          <li><strong>Billing metadata</strong> - Paddle customer and subscription IDs (not card numbers - those stay with Paddle).</li>
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
          <li><strong>Google Gemini</strong> - your prompt is sent to Google to generate the improvement. Google&apos;s policy applies to that processing.</li>
          <li><strong>Supabase</strong> - auth and database hosting (data stored in the EU/US region of our project).</li>
          <li><strong>Paddle</strong> - payment processing for Pro subscriptions.</li>
          <li><strong>Vercel</strong> - application hosting.</li>
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

      <Section title="Contact">
        <p>Questions: <a href="mailto:hello@deepclario.com" className="text-violet-400 hover:text-violet-300">hello@deepclario.com</a></p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#f0f4ff] mt-6 mb-2">{title}</h2>
      {children}
    </section>
  )
}
