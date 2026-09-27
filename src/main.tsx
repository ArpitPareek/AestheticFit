import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global async-error surface: unhandled promise rejections would otherwise die
// silently in the console. Surface them once via console + a bottom toast so a
// transient Supabase 500 doesn't look like a blank "no data" state.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : String(reason ?? 'Unknown error')
    console.error('[unhandledrejection]', reason)
    try {
      const el = document.createElement('div')
      el.textContent = `Something went wrong: ${msg}`
      el.style.cssText =
        'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#7f1d1d;color:#fee2e2;padding:8px 14px;border-radius:10px;font-size:12px;max-width:90vw;box-shadow:0 4px 16px rgba(0,0,0,.3)'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 5000)
    } catch { /* pre-DOM */ }
  })
  window.addEventListener('error', (event) => {
    console.error('[window.error]', event.error ?? event.message)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
