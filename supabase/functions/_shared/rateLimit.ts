// Rate limiter for Edge Functions.
// Calls check_rate_limit_fn() via the service-role client so that the function
// runs with SECURITY DEFINER and can write the rate_limit table.
// Returns {allowed, remaining}; allowed:false means the (limit+1)th in-window call.

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Service-role client: bypasses RLS for the rate_limit table.
const serviceClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

export async function checkRateLimit(
  userId: string,
  bucket: string,
  limit = 30,
  windowSeconds = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  const { data, error } = await serviceClient.rpc('check_rate_limit_fn', {
    p_user_id: userId,
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    // Fail-open on infrastructure errors so a DB hiccup doesn't block users.
    console.error('rate_limit rpc error:', error.message)
    return { allowed: true, remaining: limit }
  }

  const row = Array.isArray(data) ? data[0] : data
  return {
    allowed: row?.allowed ?? true,
    remaining: row?.remaining ?? 0,
  }
}
