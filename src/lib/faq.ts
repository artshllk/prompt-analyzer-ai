/**
 * The FAQ content, in a plain module so BOTH sides can read it.
 *
 * It used to live inside FAQSection, which is a client component. A value
 * exported from a `'use client'` module reaches a server component as a
 * client reference proxy, not the array, so `FAQS.map` threw at module
 * evaluation and /faq returned a 500. The page needs the real array to build
 * FAQPage structured data at request time, so the data has to sit outside the
 * component that renders it.
 *
 * One array, two consumers: the accordion renders it and the JSON-LD is
 * generated from it. Structured data that disagrees with the visible page is
 * worse than none, and generating both from here is what makes drifting
 * impossible rather than merely unlikely.
 */
import { FACTCHECK_FREE_LIMIT, PRO_FACTCHECK_LIMIT } from '@/lib/limits'
import { ANON_FACTCHECK_MONTH } from '@/lib/rate-limit'
import { MAX_CLAIMS_PER_DOC } from '@/lib/factcheck/types'
import { PRICE_LIST, PRICE_FOUNDING, FOUNDING_SEAT_COUNT } from '@/lib/plans'

export interface Faq {
  /**
   * The anchor. `/faq#do-you-keep-my-writing` opens this answer and scrolls
   * to it, which is what lets copy elsewhere point AT AN ANSWER instead of
   * describing the mechanism again in its own words. A second description of
   * how we handle text is a second thing to keep true; a link is not.
   *
   * Written down rather than derived from the question, so editing the
   * wording of a question cannot silently break every link into it.
   */
  id: string
  q: string
  a: string
}

/**
 * The answer the hero's privacy line points at.
 *
 * Exported so the hero links to a constant rather than to a string it repeats.
 * Renaming the anchor then breaks the build instead of breaking the link.
 */
export const FAQ_PRIVACY_ANCHOR = 'do-you-keep-my-writing'

export const FAQS: Faq[] = [
  {
    id: 'what-does-deepclario-do',
    q: 'What does Deepclario do?',
    a: `It checks the sources in a piece of writing. You paste your document. We find the sentences that cite something, open each link, and tell you whether that page really says what your sentence says.`,
  },
  {
    id: FAQ_PRIVACY_ANCHOR,
    q: 'Do you keep my writing?',
    a: `No. We never save it. To do the work we send it to OpenAI, which finds the claims and reads the pages we fetch. When a claim names a source but does not link to it, that one sentence also goes to Tavily so we can search for the page. In our own database we store a single row saying a check happened. It holds your account id and nothing else.`,
  },
  {
    id: 'how-do-you-check-a-link',
    q: 'How do you check a link?',
    a: `We open the page and look for your exact number in it. Then we show you the sentence we found around that number, so you can judge it yourself. The quote is cut straight from the page, so it always contains the number and we cannot reword it into something the page did not say.`,
  },
  {
    id: 'what-if-you-are-wrong',
    q: 'What if you are wrong about my source?',
    a: `We can be wrong, and you should be able to see when we are. We never say a page fails to support your claim without showing you a sentence from that page. If the quote does not match what we said about it, trust the quote. Send us the link at support@deepclario.com and we will look at it.`,
  },
  {
    id: 'why-could-you-not-read-a-page',
    q: 'Why did you say you could not read one of my pages?',
    a: `A few reasons. The page is behind a paywall. The link is dead. The page only shows current data, so the number a reader sees today is not the one you wrote. Or the page came back too short to be a real page, which usually means it blocked us. This is our limit, not a judgement on your writing, and your reader may still get in.`,
  },
  {
    id: 'why-only-so-many-statements',
    q: `Why did you only check ${MAX_CLAIMS_PER_DOC} statements?`,
    a: `${MAX_CLAIMS_PER_DOC} is the most we check in one document. It keeps the cost and the wait predictable. We tell you how many links the whole document has, so you can see how much was left over. If you need more of it checked, send it in sections.`,
  },
  {
    id: 'what-is-free',
    q: 'What is free and what costs money?',
    a: `Without an account you can run ${ANON_FACTCHECK_MONTH.capacity} checks a month, and we do not ask for anything. An account gives you ${FACTCHECK_FREE_LIMIT} a month plus your history. Pro is ${PRO_FACTCHECK_LIMIT} checks a month for $${PRICE_LIST}, or $${PRICE_FOUNDING} a month for good if you are one of the first ${FOUNDING_SEAT_COUNT} people to subscribe.`,
  },
  {
    id: 'no-links',
    q: 'Does it work if my writing has no links?',
    a: `Partly. We still find the sentences that read like facts, and we list the ones with no source at all. On the articles we tested, that was often the biggest group. There is nothing for us to open, so nothing gets checked against a page, and a run that checks nothing does not count against your allowance.`,
  },
  {
    id: 'can-i-give-you-a-url',
    q: 'Can I give you a web address instead of pasting text?',
    a: `No. You have to paste the text. We decided against it for now for one reason: a web page is full of links in its menus, footers and adverts, and we would report those as if they were sources you had chosen.`,
  },
]
