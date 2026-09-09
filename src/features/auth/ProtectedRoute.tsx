import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { LoginScreen } from './LoginScreen'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <>{children}</>
}
