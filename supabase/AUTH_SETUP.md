# Auth setup - production checklist

Three items only require dashboard config (can't be done from code). Do these once and the auth UX matches the experience the redesigned `/login` page implies.

---

## 1. Disable mandatory email confirmation

**Dashboard → Authentication → Providers → Email**

- **Confirm email**: turn this **OFF**.
  - Magic links are themselves an email-verification primitive: clicking the link proves the user owns the inbox. A second confirmation step adds friction with no security gain.
  - For Google OAuth, Google has already verified the email - no second confirmation needed either.
- **Secure email change**: keep ON.

---

## 2. Google OAuth (the primary login method)

**Dashboard → Authentication → Providers → Google**

1. In Google Cloud Console: APIs & Services → Credentials → **Create OAuth client ID** → Web application.
2. Authorized JavaScript origins: `http://localhost:3000`, your production URL.
3. **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase's callback, not yours).
4. Copy the Client ID + Secret into the Supabase Google provider config.
5. Enable.

You **must** also have an OAuth consent screen configured (External, with at least the basic app name + support email) or Google blocks the flow.

---

## 3. URL configuration

**Dashboard → Authentication → URL Configuration**

| Field                     | Local                                 | Production                              |
| ------------------------- | ------------------------------------- | --------------------------------------- |
| Site URL                  | `http://localhost:3000`               | `https://your-domain.com`               |
| Redirect URLs (allowlist) | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

Anything not on the allowlist gets rewritten to Site URL - this is the #1 cause of "the magic link goes to the wrong page."

---

## 4. Custom SMTP via Resend (production only)

The default Supabase SMTP works for testing but emails frequently land in spam, and the `From:` address can't be branded. Switch to **Resend** before public launch.

### Steps

1. **Create Resend account** → resend.com (free tier: 3,000 emails/month, plenty for early stage).
2. **Add and verify your domain.** Resend will show you the DNS records to add:
   - `SPF` (TXT) - authorizes Resend to send from your domain
   - `DKIM` (CNAME × 3) - signs outgoing mail
   - `DMARC` (TXT) - tells receiving servers what to do with unsigned mail
3. **Generate an API key** in Resend → Settings → API Keys.
4. **Configure SMTP in Supabase**: Dashboard → Project Settings → Auth → SMTP Settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `<your Resend API key>`
   - Sender email: `hello@yourdomain.com` (must be on the verified domain)
   - Sender name: `Deepclario`
5. **Save** and send yourself a test sign-in link from `/login`.

### Email template

**Dashboard → Authentication → Email Templates → Magic Link** → paste contents of `supabase/templates/sign-in-link.html`.
Set the Subject field to `Your Deepclario sign-in link` (not the default "Your Magic Link").
(Supabase's dashboard labels this template "Magic Link" internally; that label is not user-facing.)
The template is table-based so it renders correctly in Gmail (which strips most modern CSS).

### Verify deliverability

Send a magic link to a Gmail address. Open the email → "Show original" → check:

- **SPF: PASS**
- **DKIM: PASS**
- **DMARC: PASS**

If any fail, Resend's dashboard shows the exact DNS record that's wrong.

---

## 5. Environment variables

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service key>      # never expose to client
GEMINI_API_KEY=<gemini key>
STRIPE_SECRET_KEY=<stripe key>
STRIPE_WEBHOOK_SECRET=<webhook secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe public key>

# Optional - enables Sentry when set
NEXT_PUBLIC_SENTRY_DSN=
```

Mirror these in Vercel → Project Settings → Environment Variables.

---

## 6. Verify the redesigned flow

1. `npm run dev`
2. Open `/playground` while signed out → 2 free analyses, then signup gate.
3. Click "Continue with Google" → Google consent → bounces back to `/auth/callback` → lands on `/playground` (or wherever `redirectTo` was set).
4. Open `/login` directly → Google button is the primary CTA; "Or sign in with email" is a secondary disclosure.
5. Magic link path: enter email → check inbox → branded email from `hello@yourdomain.com` → click link → lands signed in.
6. Failed/expired links land on `/auth/auth-error` with a real message instead of a 404.

---

## What this unlocks

- Anonymous trial → first 2 analyses without signup → soft signup wall after value is shown.
- Google OAuth as primary, email magic link as a tucked-away fallback.
- No email confirmation friction - magic link is the verification.
- Branded emails from your own domain, delivered to the inbox not spam.
- Account deletion endpoint at `POST /api/account/delete`.
- Per-IP rate limit on anonymous traffic, per-user burst limit on the authenticated endpoint.
