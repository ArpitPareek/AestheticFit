import { createClient, type PostgrestError } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const client = createClient<Database>(supabaseUrl, supabaseAnonKey)

// B36-interceptor: Batch 5 shipped a lighter per-screen toast; this is the
// full version — every `.from(...)` query result with `.error` set emits a
// window CustomEvent so ANY screen (not just ones that remembered to check
// `error`) surfaces the failure instead of dropping it on the floor.
export const SUPABASE_ERROR_EVENT = 'supabase-error'

function announceError(error: PostgrestError) {
  window.dispatchEvent(new CustomEvent<PostgrestError>(SUPABASE_ERROR_EVENT, { detail: error }))
}

// Wrap `.from(table)` so every terminal query (select/insert/update/delete/
// upsert) reports its error through the same event, regardless of which
// hook issued it.
//
// NOTE: supabase-js query builders are thenable at every step (`.select()`
// returns a filter builder that itself has both `.then` AND chain methods
// like `.eq()`). A Proxy that treats "has a `.then`" as "this is terminal,
// await it now" fires on the FIRST chain call and collapses the builder into
// a plain Promise, so the next `.eq()` in the chain is called on a Promise —
// exactly the `supabase.from(...).select(...).eq is not a function` crash
// this shipped with. Fix: only patch `.then` on the object entry methods
// return, in place, so the object's chain methods (which return `this`)
// keep working — the interceptor rides along on the same instance.
interface QueryResult {
  error: PostgrestError | null
}
type Thenable = PromiseLike<QueryResult>
const ENTRY_METHODS = ['select', 'insert', 'update', 'upsert', 'delete'] as const

const originalFrom = client.from.bind(client)
client.from = ((table: Parameters<typeof originalFrom>[0]) => {
  const builder = originalFrom(table) as unknown as Record<string, (...args: unknown[]) => unknown>
  for (const method of ENTRY_METHODS) {
    const original = builder[method].bind(builder)
    builder[method] = (...args: unknown[]) => {
      const result = original(...args)
      if (result && typeof result === 'object' && typeof (result as Thenable).then === 'function') {
        const thenable = result as Thenable & { then: Thenable['then'] }
        const originalThen = thenable.then.bind(thenable)
        thenable.then = (<TResult1, TResult2>(
          onFulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
          onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) =>
          originalThen((res) => {
            if (res?.error) announceError(res.error)
            return onFulfilled ? onFulfilled(res) : res
          }, onRejected)) as Thenable['then']
      }
      return result
    }
  }
  return builder as unknown as ReturnType<typeof originalFrom>
}) as typeof client.from

export const supabase = client
