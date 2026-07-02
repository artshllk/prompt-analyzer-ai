# Supabase email templates

Supabase serves auth emails from its **dashboard**, not from this repo. These
files are the source of truth to copy from; editing them does nothing until you
paste them into the dashboard.

## Magic link / sign-in link

Dashboard path: **Authentication → Emails → Templates → "Magic link or OTP"**
(Supabase labels it "Magic link" internally; no user-facing copy uses that term.)

1. Open the **Magic link or OTP** template.
2. Set **Subject** to: `Your Deepclario sign-in link`
3. Replace the **Message body** with the full contents of
   [`sign-in-link.html`](./sign-in-link.html).
4. Save, then send a test link from `/login`.

Available template variables:
- `{{ .ConfirmationURL }}` sign-in link target (hits `/auth/callback`)
- `{{ .Token }}` 6-digit OTP fallback
- `{{ .Email }}` recipient email
- `{{ .SiteURL }}` configured Site URL
