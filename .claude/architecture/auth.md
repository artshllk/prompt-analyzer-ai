<!-- Relocated from the repo root into .claude/architecture/. The chosen
     decision is summarized in .claude/decisions/0003-auth-gis-no-supabase-co.md;
     this file is the full record and the options that were considered. -->

# Authentication Architecture & Decision Record

**Status:** Implemented — Google Identity Services + `signInWithIdToken` (see §3b).
**Date:** 2026-07-02 (session-persistence investigation appended 2026-07-03)
**Owner:** Deepclario

---

## 0. Session-persistence investigation (2026-07-03)

Symptom: users forced to re-authenticate repeatedly, worst in local dev.
Verdict after full audit: **the architecture is sound.** Cookie-based
`@supabase/ssr` auth is the standard pattern; every re-auth had one of four
concrete causes:

1. **Proxy dropped rotated refresh-token cookies on redirects** (code, fixed
   in PR #29). Every session died ~1h after login and was unrecoverable.
   Browsers that signed in before the fix still hold revoked tokens — those
   users (including you on localhost) must sign in once more; after that it
   sticks. Clearing `sb-*` cookies for the site has the same effect.
2. **Magic links opened outside the requesting browser fail PKCE.** The
   emailed link carries a `?code=` that only exchanges against a
   `code_verifier` cookie stored where the link was requested. Email apps
   with built-in viewers, or requesting on localhost and Supabase
   redirecting to the production Site URL (see 3), hit "PKCE code verifier
   not found". Fix is config: switch the magic-link email template to the
   `token_hash` form (below) — the callback already supports it and it works
   in ANY browser, eliminating this failure class entirely.
3. **Local dev callback not allow-listed.** If
   `http://localhost:3000/auth/callback` is missing from Supabase's
   Redirect URLs, links requested on localhost bounce to the production
   Site URL where no verifier cookie exists → PKCE error → retry → email
   rate limit. This chain reproduces every reported symptom in local dev.
4. **Raw Supabase errors + lost destinations amplified the pain** (code,
   fixed): the auth-error page now shows human copy per failure mode, and
   the login page honors `?next=` (extension connect flow) in addition to
   `?redirectTo=`.

Extension ruled out: it holds only `storage` permission, runs on chat sites,
never touches deepclario.com cookies, and its API tokens never expire (only
explicit revocation). Connection codes fail only when the web session does.

### Dashboard checklist (only you can do these)

- **Supabase → Authentication → Email Templates → Magic Link:** replace the
  `{{ .ConfirmationURL }}` link with
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard`.
  This makes links work in any browser/device (kills cause 2). The callback
  route already handles `token_hash` + `type`. **Also add the 6-digit code
  `{{ .Token }}` to the template body** (e.g. "Your sign-in code: {{ .Token }}") —
  the login page's sent screen now has a code field that signs the user in
  on the spot via `verifyOtp`, no inbox link-click needed. Until the
  template includes `{{ .Token }}`, the code field has nothing to match and
  users should use the link.
- **Supabase → Authentication → URL Configuration → Redirect URLs:** add
  `http://localhost:3000/auth/callback` alongside
  `https://deepclario.com/auth/callback` (kills cause 3).
- **Google Cloud → Credentials → OAuth client → Authorized JavaScript
  origins:** ensure `http://localhost:3000` is present so Google sign-in
  (GIS + One Tap) works in dev.
- **Supabase → Project Settings → Auth → SMTP (optional):** auth emails
  currently go through Supabase's built-in sender, which is capped at a
  handful of emails per hour and enforces the ~60s per-address cooldown.
  Pointing it at Resend (already used for product email) lifts the hourly
  cap and makes the cooldown configurable under Auth → Rate Limits. The
  login page now treats the cooldown as "link already sent - check your
  inbox" rather than an error, so this is optional polish, not a fix.
- Optional, dev quality-of-life: in `.env.local` set
  `NEXT_PUBLIC_APP_URL=http://localhost:3000` (currently the production
  URL). Auth is unaffected (the callback prefers `x-forwarded-host`,
  verified), but Paddle checkout/portal redirects currently send you to
  production from a dev session.

---

## 1. The real problem (diagnosed)

Users reported seeing a "long encoded / suspicious URL" during Google Sign-In. The
exact symptom is the text on **Google's own consent screen**:

> Sign in with Google — *to continue to `hsotondkuxcwahskwnqf.supabase.co`*

That string is **not** a bug in our code. Google displays the **authorized domain of
the OAuth client**, and our OAuth client is currently registered against the raw
Supabase project domain (`<project-ref>.supabase.co`). So at the most important trust
moment in the funnel — the instant the user decides whether to hand over their Google
identity — they see a random-looking machine domain instead of "Deepclario."

### What is NOT the problem
- Our callback route (`src/app/auth/callback/route.ts`) is correct: it uses PKCE
  (`exchangeCodeForSession`), sets httpOnly cookies, handles OTP + OAuth + errors, and
  never leaves tokens in the URL.
- We are on the secure `@supabase/ssr` flow. No implicit-grant `#access_token=` in the
  address bar.
- Magic-link (`signInWithOtp`) already lands users on our own domain.

**Conclusion:** This is a branding/config problem, not an architecture problem. The fix
is to change what domain the Google OAuth client presents — not to replace Supabase Auth.

---

## 2. How Google decides what domain to show

Google shows the domain of the **redirect URI / authorized domain** configured on the
OAuth 2.0 Client. Today the redirect URI is:

```
https://hsotondkuxcwahskwnqf.supabase.co/auth/v1/callback
```

To make Google say **"to continue to deepclario.com"**, that callback must live on a
domain we control. There are two supported ways to achieve this — one free, one paid.

---

## 3. Options considered

### Option A — Keep Supabase Auth, brand the OAuth client (RECOMMENDED)

Two sub-paths depending on budget:

**A1 — Custom OAuth on our domain via Supabase Custom Auth Domain (paid, cleanest).**
Supabase Pro's *Custom Domain* add-on lets the auth server answer on
`auth.deepclario.com`. Google then shows "to continue to **deepclario.com**." This is
the only 100% clean solution where no Supabase string appears anywhere.

**A2 — Verify + rebrand the Google consent screen (free, ~90% of the benefit).**
Even without a custom domain, the Google OAuth *consent screen* can display our app
name, logo, and authorized domain. The "continue to supabase.co" line comes from the
authorized domain field; setting the consent screen to **Production** with
`deepclario.com` as an authorized domain and a verified logo dramatically reduces the
"suspicious" feeling. The `.supabase.co` callback still exists under the hood but is far
less prominent once the app is branded and verified.

| Dimension | Assessment |
|---|---|
| Pros | No migration; keeps unified DB + Auth + RLS; keeps Google **and** magic-link |
| Cons | A2 leaves a faint Supabase reference; fully clean requires A1 (Pro) |
| Dev complexity | Low (config + one interstitial page) |
| Cost | A2: **$0**. A1: ~$25/mo (Supabase Pro) |
| Security | Already strong: PKCE, httpOnly cookies, RLS on `auth.uid()` |
| UX | Near-seamless; A1 is flawless |
| Scalability | Excellent — standard SaaS setup |

### Option B — Supabase as DB only, replace Auth (Auth.js / NextAuth)
| Dimension | Assessment |
|---|---|
| Pros | Total control of every screen/redirect; no `supabase.co` anywhere |
| Cons | **Loses RLS tied to `auth.uid()`** — every policy and every authed query
  (`prompts`, `insights`, `history`, `account/delete`, extension token issuance) must be
  rewritten and re-secured |
| Dev complexity | High (days–week), high risk in working code |
| Cost | $0 library, high engineering cost |
| Security | We now own session security end-to-end |
| UX | Same end result as Option A, far more work |
| Verdict | **Not justified by a consent-screen string** |

### Option C — Custom email/password
Inherits password hashing, reset flows, and breach liability for a **worse** UX than
what we already ship. Rejected.

### Option D — Alternative provider (Clerk / Auth0 / WorkOS)
Clerk (native on Vercel Marketplace) gives polished hosted flows and no `supabase.co`
flash, free to ~10k MAU. But it's a second vendor holding our users and we'd still
bridge Clerk → Supabase RLS. **Reconsider only if we later need orgs / SSO / enterprise.**
Overkill for today's problem.

### Option E — Magic link / passwordless
**Already implemented** (`signInWithOtp`) and it's our strongest trust path: no password,
lands on our domain. Keep as a co-primary option.

### Option F — Remove auth for some features
**Already done correctly** — `/api/anon/analyze` and the detector are anonymous. Auth
gates only history/insights/billing. Keep and extend the anonymous funnel so users reach
value before ever seeing a login screen.

---

## 3b. IMPLEMENTED: GIS + signInWithIdToken (removes supabase.co, free)

Chosen and built. We replaced `supabase.auth.signInWithOAuth` (which redirected
through `<ref>.supabase.co`, causing Google to say "continue to …supabase.co") with
**Google Identity Services (GIS)** running against our **own** Google OAuth Web client,
then hand the Google ID token to `supabase.auth.signInWithIdToken`.

- The Google consent screen now shows **our** client (branded "Deepclario"), never
  supabase.co, because Google never redirects to supabase.co — the browser talks to
  Google and to Supabase directly.
- Supabase still mints a normal session from the verified ID token, so **all downstream
  RLS / `auth.uid()` / history / insights / billing / extension code is unchanged.**
- Nonce is handled per Supabase docs: SHA-256 hashed nonce → Google; raw nonce →
  `signInWithIdToken`.
- Magic-link (`signInWithOtp`) is untouched and still lands on our domain.

Files: `src/app/(auth)/login/GoogleSignIn.tsx` (new), `src/app/(auth)/login/page.tsx`
(wired in, old redirect button + overlay removed), `.env.example`
(`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

### Required dashboard setup (only you can do)
1. **Google Cloud Console → Credentials → OAuth 2.0 Client (Web application).**
   Reuse or create one. Authorized JavaScript origins: `https://deepclario.com` and
   `http://localhost:3000`. (No redirect URI needed for the GIS token flow.)
2. **Google Cloud Console → OAuth consent screen.** App name **Deepclario**, logo,
   `deepclario.com` authorized domain, publish to **Production**. This is now *your*
   client, so this branding is what the user actually sees.
3. **Supabase → Authentication → Providers → Google.** Enable it and paste the Client ID
   from step 1 into **Authorized Client IDs**. (Secret not required for the ID-token flow.)
4. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and in Vercel env vars.

### Tradeoff (accepted)
GIS uses a Google popup / One Tap instead of a full-page redirect — arguably better UX
(no navigation). It requires the GIS script from `accounts.google.com` and JS enabled.

## 4. Recommendation

**Stay on Supabase (free).** Migrating solves a problem we don't have and reintroduces
risk into code that already works. Do the free branding fixes first; upgrade to Pro's
custom domain only if the residual Supabase reference still bothers us after that — that
is the *one* legitimate business reason to pay.

---

## 5. Implementation plan

### Phase 1 — Free, do now
1. **Google Cloud Console → OAuth consent screen**
   - Set app name = **Deepclario**, upload logo, set support + developer email.
   - Add **`deepclario.com`** under *Authorized domains*.
   - Move the app from *Testing* to **Production** (removes scary unverified warnings).
2. **Google Cloud Console → Credentials → OAuth Client**
   - Confirm authorized redirect URI matches the Supabase callback exactly.
   - Confirm *Authorized JavaScript origins* include `https://deepclario.com`.
3. **Supabase → Authentication → URL Configuration**
   - Site URL = `https://deepclario.com`; redirect allow-list limited to our domains.
4. **Branded departure overlay** — DONE in this repo. On Google click / email
   submit the login page shows a full-screen Deepclario overlay ("Taking you to
   Google…") so the last frame on our domain is on-brand. The return hop stays in
   the server route handler (`src/app/auth/callback/route.ts`), which is instant and
   cookie-safe, so no unstyled flash occurs. Microcopy under the Google button now
   reassures users their Google password is never seen.

### Phase 2 — Optional, paid ($25/mo)
5. Enable **Supabase Pro Custom Domain** → `auth.deepclario.com`. Re-point the Google
   OAuth redirect URI to the custom domain. Google now shows "continue to deepclario.com."

### Phase 3 — Code polish (this repo) — DONE
6. Branded departure overlay + reassurance microcopy on the login page (see Phase 1.4).
7. Keep the anonymous playground funnel prominent so most users reach value pre-login.

---

## 5b. Dashboard checklist to remove / de-emphasize the `supabase.co` text

These are the steps only you can do (I can't reach the Google or Supabase dashboards).
The consent-screen branding (Phase 1) is what actually changes what Google shows.

### Google Cloud Console — OAuth consent screen (this is the fix)
1. Go to **console.cloud.google.com** → select the project holding this OAuth client.
2. **APIs & Services → OAuth consent screen.**
   - User type: **External**.
   - App name: **Deepclario**  ← this replaces the scary machine string in the header.
   - User support email: your support address.
   - App logo: upload the Deepclario logo (triggers Google verification; worth it).
   - App domain → Application home page: `https://deepclario.com`.
   - Authorized domains: add **`deepclario.com`**.
   - Developer contact email: your email.
3. **Scopes:** keep only `email`, `profile`, `openid` (matches "we only use name + email").
4. **Publishing status:** click **Publish app** → move from *Testing* to **In production**.
   This removes the "Google hasn't verified this app" warning, the most alarming part.
5. If Google requires verification for the logo/branding, submit it — approval makes the
   consent screen show your logo + "Deepclario" prominently.

> After this, the screen reads "Sign in with Google to continue to **Deepclario**" with
> your logo. A small `supabase.co` reference may remain as the technical redirect host on
> the free plan; Phase 2 removes it entirely.

### Google Cloud Console — Credentials
6. **APIs & Services → Credentials → your OAuth 2.0 Client ID.**
   - Authorized JavaScript origins: `https://deepclario.com` (and `http://localhost:3000`).
   - Authorized redirect URIs: must include the Supabase callback exactly:
     `https://<project-ref>.supabase.co/auth/v1/callback`.

### Supabase Dashboard
7. **Authentication → URL Configuration.**
   - Site URL: `https://deepclario.com`.
   - Redirect URLs (allow-list): `https://deepclario.com/auth/callback`,
     `http://localhost:3000/auth/callback`.
8. **Authentication → Providers → Google:** confirm the Client ID / Secret from step 6.

### Phase 2 (optional, ~$25/mo) — fully remove `supabase.co`
9. Supabase → **Project Settings → Custom Domains** → enable, set `auth.deepclario.com`
   (add the CNAME it gives you at your DNS provider).
10. Re-point the Google **Authorized redirect URI** (step 6) to
    `https://auth.deepclario.com/auth/v1/callback`.
11. Update Supabase Site URL if needed. Google now shows only `deepclario.com`.

---

## 6. Cost summary

| Path | Monthly cost | Consent screen shows |
|---|---|---|
| Phase 1 only (free) | **$0** | Branded Deepclario app; faint supabase.co reference |
| Phase 1 + 2 (Pro) | **~$25** | "continue to **deepclario.com**", fully clean |

---

## 7. Security posture (unchanged, already good)
- PKCE authorization-code flow (`exchangeCodeForSession`) — no tokens in URL.
- Session in httpOnly cookies via `@supabase/ssr`.
- Row Level Security keyed to `auth.uid()`.
- Anonymous endpoints scoped and rate-limited separately.

No security regression in the recommended path; Options B/C would *add* security surface
we'd have to own.
