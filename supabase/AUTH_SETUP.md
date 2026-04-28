# Auth setup checklist

The 404 was caused by the callback URL mismatch in code (now fixed). The remaining items must be configured in the Supabase dashboard — they cannot be set from code.

## 1. URL configuration (required — fixes the 404 in production)

**Dashboard → Authentication → URL Configuration**

| Field | Local dev | Production |
|---|---|---|
| **Site URL** | `http://localhost:3000` | `https://your-domain.com` |
| **Redirect URLs** (allowlist, one per line) | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

Add **both** local and production redirect URLs to the allowlist if you switch between them. Anything not on the allowlist gets silently rewritten to Site URL — that's a common cause of "the link goes to the wrong place".

## 2. Email template (fixes Gmail rendering + "Log in" button copy)

**Dashboard → Authentication → Email Templates → Magic Link**

- Subject: `Your PromptCraft sign-in link`
- Message body: paste the contents of `supabase/templates/magic-link.html`

The default Supabase template uses an unstyled `<a>` and inline color that Gmail re-flows. The template in this repo uses table-based layout (the only thing Gmail reliably renders) and inline styles only.

## 3. Environment variables

`.env.local` (already created — fill in real values):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service key>   # never expose to the client
```

## 4. Google OAuth (optional)

**Dashboard → Authentication → Providers → Google**

1. Create OAuth credentials in Google Cloud Console
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase's URL, not yours)
3. Paste client ID + secret into Supabase

## 5. Verify the flow

1. `npm run dev`
2. Go to `/login`, enter your email
3. Check email — button should say **"Sign in to PromptCraft"**, not "Log in"
4. Click link → should land on `/dashboard` (or whatever `redirectTo` was)
5. If it fails, you'll land on `/auth/auth-error?reason=...` with the actual error visible

## Token expiry / replay

Magic links expire after 1 hour by default and are single-use. Expired/already-used links land on `/auth/auth-error` with a clear message rather than a 404.
