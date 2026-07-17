---
name: "source-command-verify-blog"
description: "Verify blog changes — typecheck, stray-character scan, and dead internal-link scan"
---

# source-command-verify-blog

Use this skill when the user asks to run the migrated source command `verify-blog`.

## Command Template

Run the full blog verification suite and report results clearly. Do all of it,
then summarize pass/fail per check.

1. **Typecheck.** Run `npx tsc --noEmit -p tsconfig.json` and report any errors in
   `src/app/blog/**` or `src/lib/blog-posts.ts`. Ignore unrelated pre-existing
   errors elsewhere (e.g. stale `.next/types` for other routes), but say you did.

2. **Stray non-ASCII scan.** A Cyrillic look-alike character slipped into a function
   name once. Scan every blog page for Cyrillic:
   `grep -rlP '[А-Яа-яЁёІіЇїЄє]' src/app/blog/*/page.tsx`
   Report any file that matches (there should be none).

3. **Dead internal-link scan.** Every `href="/blog/<slug>"` must map to a real
   directory. Run:
   `grep -rhoE 'href="/blog/[a-z-]+"' src/app/blog/*/page.tsx | sed -E 's|href="/blog/([a-z-]+)"|\1|' | sort -u`
   then check each slug has a `src/app/blog/<slug>/` directory. Report any that do not.

4. **Registry sync (optional but useful).** Confirm any new `src/app/blog/<slug>/`
   directory has a matching entry in `src/lib/blog-posts.ts`, and vice versa.

Finish with a short summary: which checks passed, and a specific list of anything
that needs fixing. Do not commit anything — this is verification only.
