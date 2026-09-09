import { useState } from 'react'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { ProfileProvider, useProfile } from './features/profile/ProfileContext'
import { AssessmentForm } from './features/profile/AssessmentForm'
import { ProfilePage } from './features/profile/ProfilePage'
import { PlanReview } from './features/workout/PlanReview'
import { AppShell, type TabId } from './components/layout/AppShell'
import type { AssessmentResponses } from './features/profile/types'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-700">
      <p className="text-lg text-slate-500">{title}</p>
    </div>
  )
}

function AppContent() {
  const { hasCompletedAssessment, hasPlan, assessment, loading, reload } = useProfile()
  const [activeTab, setActiveTab] = useState<TabId>('today')

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!hasCompletedAssessment) {
    return (
      <AssessmentForm
        existingId={assessment?.id}
        existingData={assessment?.responses ?? undefined}
        version={assessment?.version ?? 1}
        onComplete={reload}
      />
    )
  }

  // Assessment done but no plan yet — show plan review
  if (!hasPlan && assessment) {
    return (
      <PlanReview
        assessment={assessment.responses as AssessmentResponses}
        assessmentId={assessment.id}
        onApproved={reload}
      />
    )
  }

  const page = (() => {
    switch (activeTab) {
      case 'today':
        return <PlaceholderPage title="Today" />
      case 'workouts':
        return <PlaceholderPage title="Workouts" />
      case 'nutrition':
        return <PlaceholderPage title="Nutrition" />
      case 'track':
        return <PlaceholderPage title="Tracking" />
      case 'profile':
        return <ProfilePage />
    }
  })()

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {page}
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
