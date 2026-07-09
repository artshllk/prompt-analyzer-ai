import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Role Prompting: Examples That Improve AI Answers',
  description: 'Role prompting tells the AI who to be before it answers. Here is how it changes the output, with ready-to-use examples for writing, coding, and advice.',
  alternates: { canonical: 'https://deepclario.com/blog/role-prompting-examples' },
  openGraph: {
    title: 'Role Prompting: Examples That Improve AI Answers',
    description: 'Role prompting tells the AI who to be before it answers. Here is how it changes the output, with ready-to-use examples.',
    url: 'https://deepclario.com/blog/role-prompting-examples',
    type: 'article',
  },
}

const post = getBlogPost('role-prompting-examples')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Role Prompting: Examples That Improve AI Answers',
  description: 'What role prompting is, why assigning the AI a role changes its tone and depth, and copy-ready examples for common tasks.',
  author: { '@type': 'Person', name: 'Art Shllaku', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'what is role prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Role prompting means telling the AI who to act as before it answers, such as "act as a copy editor" or "you are a patient math tutor". The role sets the tone, depth, and vocabulary of the reply.',
      },
    },
    {
      '@type': 'Question',
      name: 'does telling ai to act as an expert actually work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It changes the style and focus of the answer, which often makes it more useful. It does not give the model new facts, so a role cannot make it accurate about something it does not know. Use it to shape the response, not to invent expertise.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i write a good role prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Name a specific role, add who the answer is for, and say what to focus on. "Act as a hiring manager reviewing this resume for a junior developer role, and flag the three weakest points" beats a bare "act as an expert".',
      },
    },
    {
      '@type': 'Question',
      name: 'what are some good role prompt examples?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A few that work well: "Act as a tough but fair editor. Cut anything that does not earn its place." "Act as a patient tutor for a beginner. Explain this with one everyday example, then quiz me." "Act as a skeptical first-time customer. Tell me what would stop you from buying." The pattern is role, audience, and the one thing to focus on.',
      },
    },
    {
      '@type': 'Question',
      name: 'is act as a doctor a safe way to get expert advice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A role changes how the model writes, not what it knows. Telling it to act as a doctor makes the answer sound like a doctor, but it does not make the medical claims safe to trust. Use roles to control tone and focus, and always check the facts yourself on anything that matters.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
    { '@type': 'ListItem', position: 3, name: 'Role Prompting Examples', item: 'https://deepclario.com/blog/role-prompting-examples' },
  ],
}

export default function RolePromptingExamplesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="editorial grain min-h-screen">
        <MarketingNav current="blog" />

        <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-36 pb-16">
          <div className="mb-6">
            <Link href="/" className="text-xs text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper-mute)] transition-colors">← Back to Deepclario</Link>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Prompting</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            Role Prompting
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Role prompting is the trick of telling the AI who to be before you ask your question.
            &ldquo;Act as a copy editor.&rdquo; &ldquo;You are a patient tutor.&rdquo; That one line
            shifts the tone, the depth, and the words the model uses. Here is how to use it well.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why a role changes the answer</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Without a role, the model answers as a general assistant. It aims for the safe
                middle: a bit formal, a bit generic, useful but bland. When you give it a role, you
                point it at a narrower way of writing.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Ask it to act as a copy editor and it starts hunting for weak sentences. Ask it to
                act as a tutor and it slows down and explains. The facts do not change, but the
                shape of the answer does, and shape is often what you were missing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A bare role vs a specific one</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Bare role</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;Act as an expert and review my resume.&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)] mt-2">&ldquo;Expert&rdquo; at what? For whom? The model still has to guess.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">Specific role</p>
                  <p className="text-sm text-[color:var(--color-paper)]">&ldquo;Act as a hiring manager filling a junior developer role. Review this resume and flag the three weakest points a recruiter would notice first.&rdquo;</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Examples you can copy</h2>
              <div className="space-y-3">
                {[
                  { t: 'Editing', d: '"Act as a strict copy editor. Cut every sentence that does not earn its place, and tell me what you cut and why."' },
                  { t: 'Learning', d: '"Act as a patient tutor for a beginner. Explain this using one everyday example, then check my understanding with one question."' },
                  { t: 'Coding', d: '"Act as a senior developer doing code review. Point out bugs and risky patterns first, style last, and keep it short."' },
                  { t: 'Feedback', d: '"Act as a skeptical customer. Read this product description and tell me what would stop you from buying."' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a role cannot do</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A role shapes how the model writes. It does not hand the model new facts. Telling it
                to &ldquo;act as a doctor&rdquo; does not make its medical claims safe to trust. It
                just makes them sound like a doctor.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So use roles to control tone, focus, and depth. Do not use them as a shortcut to
                expertise the model does not have. On anything that matters, still check the facts
                yourself.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">More role prompts to copy</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Here is a longer set you can adapt. Notice that the good ones do not just name a role;
                they add who the answer is for and what to focus on.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Marketing', d: '"Act as a plain-spoken marketer. Rewrite this product blurb for busy small-business owners. Cut the buzzwords and lead with the benefit."' },
                  { t: 'Job hunting', d: '"Act as a hiring manager for a junior marketing role. Read my resume and tell me the three things that would make you skip it."' },
                  { t: 'Studying', d: '"Act as a patient tutor for a complete beginner. Explain this topic with one everyday example, then quiz me with two short questions."' },
                  { t: 'Writing', d: '"Act as a tough but fair editor. Cut anything that does not earn its place in this paragraph, and tell me what you cut and why."' },
                  { t: 'Planning', d: '"Act as a practical project planner. Turn this goal into a simple week-by-week plan with the riskiest step flagged."' },
                  { t: 'Getting feedback', d: '"Act as a skeptical first-time customer. Read this landing page and tell me what would stop you from buying."' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A simple formula for writing your own</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Once you see the pattern, you can build a role prompt for anything. The good ones have
                three parts, in this order.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)] leading-relaxed mb-3">
                  <span className="font-semibold">Role + audience + focus.</span> Name who the model
                  should be, who the answer is for, and the one thing to focus on.
                </p>
                <p className="text-sm text-[color:var(--color-paper-mute)]">
                  &ldquo;Act as a <span className="italic">[role]</span> helping a
                  <span className="italic"> [who the answer is for]</span>. Focus on
                  <span className="italic"> [the one thing that matters most]</span>.&rdquo;
                </p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                A bare &ldquo;act as an expert&rdquo; leaves the model guessing at all three. Filling in
                the blanks is what turns a vague role into a useful one.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Build a stronger prompt</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario scores your prompt, spots what is missing, and rewrites it, role and all. Free, no account needed.</p>
            <Link href="/tools/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/chatgpt-system-prompt-examples" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                ChatGPT system prompt examples →
              </Link>
              <Link href="/blog/what-is-a-good-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What makes a good AI prompt? →
              </Link>
              <Link href="/blog/how-to-write-better-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to write better prompts: 7 proven techniques →
              </Link>
            </div>
          </div>
          <PostFooter slug="role-prompting-examples" />
        </main>
      </div>
    </>
  )
}
