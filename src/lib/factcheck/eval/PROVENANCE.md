# Why the numbers in this directory cannot be trusted yet

Two corpora live here and neither can currently measure the product. Written
down because both looked like measurements and both were not.

## corpus.ts — synthetic, 16 fixtures

Every claim, every source and every expected answer was written by hand. It is
a regression guard: it catches a judge that starts flagging near-misses.

**It scored 16/16 with a false-defect rate of zero while the same code produced
a 32% false-accusation rate against hand verification on real pages.** It could
not have caught a single one of the causes, because the sources are clean
English prose with no markup, no paywall, no history and no junk.

Never quote its numbers as a rate.

## real-citations.json — real sources, but self-graded and truncated

59 claims from six published articles, with the pages we fetched frozen
alongside. Two defects make it unusable for scoring as it stands.

**It grades itself.** The `observed` field is the judge's own verdict from the
run that produced it. Scoring against that reports perfect agreement, because
the answer key is a copy of the answers. Every entry is marked
`provenance: "audit-observed"` and `verified: null`, and
`assertNotSelfMeasuring()` throws on both.

**The frozen sources are cut to 12,000 characters while the judge reads
24,000.** So the stored fixture is half a page, and any claim whose supporting
sentence sat past 12,000 was judged against a page that had been cut before it.
**16 of the 39 flags in the audit are affected.** That is a defect in this file's
format, not in the product, and it invalidates those flags as evidence either
way. `sourceTruncatedAt` records it on every row.

## What a corpus that could measure this needs

1. **Held out.** Claims from articles the audit never touched. The six already
   used are burnt: their verdicts are in this file and in the reports.
2. **Full sources.** Frozen at whatever the judge actually reads, never less.
3. **Human verdicts.** `verified` set by a person who opened the link, not by
   the judge, and not by whoever wrote the fixture.
4. **Real pages.** Including paywalled ones, JavaScript ones, and dead ones,
   because those are where every real failure has come from.

Until those four hold, this directory reports "not obviously broken" and
nothing else.

## The paywall rate we were measuring was inflated by a bug

Added 2026-09-02, because the `source_unreachable` rate has been informing
product decisions and roughly two fifths of it was not real.

The gate detector tested `/\*{3,}/` against the retrieved page. That was meant
to catch Statista, which renders a masked figure as `***`. It also matches
`***bold italic***` and a `***` horizontal rule, both of which are ordinary
markdown and appear on most extracted pages.

Measured both ways over this corpus:

| | readable | paywalled |
| --- | --- | --- |
| frozen sources, before | 37 (63%) | 22 (37%) |
| frozen sources, after  | 44 (75%) | 15 (25%) |
| live re-fetch, before  | 23 (53%) | 20 (47%) |
| live re-fetch, after   | 31 (72%) | 12 (28%) |

**On live text, 8 of 43 sources, 19%, were called paywalled when they were
fully readable, and the paywalled rate falls from 47% to 28%.** The live number
is the one to use: the frozen sources are cut to 12,000 characters while the
pipeline reads 24,000, so the frozen copy simply has fewer characters in which
to find a stray asterisk, and it undercounts.

The hosts affected were ahrefs.com, sparktoro.com, seerinteractive.com,
searchenginejournal.com, demandsage.com and wyzowl.com. Every one an ordinary
readable blog.

Any coverage figure quoted from before this date is wrong in the same
direction: it understates how much of the web we can actually read.
