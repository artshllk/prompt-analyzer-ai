# Flags by cause

The raw flag rate from the first audit was 66%, which is not a measurement of
anything useful. This splits it. The number the product lives or dies on is the
writer's-error class: a citation that did not support its claim on the day it was
published.

| Publisher | Published | Claims | Flags | Context mismatch | Figure absent | Decay | Live dashboard | Our fault | Unknown |
|---|---|---|---|---|---|---|---|---|---|
| ahrefs.com | 2026-06 | 12 | **3** | 1 | 0 | 0 | 1 | 0 | 1 |
| semrush.com | 2024-04 | 14 | **14** | 4 | 6 | 3 | 0 | 0 | 1 |
| backlinko.com | 2023-03 | 12 | **5** | 1 | 3 | 0 | 1 | 0 | 0 |
| sproutsocial.com | 2026-02 | 13 | **9** | 2 | 3 | 2 | 0 | 2 | 0 |
| wyzowl.com | unknown | 4 | **4** | 2 | 0 | 0 | 0 | 0 | 2 |
| demandsage.com | 2026-05 | 4 | **4** | 3 | 1 | 0 | 0 | 0 | 0 |

## What the causes mean

- **Context mismatch** the figure is on the page but attached to something else. The
  subject-swap class. A real defect, and the one a writer never spots by eye.
- **Figure absent** the figure is not on the live page and was not on the archived
  version from around publication either. A real defect.
- **Decay** the figure WAS on the page when the article was published and is not now.
  Not the writer's fault. Verified against Wayback snapshots.
- **Live dashboard** the source only ever shows current data. Now handled by
  live_source and never reaches a flag.
- **Our fault** the retrieved page was a consent wall or a stub. Now returns
  source_unreachable instead of a flag.

## The numbers

- Raw flag rate: **39/59 = 66.1%**
- Writer's-error class: **26/59 = 44.1%**
- Not the writer's fault: 9 (decay 5, live dashboard 2, our bug 2)
- Unknown: 4

## Decay is real but small

Decay explains 5 of 39 flags, about 13%. The hypothesis that most flags were decay
is not supported. Article age does matter, but publisher care matters more:

| | Claims | Raw flag rate | Writer's-error rate |
|---|---|---|---|
| Articles from 2026 | 29 | 55.2% | 34.5% |
| Articles from 2023-24 | 26 | 73.1% | 53.8% |

And by publisher, the spread is far wider than the spread by age:

| Publisher | Writer's-error rate |
|---|---|
| ahrefs.com | 8% (1/12) |
| semrush.com | 71% (10/14) |
| backlinko.com | 33% (4/12) |
| sproutsocial.com | 38% (5/13) |
| wyzowl.com | 50% (2/4) |
| demandsage.com | 100% (4/4) |

