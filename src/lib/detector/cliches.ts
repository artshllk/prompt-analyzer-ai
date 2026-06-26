/**
 * AI-cliché phrase detection.
 *
 * These are phrases LLM-generated text reaches for far more than human
 * text does. The list is curated from public research + corpora analysis
 * of GPT-4/Claude/Gemini output. None of them are wrong on their own -
 * a human can absolutely use "delve" or "navigate the landscape" - but
 * a *density* of them in a short passage is a real signal.
 *
 * The verdict copy always reflects this: we flag the *density*, never
 * a single word.
 */

export const AI_CLICHE_PATTERNS: { phrase: string; weight: number }[] = [
  // Strong signals - phrases that almost only show up in LLM output
  { phrase: 'delve into',                weight: 3 },
  { phrase: 'navigate the',              weight: 2 },
  { phrase: 'navigate the complexities', weight: 4 },
  { phrase: 'in the realm of',           weight: 3 },
  { phrase: 'in the world of',           weight: 2 },
  { phrase: 'in today\'s fast-paced',    weight: 4 },
  { phrase: 'in today\'s digital age',   weight: 4 },
  { phrase: 'in conclusion,',            weight: 2 },
  { phrase: 'it is important to note',   weight: 3 },
  { phrase: 'it\'s important to note',   weight: 3 },
  { phrase: 'it is worth noting',        weight: 3 },
  { phrase: 'it\'s worth noting',        weight: 3 },
  { phrase: 'it\'s crucial to',          weight: 2 },
  { phrase: 'it is crucial to',          weight: 2 },
  { phrase: 'leverage',                  weight: 1 },
  { phrase: 'leveraging',                weight: 1 },
  { phrase: 'embark on',                 weight: 2 },
  { phrase: 'tapestry',                  weight: 3 },
  { phrase: 'unleash',                   weight: 2 },
  { phrase: 'plethora',                  weight: 2 },
  { phrase: 'multifaceted',              weight: 2 },
  { phrase: 'paradigm',                  weight: 1 },
  { phrase: 'paradigm shift',            weight: 2 },
  { phrase: 'comprehensive understanding', weight: 2 },
  { phrase: 'crucial role',              weight: 2 },
  { phrase: 'pivotal role',              weight: 2 },
  { phrase: 'foster',                    weight: 1 },
  { phrase: 'fostering',                 weight: 1 },
  { phrase: 'streamline',                weight: 1 },
  { phrase: 'streamlining',              weight: 1 },
  { phrase: 'cutting-edge',              weight: 2 },
  { phrase: 'state-of-the-art',          weight: 2 },
  { phrase: 'game-changer',              weight: 2 },
  { phrase: 'a testament to',            weight: 3 },
  { phrase: 'remember that',             weight: 1 },
  { phrase: 'it\'s essential to',        weight: 2 },
  { phrase: 'it is essential to',        weight: 2 },
  { phrase: 'whether you\'re',           weight: 1 },
  { phrase: 'as we\'ve seen',            weight: 1 },
  { phrase: 'unlock the potential',      weight: 3 },
  { phrase: 'harness the power',         weight: 3 },
  { phrase: 'ever-evolving',             weight: 3 },
  { phrase: 'ever-changing',             weight: 2 },
  { phrase: 'dive deep',                 weight: 2 },
  { phrase: 'in summary',                weight: 1 },
  { phrase: 'to sum up',                 weight: 1 },
  { phrase: 'overall,',                  weight: 1 },
  { phrase: 'furthermore,',              weight: 1 },
  { phrase: 'moreover,',                 weight: 1 },
  { phrase: 'additionally,',             weight: 1 },
  //TODO: add more phrases from research and corpora analysis (e.g. AI large dash symbol "—") 
]

export type ClicheHit = { phrase: string; weight: number; index: number }

export function findCliches(text: string): ClicheHit[] {
  const lower = text.toLowerCase()
  const hits: ClicheHit[] = []
  for (const { phrase, weight } of AI_CLICHE_PATTERNS) {
    let from = 0
    while (true) {
      const idx = lower.indexOf(phrase, from)
      if (idx === -1) break
      hits.push({ phrase, weight, index: idx })
      from = idx + phrase.length
    }
  }
  return hits
}
