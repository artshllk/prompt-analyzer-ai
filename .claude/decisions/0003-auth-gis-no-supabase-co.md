# 0003 — Auth uses Google Identity Services, not Supabase OAuth redirect

## Context

The original Google sign-in used `supabase.auth.signInWithOAuth`, which redirected
through `<ref>.supabase.co`. That made the Google consent screen say "continue to
…supabase.co" instead of Deepclario, which looks untrustworthy and off-brand. The
constraint was to fix this **for free** (no Supabase Pro), keeping Supabase as the
database and session store.

## Decision

Use **Google Identity Services (GIS)** against our own Google OAuth Web client,
then hand the Google ID token to `supabase.auth.signInWithIdToken`.

- The consent screen now shows **our** client, branded "Deepclario", never
  supabase.co, because Google never redirects to supabase.co. The browser talks to
  Google and to Supabase directly.
- Supabase still mints a normal session from the verified ID token, so **all
  downstream RLS / `auth.uid()` / history / insights / billing / extension code is
  unchanged.**
- Nonce per Supabase docs: SHA-256 hashed nonce to Google; raw nonce to `signInWithIdToken`.
- Magic-link (`signInWithOtp`) is untouched and still lands on our domain.

Files: `src/app/(auth)/login/GoogleSignIn.tsx`, `src/app/(auth)/login/page.tsx`.
Env: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Why

Removes the supabase.co branding leak on the consent screen at zero extra cost,
without swapping the auth provider or touching the session/RLS model.

## Tradeoff (accepted)

GIS uses a Google popup / One Tap instead of a full-page redirect (arguably better
UX). It needs the GIS script from accounts.google.com and JavaScript enabled.

## Dashboard setup (only Art can do; not code)

Google Cloud OAuth client with `deepclario.com` + `localhost:3000` as authorized
JS origins; consent screen branded and published to Production; the client ID
added to Supabase → Auth → Providers → Google → Authorized Client IDs; and
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in `.env.local` and Vercel.

Full history and the options that were rejected: `.claude/architecture/auth.md`.
