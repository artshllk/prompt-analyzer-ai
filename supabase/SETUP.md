# Supabase setup - fixes the `PGRST205 / Could not find the table 'public.prompt_sessions'` error

The schema file in `supabase/migrations/001_initial_schema.sql` has not been applied to your Supabase project yet. Apply it once and the error goes away.

## Fastest path: copy/paste in the Supabase dashboard

1. Open your project → **SQL Editor** → **New query**
2. Paste the entire contents of [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql)
3. Click **Run**

That creates all 6 tables, RLS policies, the auto-create-profile trigger, and the `get_monthly_usage()` helper.

After running, refresh the schema cache (Settings → API → "Reload schema cache") or just wait ~10s - PostgREST notices new tables on its own.

## Verify it worked

In the SQL editor:

```sql
select count(*) from public.prompt_sessions;
-- should return 0, NOT an error
```

Or hit your dev server's `/playground` page - the `createSession error: PGRST205` log should be gone.

## CLI alternative (if you prefer)

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-ref>
supabase db push
```

## If you already have a partial schema

The migration uses `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`, so re-running it is safe. Existing data is preserved.
