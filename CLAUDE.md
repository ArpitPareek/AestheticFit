# AestheticFit v5

Personal fitness + nutrition + skincare PWA for 2 users (Arpit + Harshita).
Rebuilding from a single-file HTML prototype into a proper full-stack app.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (Postgres + Auth + RLS + Edge Functions)
- Deployment: Vercel (free tier)
- PWA: vite-plugin-pwa with service worker
- Charts: recharts (lightweight)
- Icons: lucide-react
- No other heavy dependencies unless explicitly needed

## Architecture Principles
- Mobile-first (95% Android phone usage, 375px primary viewport)
- Every DB table has user_id column + RLS policy — no data leakage between profiles
- Historical logs are immutable — changing a plan doesn't alter past workout logs
- Exercise logs reference a plan_version_id so we know which plan was active when the log was created
- AI calls (future) go through Supabase Edge Functions, never frontend
- Offline-capable: core workout/meal logging should work without network
- All dates stored as ISO strings, user's local timezone for display
- JSONB columns are fine for nested data (sets, checklist items) — don't over-normalize

## Project Structure
```
src/
  components/        # Shared UI components
    ui/              # Button, Input, Card, Modal, Badge, ProgressBar
    layout/          # AppShell, BottomNav, Header
  features/          # Feature modules (each self-contained)
    auth/            # LoginScreen, AuthContext, ProtectedRoute
    profile/         # AssessmentForm, ProfileContext, ProfileSettings
    workout/         # PlanGenerator, TodayWorkout, ExerciseCard, ProgressEngine
    nutrition/       # FoodDB, MealLogger, DailyTotals, NutritionTargets
    weight/          # WeightTracker, WeightChart
    skin/            # SkinRoutine, SkinCheckin
    dashboard/       # Dashboard, Streaks, ExpectationCards
    tracking/        # DailyTracker (steps, sleep, water)
  lib/               # Utilities and static data
    supabase.ts      # Supabase client singleton
    types.ts         # Shared TypeScript types/interfaces
    constants/       # Static data
      exercises.ts   # Exercise library (50+ exercises)
      foods.ts       # Indian food database (50+ foods)
      skincare.ts    # Skin routines per profile type
    utils.ts         # Date helpers, macro calculators, formatters
  hooks/             # Shared custom React hooks
  App.tsx            # Root component with routing
  main.tsx           # Entry point
supabase/
  migrations/        # SQL migration files (run in Supabase SQL editor)
  seed-exercises.sql # Exercise library seed data
  seed-foods.sql     # Food library seed data
public/
  icons/             # PWA icons (192x192, 512x512)
```

## Key Types

```typescript
// Assessment shape
interface Assessment {
  basics: { name, age, sex, height_cm, weight_kg, target_weight_kg }
  goals: { primary, secondary?, priorities: string[] }
  training: { level, gym_months, frequency, sports }
  availability: { days_per_week, session_minutes, preferred_days, time }
  equipment: string[]
  preferences: { enjoy: string[], cannot_do: string[], injuries: string, preference: 'machines'|'free-weights'|'mixed' }
  lifestyle: { cardio_preference: string[], daily_steps, sleep_hours, job_type }
}

// Workout plan shape
interface WorkoutPlan {
  planName: string
  totalWeeks: number
  phases: Phase[]
  overloadRules: OverloadRules
}

interface Phase {
  phaseNumber: number
  weekStart: number
  weekEnd: number
  name: string
  description: string
  weeklySchedule: DayPlan[]
}

// Exercise log set shape (stored as JSONB)
interface ExerciseSet {
  set_number: number
  weight_kg: number
  reps: number
  rir?: number
  notes?: string
}
```

## Two Profiles
- Architecture supports N users via user_id + RLS
- Currently 2 pre-seeded accounts in Supabase Auth
- All queries filter by authenticated user — never by hardcoded name
- Profile-specific content (skin routines, nutrition targets) keyed by profile data, not name

## Environment Variables
```
VITE_SUPABASE_URL=https://ahsdpbjdqxeacnjfljio.supabase.co/rest/v1/
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoc2RwYmpkcXhlYWNuamZsamlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Njc5MTEsImV4cCI6MjEwNDU0MzkxMX0.NsfE8slRW52A2KwfE0zvk-08KW8Crb3hPomvvOMcXdQ
```

## Build Commands
```bash
npm run dev      # Local dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```

## Coding Conventions
- Functional components with hooks (no class components)
- Custom hooks for data fetching (useXxx pattern)
- Tailwind for all styling (no CSS files except global resets)
- Explicit TypeScript types (no `any`)
- Error boundaries around major feature sections
- Loading skeletons, not spinners
- Empty state messages for all lists
- Toast notifications for actions (save, delete, error)
- All touch targets minimum 44x44px