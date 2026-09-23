import { lazy, Suspense, useState } from 'react'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { ProfileProvider, useProfile } from './features/profile/ProfileContext'
import { AssessmentForm } from './features/profile/AssessmentForm'
import { PlanReview } from './features/workout/PlanReview'
import { AppShell, type TabId } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { AssessmentResponses } from './features/profile/types'

const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const TodayWorkout = lazy(() => import('./features/workout/TodayWorkout').then(m => ({ default: m.TodayWorkout })))
const MealLogger = lazy(() => import('./features/nutrition/MealLogger').then(m => ({ default: m.MealLogger })))
const TrackPage = lazy(() => import('./features/tracking/TrackPage').then(m => ({ default: m.TrackPage })))
const SkinRoutine = lazy(() => import('./features/skin/SkinRoutine').then(m => ({ default: m.SkinRoutine })))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))

function TabSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-40 skeleton" />
      <div className="h-28 skeleton" />
      <div className="h-20 skeleton" />
      <div className="h-20 skeleton" />
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  const { hasCompletedAssessment, hasPlan, assessment, draftPlan, loading, reload } = useProfile()
  const [activeTab, setActiveTab] = useState<TabId>('today')

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="space-y-3 w-full max-w-sm px-6">
          <div className="h-6 w-32 mx-auto skeleton" />
          <div className="h-20 skeleton" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 flex-1 skeleton" />)}
          </div>
          <div className="h-28 skeleton" />
          <div className="h-20 skeleton" />
        </div>
      </div>
    )
  }

  if (!hasCompletedAssessment) {
    return (
      <ErrorBoundary fallbackTitle="Assessment error">
        <AssessmentForm
          existingId={assessment?.id}
          existingData={assessment?.responses ?? undefined}
          version={assessment?.version ?? 1}
          onComplete={reload}
        />
      </ErrorBoundary>
    )
  }

  if (!hasPlan && assessment && user) {
    return (
      <ErrorBoundary fallbackTitle="Plan generation error">
        <PlanReview
          assessment={assessment.responses as AssessmentResponses}
          userId={user.id}
          draftPlan={draftPlan}
          onActivated={reload}
        />
      </ErrorBoundary>
    )
  }

  const page = (() => {
    switch (activeTab) {
      case 'today':
        return <Dashboard onNavigate={setActiveTab} />
      case 'workouts':
        return <TodayWorkout />
      case 'nutrition':
        return <MealLogger />
      case 'track':
        return <TrackPage />
      case 'skin':
        return <SkinRoutine />
      case 'profile':
        return <ProfilePage />
    }
  })()

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <ErrorBoundary fallbackTitle={`Error in ${activeTab}`} resetKeys={[activeTab]}>
        <Suspense fallback={<TabSkeleton />}>
          {page}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  )
}

function App() {
  return (
    <ErrorBoundary fallbackTitle="App crashed">
      <AuthProvider>
        <ProtectedRoute>
          <ProfileProvider>
            <AppContent />
          </ProfileProvider>
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
