export const metadata = { title: 'Terms of Service - Deepclario' }

export default function TermsPage() {
  return (
    <article className="text-[#cdd5ee] space-y-5 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold text-[#f0f4ff] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#8b9cc8]">Last updated: April 28, 2026</p>
      </header>

      <Section title="Acceptance">
        <p>By using Deepclario you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>
      </Section>

      <Section title="Service">
        <p>Deepclario analyzes the prompts you submit and returns AI-generated suggestions and rewrites. Output quality depends on the underlying language model and the input you provide; we make no guarantee of accuracy.</p>
      </Section>

      <Section title="Account">
        <p>You&apos;re responsible for activity on your account. Don&apos;t share credentials. Don&apos;t use the service to generate content that is illegal, harassing, or violates third-party rights.</p>
      </Section>

      <Section title="Plans and billing">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Free</strong>: 25 prompt rewrites per calendar month.</li>
          <li><strong>Pro</strong> ($9.99/month or $95.88/year): unlimited prompt rewrites, full history, weekly insights.</li>
          <li>Subscriptions renew automatically. Cancel anytime in Settings → Manage billing. No prorated refunds.</li>
        </ul>
      </Section>

      <Section title="Acceptable use">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>No reverse engineering, scraping, or automated abuse.</li>
          <li>No attempting to bypass rate limits or free-tier caps.</li>
          <li>No prompts that violate Google Gemini&apos;s usage policies (the upstream model we route to).</li>
        </ul>
        <p className="mt-2">We may suspend accounts that violate these terms.</p>
      </Section>

      <Section title="Termination">
        <p>You can delete your account at any time. We may terminate accounts for repeated abuse with notice when reasonable.</p>
      </Section>

      <Section title="Disclaimer">
        <p>The service is provided &quot;as is&quot;. We don&apos;t warrant that it will be error-free or always available. To the maximum extent permitted by law, our liability is limited to the amount you&apos;ve paid us in the prior 12 months.</p>
      </Section>

      <Section title="Changes">
        <p>We may update these terms. Material changes will be announced by email or in-app notice. Continued use after changes means you accept the new terms.</p>
      </Section>

      <Section title="Contact">
        <p><a href="mailto:hello@deepclario.com" className="text-violet-400 hover:text-violet-300">hello@deepclario.com</a></p>
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
