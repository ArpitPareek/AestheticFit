// CORS helper for Edge Functions.
// Allows the app origin (Vercel) and localhost in dev.

const ALLOWED_ORIGINS = new Set([
  'https://aestheticfit.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : ALLOWED_ORIGINS.values().next().value
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}
