import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Cookie-less service-role client for background email work (cron,
 * next/server `after()`). The cookie-bound clients in lib/supabase
 * assume a request with a session; email jobs have neither.
 */
export function createEmailAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}
