export const metadata = {
  title: 'Privacy Policy',
  description:
    'How Deepclario handles your data: what the browser extension reads, which companies process your prompts, what we store, and how to delete everything.',
  alternates: { canonical: 'https://deepclario.com/privacy' },
}

/**
 * The policy has to describe the product that exists.
 *
 * The version this replaced never used the word "extension", which was the
 * main way people used Deepclario. It named Google as the only AI processor
 * while the prompt engine also called OpenAI. It did not mention Memory. Its
 * contact section was commented out, so it had no contact address at all,
 * which GDPR and CCPA both require. It was dated April.
 *
 * Meanwhile the Chrome Web Store listing made specific promises: "we only see
 * a prompt when you press Improve", "we do not read your chats". Those are
 * true in the code (extension/content.js reads one composer element and only
 * on keypress) but they were only ever written in store copy, not in the
 * document users are pointed to. Now they are here, where they belong.
 */
export default function PrivacyPage() {
  return (
    <article className="space-y-6 leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
      <header>
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="display text-3xl md:text-4xl tracking-tight mb-2" style={{ color: 'var(--color-paper)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>Last updated: August 31, 2026</p>
      </header>

      <p>
        Deepclario improves the prompts you write for AI tools. That means you paste
        us text you care about, so this page says plainly what happens to it. If
        anything here is unclear, email us and we will fix the wording.
      </p>

      <Section title="The browser extension">
        <p className="mb-3">
          Our Chrome extension runs on four sites: chatgpt.com, chat.openai.com,
          claude.ai and gemini.google.com. This is the part people ask about most,
          so it is first.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <Strong>It reads one thing: the box you type in.</Strong> The extension
            looks up the message composer on the page and reads the text in it.
            That is the whole of what it reads.
          </li>
          <li>
            <Strong>It does not read your conversations.</Strong> Not your previous
            messages, not the AI&apos;s replies, not anything else on the page. It
            cannot: it only ever looks at editable input elements, and a message
            that has already been sent is not one.
          </li>
          <li>
            <Strong>Nothing is sent until you ask.</Strong> Your prompt leaves your
            browser only when you press Improve, with the keyboard shortcut or the
            button. Nothing runs on its own and nothing is sent in the background.
          </li>
          <li>
            <Strong>It stores no prompt text on your machine.</Strong> Extension
            storage holds a sign-in token, your plan, your tone preference and a
            few counters. Your prompts live in memory while you are working and are
            gone when the page closes.
          </li>
          <li>
            <Strong>It has no permission to see other tabs.</Strong> The extension
            asks for one browser permission, storage, and for access to our own
            domain. It cannot see your browsing, your other tabs, or any site not
            in the list above.
          </li>
        </ul>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Strong>Account info</Strong> - your email, and your display name and avatar if you sign in with Google.</li>
          <li><Strong>Prompts you submit</Strong> - your original prompt, anything you answer when we ask a question, and the improved version. Stored under your account.</li>
          <li><Strong>Memory</Strong> - when you fill in a missing detail we asked for, we save the label and your short answer so we do not ask you the same thing next week. You can see and delete these in Settings.</li>
          <li><Strong>Text you check with the detector</Strong> - sent for analysis. We do not store it.</li>
          <li><Strong>Usage events</Strong> - a timestamp per improvement, used only to apply plan limits.</li>
          <li><Strong>Billing metadata</Strong> - Paddle customer and subscription IDs. Card numbers never reach us; they stay with Paddle.</li>
        </ul>
      </Section>

      <Section title="If you are not signed in">
        <p>
          You can use the tool on this site without an account. When you do, we do
          not store your prompt or the rewrite, and there is no account to attach
          them to. We keep two things that identify nobody: a count of how many
          free improvements happened across the whole site today, so the free tool
          cannot run up an unlimited bill, and anonymous counters that record which
          steps happened, for example that a question was asked or that a rewrite
          was kept. Those counters contain an event name and nothing else. No
          prompt text, no identifier, no IP address.
        </p>
      </Section>

      <Section title="What we do not do">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>We do not sell your data.</li>
          <li>We do not use your prompts to train models.</li>
          <li>We do not run advertising or behavioural trackers.</li>
          <li>We do not read your conversations with ChatGPT, Claude or Gemini.</li>
        </ul>
      </Section>

      <Section title="Companies that process your data">
        <p className="mb-3">
          Checking your writing means sending it to an AI model, so it is handled
          by the company running that model. Their terms apply to that
          processing. The same is true of the prompt improver and the detector.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Strong>OpenAI</Strong> - reads the text you paste into the source checker to find the claims in it, and reads each page we open to judge whether it supports the claim. Also runs most prompt improvements.</li>
          <li><Strong>Tavily</Strong> - opens the links in your text and returns the page contents so we can check them. It receives the URLs found in what you paste, and, when a source is named but not linked, the sentence we search for.</li>
          <li><Strong>Google (Gemini)</Strong> - runs some prompt improvements, and writes the plain-English explanation in the AI text detector.</li>
          <li><Strong>Supabase</Strong> - our database and sign-in.</li>
          <li><Strong>Paddle</Strong> - payments for Pro. Paddle is the merchant of record.</li>
          <li><Strong>Vercel</Strong> - hosting.</li>
          <li><Strong>Resend</Strong> - sends our emails.</li>
        </ul>
      </Section>

      <Section title="The source checker">
        <p className="mb-3">
          <Strong>We do not store the text you paste into the source checker.</Strong>{' '}
          It is not written to our database, it is not kept in your history, and
          it is not written to our logs. We count that a check happened, and
          nothing else about it.
        </p>
        <p className="mb-3">
          It is sent to OpenAI to find the claims in it, and the links inside it
          are sent to Tavily so the pages can be opened and read. Neither we nor
          they use it to train models.
        </p>
        <p>
          One consequence worth stating plainly: if your text contains a private
          link, that URL is sent to Tavily and the page behind it is fetched. Do
          not paste anything whose links point somewhere you would not want
          opened.
        </p>
      </Section>

      <Section title="Your rights">
        <p>You can:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>See and export your past sessions from the History page.</li>
          <li>Delete individual saved answers, or all of them, from Settings.</li>
          <li>Delete your account and everything attached to it from Settings, under Danger zone.</li>
          <li>Unsubscribe from any email using the link at the bottom of it.</li>
          <li>Email us to request access to, correction of, or a copy of your data.</li>
        </ul>
        <p className="mt-3">
          If you are in the UK or EU, these are your rights under GDPR. If you are
          in California, they are your rights under CCPA. Either way you do not
          need to quote a law at us. Ask and we will do it.
        </p>
      </Section>

      <Section title="How long we keep things">
        <p>
          Account data is kept until you delete your account. On the free plan,
          session history is kept for 7 days. On Pro it is kept until you remove
          it. After you delete your account every row is removed within 24 hours,
          including the link to your Paddle customer record. Backup snapshots may
          hold data for up to 30 more days before they roll off.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Deepclario is not intended for anyone under 16, and we do not knowingly
          collect their data.
        </p>
      </Section>

      <Section title="Changes to this page">
        <p>
          If we change how we handle your data in a way that matters, we will
          update the date at the top and email account holders. We will not make a
          material change quietly.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          A person reads this address, usually the same day.{' '}
          <a
            href="mailto:support@deepclario.com"
            className="underline underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-paper)' }}
          >
            support@deepclario.com
          </a>
        </p>
        <p className="mt-2 text-sm">
          Deepclario, operated by Art Shllaku. Write to the address above for a
          postal address or for anything to do with your data.
        </p>
      </Section>
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
