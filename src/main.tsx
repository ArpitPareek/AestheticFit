import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { PostgrestError } from '@supabase/supabase-js'
import './index.css'
import App from './App.tsx'
import { SUPABASE_ERROR_EVENT } from './lib/supabase.ts'

function showErrorToast(msg: string) {
  try {
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText =
      'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#7f1d1d;color:#fee2e2;padding:8px 14px;border-radius:10px;font-size:12px;max-width:90vw;box-shadow:0 4px 16px rgba(0,0,0,.3)'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 5000)
  } catch { /* pre-DOM */ }
}

// Global async-error surface: unhandled promise rejections would otherwise die
// silently in the console. Surface them once via console + a bottom toast so a
// transient Supabase 500 doesn't look like a blank "no data" state.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : String(reason ?? 'Unknown error')
    console.error('[unhandledrejection]', reason)
    showErrorToast(`Something went wrong: ${msg}`)
  })
  window.addEventListener('error', (event) => {
    console.error('[window.error]', event.error ?? event.message)
  })
  // B36-interceptor: every Supabase query error, from any screen, now surfaces
  // here — not just the ones a hook remembered to toast locally.
  window.addEventListener(SUPABASE_ERROR_EVENT, (event) => {
    const error = (event as CustomEvent<PostgrestError>).detail
    console.error('[supabase-error]', error)
    showErrorToast(error.message.slice(0, 80))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
