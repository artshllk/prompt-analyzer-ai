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
