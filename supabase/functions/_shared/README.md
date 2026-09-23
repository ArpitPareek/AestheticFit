# _shared — Edge Function utilities

Shared helpers imported by Supabase Edge Functions.
No CLI is available; all functions are deployed by pasting their code into the
Supabase dashboard → Edge Functions → New Function.

## Deployment note

Because edge functions are deployed one file at a time via the dashboard, each
function must be a **single inlined file** — the `_shared/` directory is a
reference implementation. When deploying `parse-meal` or any future function,
copy the relevant helpers inline into the function's `index.ts`.

## Files

| File | Purpose |
|---|---|
| `cors.ts` | CORS helper — adds `Access-Control-Allow-*` headers, handles `OPTIONS` preflight |
| `auth.ts` | `getUser(req)` — verifies the Supabase JWT from `Authorization: Bearer <token>`, throws `401 Response` on failure |
| `json.ts` | `json(status, body)` — typed JSON response helper |
| `rateLimit.ts` | `checkRateLimit(userId, bucket, limit, windowSeconds)` — rate-limit check via the `rate_limit` table (service-role only) |

## Usage example

```typescript
import { preflight, corsHeaders } from './_shared/cors.ts'
import { getUser } from './_shared/auth.ts'
import { json } from './_shared/json.ts'
import { checkRateLimit } from './_shared/rateLimit.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  const user = await getUser(req).catch(r => r)
  if (user instanceof Response) return user

  const { allowed } = await checkRateLimit(user.id, 'parse-meal')
  if (!allowed) return json(429, { error: 'Rate limit exceeded' })

  // ... function logic

  return json(200, { result: '...' }, corsHeaders(req.headers.get('origin')))
})
```
