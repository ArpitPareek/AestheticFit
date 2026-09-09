import { useState, type ReactNode } from 'react'
import { Dumbbell, UtensilsCrossed, Activity, User, CalendarCheck, LogOut } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

const tabs = [
  { id: 'today', label: 'Today', icon: CalendarCheck },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { id: 'track', label: 'Track', icon: Activity },
  { id: 'profile', label: 'Profile', icon: User },
] as const

export type TabId = (typeof tabs)[number]['id']

interface AppShellProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-emerald-500">AestheticFit</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{user?.email}</span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-10 border-t border-slate-800 bg-background/95 backdrop-blur">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active
                    ? 'text-emerald-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
              </button>
            )
          })}
        </div>
        {/* Safe area spacer for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
