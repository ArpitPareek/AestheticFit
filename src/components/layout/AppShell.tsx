import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dumbbell, UtensilsCrossed, Activity, User, CalendarCheck, Sparkles } from 'lucide-react'

const tabs = [
  { id: 'today', label: 'Today', icon: CalendarCheck },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { id: 'track', label: 'Track', icon: Activity },
  { id: 'skin', label: 'Skin', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
] as const

export type TabId = (typeof tabs)[number]['id']

interface AppShellProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null)
  const [a2hsPrompt, setA2hsPrompt] = useState<Event | null>(null)
  const [showA2hs, setShowA2hs] = useState(false)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [activeTab])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setA2hsPrompt(e)
      const dismissed = localStorage.getItem('aefit_a2hs_dismissed')
      if (!dismissed) setShowA2hs(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!a2hsPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (a2hsPrompt as any).prompt()
    setShowA2hs(false)
  }

  const dismissA2hs = () => {
    setShowA2hs(false)
    localStorage.setItem('aefit_a2hs_dismissed', '1')
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* A2HS Banner */}
      {showA2hs && (
        <div className="flex items-center justify-between gap-3 bg-emerald-600/15 px-4 py-2.5">
          <p className="text-xs text-emerald-400">Install AestheticFit for the best experience</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white active:bg-emerald-700"
            >
              Install
            </button>
            <button
              onClick={dismissA2hs}
              className="rounded-lg px-2 py-1.5 text-[11px] text-slate-400 active:bg-slate-800"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-10 border-t border-slate-800 bg-background/95 backdrop-blur-lg">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => {
                  if (active) {
                    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    onTabChange(id)
                  }
                }}
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active
                    ? 'text-emerald-500'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
              </button>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
