// Verifies a Supabase session JWT from the Authorization header.
// Throws a 401 Response if the token is missing or invalid.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { User } from 'jsr:@supabase/supabase-js@2'

export async function getUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return data.user
}
