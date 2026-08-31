# Pre-launch checklist

Run this yourself. It is ordered so a failure early stops you wasting time on
the rest. Nothing here needs a tool you do not already have.

Times are rough. The whole thing is about 45 minutes, and the phone section is
the half most likely to find something.

---

## 0. Before you touch anything (5 min)

- [ ] `git log --oneline -12` and confirm you recognise every commit.
- [ ] `npm test` passes. 62 tests, no network, a few seconds.
- [ ] `npm run build` succeeds with no new warnings.
- [ ] `npx tsc --noEmit` is clean apart from stale `.next/types`.
- [ ] Migration 011 status: still outstanding, and that is fine. 012, 013 and
      014 are already applied (verified 2026-08-31). See
      `docs/deploy-runbook.md`.

## 1. Set the cap for launch, not for a quiet Tuesday (2 min)

The default is 500 a day. My standing recommendation is 150. **For launch week
set it higher.**

- [ ] Vercel → project → Settings → Environment Variables → `ANON_DAILY_GLOBAL_CAP`,
      Production scope. **1500** for launch week.
- [ ] Redeploy. Vercel applies env changes to new deployments only.

Why: a few hundred arrivals at roughly a 40% try rate is 120 to 200 runs. At
150 you refuse the back half of your own launch. 1500 caps the worst case near
$30 for the week, which is the right number to be wrong about.

- [ ] Diary note: drop it back to 150 once the spike is over.

## 2. The link, before anyone clicks it (5 min)

This is what most people will see, and many will see *only* this.

- [ ] Paste `https://deepclario.com` into a Slack DM to yourself. The unfurl
      should show the marked-up prompt card with an amber chip and a blue one,
      both readable at that size.
- [ ] Paste it into WhatsApp or iMessage. Smaller crop. Still legible?
- [ ] Paste a blog post URL too, for example
      `https://deepclario.com/blog/how-ai-detectors-work`. Different card,
      same palette.
- [ ] Browser tab: the title reads "Deepclario - Turn a rough prompt into a
      great one" and the favicon is not the Next.js default.
- [ ] View source, `Ctrl+U`, and search for `twitter:site`. **There should be
      none.** If you have since created the account, add it back.

The share card renders in `system-ui`, not Bricolage. Known, deliberate, and
not worth a build-time font fetch this week.

## 3. The first second, as a stranger (5 min)

Use a **private window**, so you have no cookie and no localStorage.

- [ ] Load the homepage. Before typing anything, you should already see a
      finished example: a rough prompt on the left, a rewrite on the right
      with an amber span and a blue one, and the line **"3 added, 2 of them
      guesses"**.
- [ ] Click the × on an amber span. The text reflows and the count drops to
      "2 added, 1 of them a guess". No API call, no spinner.
- [ ] Now **disable JavaScript** (DevTools → Command palette → "Disable
      JavaScript") and reload. **The page must still be fully readable.** All
      text visible, nothing blank. This is the check that catches a reveal
      regression, and it is the one that used to fail.
- [ ] Re-enable JS. Scroll down slowly. Sections should fade up as they
      arrive, not all at once, and nothing should re-animate on the way back.

## 4. The tool, end to end (10 min)

Still in a private window.

- [ ] Click a sample chip and send. You get either a question with two or
      three readings, or a rewrite.
- [ ] Send `write about coffee`. You should get **one** question with clickable
      readings and **no text box**.
- [ ] Click a reading. You get a rewrite with labelled spans and a count.
- [ ] Click the **already-good chip** (the long "Summarise this quarterly sales
      report" one). You should get **"Nothing to change. This one is already
      clear."** and no rewrite. This is the behaviour nobody else has and it is
      invisible unless you go looking.
- [ ] Copy the rewrite. Paste it somewhere. **No `⟦` or `⟧` characters
      anywhere.**
- [ ] Do a third run, then a fourth. The fourth should offer an account, not an
      error.
- [ ] Sign in. Improve something. Check `/history` shows it. This never worked
      from the website before this release.

## 5. On a phone (10 min, do not skip)

Launch traffic is mostly mobile and this is where the old design simply hid
itself.

Use a **real phone**, not the simulator. Safari on iOS and Chrome on Android
behave differently and the simulator lies about both.

- [ ] Load the homepage on a phone. The tool is visible without scrolling
      sideways. **Nothing scrolls horizontally, anywhere.**
- [ ] The worked example: the two panels **stack**, they do not sit in two
      squeezed columns.
- [ ] Tap the × on an amber span with your thumb, not a fingernail. It should
      hit first time. If you miss, tell me and I will grow the target again.
- [ ] Tap into the composer. The keyboard should not cover the send button.
- [ ] Send a prompt. The reading buttons are full width and comfortably
      tappable.
- [ ] Rotate to landscape and back. Nothing overlaps.
- [ ] Sample chips: they truncate to one line each. If one wraps to four
      lines it stops looking tappable.
- [ ] Check `/pricing` and one blog post. Body text is comfortably readable
      without pinch-zoom.
- [ ] In iOS Settings → Accessibility → Motion → **Reduce Motion on**, reload.
      Nothing should animate, and everything should still be visible.

## 6. Colour, in daylight (3 min)

The palette was checked with a contrast calculator, not with eyes.

- [ ] Take the phone outside or to a window. The amber guess text on its tint
      should still be readable. It measures 5.01:1, which is comfortably AA,
      but glare is the real test.
- [ ] Confirm the amber and the blue are still obviously **different colours**
      to you at chip size. If they read as "two highlights" rather than "two
      meanings", that is worth knowing before a few hundred people see it.

## 7. The cost guard, once, for real (5 min)

Do this **after** deploy, on the live site.

- [ ] Private window, improve one prompt.
- [ ] `select * from anon_daily_usage;` → today's date, `runs = 1`.
- [ ] Improve a prompt that asks a question, and answer it. `runs` goes to
      **2, not 3**. One user action, one unit.
- [ ] Signed in, improve one. `runs` does **not** move.

If the table is missing, migration 014 did not apply and every anonymous
visitor is being told to come back tomorrow.

## 8. The counters are recording (2 min)

Both migrations that feed this fail silently by design, so "no data" and
"wrong constraint" look identical.

```sql
select event, surface, count(*) from extension_events
where created_at > now() - interval '1 hour'
group by event, surface order by 1;
```

- [ ] **`tool_run` with `surface = 'web'` must be there.** If it is not, see
      the table in `docs/deploy-runbook.md` section 6b for which migration
      went wrong.

## 9. Things to have ready before you post the link

- [ ] The Supabase dashboard open, on `anon_daily_usage`.
- [ ] The Vercel logs tab open. Watch for `failing CLOSED` and
      `USAGE GATE DISABLED`. Either means the database is unhappy.
- [ ] Know how to raise `ANON_DAILY_GLOBAL_CAP`, and that it needs a redeploy.
- [ ] Decide in advance what you do if the model provider has an outage. The
      honest answer is that the tool says "the model did not come back" and
      nothing was charged. That is already the behaviour; just know it.

---

## Known and accepted, so nobody reports them as bugs

- The share card is in `system-ui`, not Bricolage.
- Pro users are refused during a Supabase outage, like everyone else. Free
  today because there are zero Pro users. See "when we have paying customers"
  in `CLAUDE.md`.
- The in-memory rate limiter is per instance, so the effective per-IP burst
  limit is higher than 30/hour under load. Deliberate: the daily ceiling is
  the real control.
- Migration 011 is unapplied and can stay that way.
