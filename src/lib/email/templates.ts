import { unsubscribeUrl, type UnsubscribeScope } from './unsubscribe'

/**
 * All emails as plain functions returning { subject, text }.
 *
 * Voice rules, enforced here so no future template drifts:
 * - Plain text. No HTML, no images, no button rows.
 * - Basic English. Short sentences. No em dashes.
 * - Exactly one job and one link per email.
 * - Signed by a person, with a real reply-to.
 */

export interface EmailContent {
  subject: string
  text: string
  unsubscribeUrl: string | null
}

function appUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://deepclario.com'
  return `${base}${path}`
}

function firstNameOf(fullName: string | null): string {
  return fullName?.trim().split(/\s+/)[0] ?? 'there'
}

function footer(userId: string, scope: UnsubscribeScope): { text: string; url: string | null } {
  const url = unsubscribeUrl(userId, scope)
  const label =
    scope === 'weekly' ? 'Stop the weekly report'
    : scope === 'tips' ? 'Stop the tips'
    : 'Stop these emails'
  const allUrl = scope === 'all' ? null : unsubscribeUrl(userId, 'all')
  const lines = [
    '--',
    url ? `${label}: ${url}` : null,
    allUrl ? `Stop all emails: ${allUrl}` : null,
  ].filter(Boolean)
  return { text: lines.join('\n'), url: url ?? allUrl }
}

/* ============================================================
 * 1. Welcome - minutes after sign-up. One job: first rewrite.
 * ============================================================ */
export function welcomeEmail(userId: string, fullName: string | null): EmailContent {
  const f = footer(userId, 'all')
  return {
    subject: 'Your first rewrite takes 30 seconds',
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

Thanks for signing up.

Deepclario lives inside ChatGPT, Claude and Gemini. Install it, type your next prompt as roughly as you like, and press Alt+I (Option+I on a Mac). It improves it right there in the box. You never leave the chat.

Install it here: ${appUrl('/extension')}

That's it. No setup, nothing to learn.

Art, founder of Deepclario

P.S. Just reply if anything is confusing. I read every email.

${f.text}`,
  }
}

/* ============================================================
 * 2. Activation nudge - day 2 to 7, once ever. Two variants.
 * ============================================================ */
export function nudgeNewUserEmail(userId: string, fullName: string | null): EmailContent {
  const f = footer(userId, 'all')
  return {
    subject: 'Steal this prompt',
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

Most people get stuck on what to try first. So here is one:

"Write a cover letter for a job I want"

Type that into ChatGPT and press Alt+I (Option+I on a Mac). We will ask which job and what makes you a fit, because that is what was missing. That question is the whole product.

Get the extension: ${appUrl('/extension')}

Art

${f.text}`,
  }
}

export function nudgeActiveUserEmail(userId: string, fullName: string | null): EmailContent {
  const f = footer(userId, 'all')
  return {
    subject: 'The question is the good part',
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

You ran your first prompt through Deepclario this week. Nice.

One tip: when we ask you a question before rewriting, give a real answer instead of skipping past it. A one-line answer usually adds 20 or more clarity points, because it fills the exact gap the AI would otherwise guess at.

Try it on your next prompt: ${appUrl('/extension')}

Art

${f.text}`,
  }
}

/* ============================================================
 * 3. Weekly report - Mondays, only when there is data.
 * ============================================================ */
export interface WeeklyStats {
  sessionCount: number
  avgLift: number
  bestOriginal: string | null
  /** Most frequent improvement tag, human-readable. Pro only. */
  topGap: string | null
}

export function weeklyReportEmail(
  userId: string,
  fullName: string | null,
  stats: WeeklyStats
): EmailContent {
  const f = footer(userId, 'weekly')
  const best = stats.bestOriginal
    ? `\nYour best rewrite started as: "${truncate(stats.bestOriginal, 80)}"`
    : ''
  const pattern = stats.topGap
    ? `\nOne pattern we noticed: the thing you most often leave out is ${stats.topGap}. Before your next prompt, try adding it up front. It is the fastest fix on your list.\n`
    : ''
  return {
    subject: `Your week: +${stats.avgLift} clarity, ${stats.sessionCount} prompt${stats.sessionCount === 1 ? '' : 's'}`,
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

Your week in Deepclario:

Prompts improved: ${stats.sessionCount}
Average clarity lift: +${stats.avgLift}${best}
${pattern}
See your full history: ${appUrl('/history')}

Art

${f.text}`,
  }
}

/* ============================================================
 * 4. Tip of the week - Thursdays, opt-out separately.
 * ============================================================ */
const TIPS: Array<{ subject: string; body: string }> = [
  {
    subject: 'Stop saying "make it better"',
    body: `"Make it better" gives the AI nothing to aim at. Say what better means: shorter, warmer, more direct, less formal. One concrete word beats three vague ones.`,
  },
  {
    subject: 'Give the AI a job title',
    body: `Start your prompt with who the AI should be: "You are a hiring manager reading 200 resumes." The answer changes completely, because now it knows what to care about.`,
  },
  {
    subject: 'Why your summaries come out generic',
    body: `A summary without an audience is a summary for nobody. Say who will read it: "Summarize this for my manager, who has two minutes." The AI will pick different facts for different readers.`,
  },
  {
    subject: 'Say what you do not want',
    body: `Sometimes the fastest fix is a negative constraint: "No bullet points. No corporate words like leverage or streamline." Telling the AI what to avoid is often clearer than telling it what to do.`,
  },
  {
    subject: 'One task per prompt',
    body: `When you ask for five things at once, you get five shallow answers. Split them up. One prompt, one job, then feed the result into the next step. Slower to type, much better output.`,
  },
  {
    subject: 'Show one example',
    body: `If you want a specific style, paste one example of it and say "match this style." One real example beats a paragraph of adjectives every time.`,
  },
]

export function tipEmail(userId: string, fullName: string | null, weekNumber: number): EmailContent {
  const tip = TIPS[weekNumber % TIPS.length]
  const f = footer(userId, 'tips')
  return {
    subject: tip.subject,
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

${tip.body}

Try it on a real prompt: ${appUrl('/extension')}

Art

${f.text}`,
  }
}

export const TIP_COUNT = TIPS.length

/* ============================================================
 * 5. Win-back - after 14 quiet days, max twice ever.
 * ============================================================ */
export function winbackEmail(
  userId: string,
  fullName: string | null,
  bestLift: { before: number; after: number } | null
): EmailContent {
  const f = footer(userId, 'all')
  const reminder = bestLift
    ? `If you just forgot, here is your best result from before, as a reminder of what this does: your prompt went from clarity ${bestLift.before} to ${bestLift.after} in one pass.`
    : `If you just forgot, it takes thirty seconds to install: ${appUrl('/extension')}`
  return {
    subject: 'Still stuck on rough prompts?',
    unsubscribeUrl: f.url,
    text: `Hi ${firstNameOf(fullName)},

You have not been around for a couple of weeks. No problem.

If you stopped because something annoyed you, I would honestly like to know. Just reply and tell me.

${reminder}

Either way, thanks for trying it.

Art

${f.text}`,
  }
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}
