import { useEffect } from 'react'
import {
  Flame,
  Dumbbell,
  Moon,
  UtensilsCrossed,
  Sun,
  Sparkles,
  Scale,
  Footprints,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { useProfile } from '../profile/ProfileContext'
import { useTodayWorkout } from '../workout/hooks/useTodayWorkout'
import { coachPhaseStatus } from '../workout/planProgress'
import { PhaseAdvanceBanner } from '../workout/PhaseAdvanceBanner'
import { useDailyNutrition } from '../nutrition/hooks/useDailyNutrition'
import { useNutritionTargets } from '../nutrition/hooks/useNutritionTargets'
import { useStreaks, checkTodayActivity } from './useStreaks'
import { useDashboardData } from './useDashboardData'
import { RecoveryWatch } from '../tracking/RecoveryWatch'
import { useAuth } from '../auth/AuthContext'
import type { TabId } from '../../components/layout/AppShell'

interface DashboardProps {
  onNavigate: (tab: TabId) => void
}

function CircularProgress({
  value,
  max,
  size,
  strokeWidth,
  color,
  children,
}: {
  value: number
  max: number
  size: number
  strokeWidth: number
  color: string
  children: React.ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  const offset = circ * (1 - pct)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function getWeekNumber(startDate: string | null): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 604800000) + 1)
}

function getExpectationCard(week: number): { title: string; body: string } | null {
  if (week <= 0) return null
  if (week <= 2) return {
    title: 'Building the Foundation',
    body: "You won't see changes yet. Your body is adapting to the new routine. The most important thing right now is showing up.",
  }
  if (week <= 4) return {
    title: 'Neural Adaptation',
    body: 'Your nervous system is learning. You should feel more comfortable with exercises. Strength gains are happening internally.',
  }
  if (week <= 6) return {
    title: 'First Signs',
    body: 'This is where you might start noticing small changes. Clothes may fit differently. Keep going.',
  }
  if (week <= 8) return {
    title: 'Visible Changes',
    body: 'Visible changes begin here. Compare to your starting photos. The consistency is compounding.',
  }
  if (week <= 12) return {
    title: 'Compound Effect',
    body: "Compound effect phase. This is where transformation accelerates. Don't plateau — progressive overload matters now more than ever.",
  }
  return {
    title: 'Adaptation Zone',
    body: "You're in the adaptation zone. Consider reassessing your plan if progress has stalled.",
  }
}

function getSkinExpectation(week: number, usesTretinoin: boolean): string | null {
  if (usesTretinoin && week >= 2 && week <= 6) {
    return "Skin purging is normal. Don't quit."
  }
  if (week >= 8) {
    return 'Texture improvements should be visible. Check your fortnightly photos.'
  }
  return null
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const { profile, assessment, activePlan, reload } = useProfile()
  const phaseStatus = coachPhaseStatus(activePlan)
  const plan = activePlan?.plan_data ?? null
  const preferredDays = assessment?.responses.availability.preferred_days ?? null
  const { dayPlan, isRestDay } = useTodayWorkout(plan, activePlan?.start_date ?? null, preferredDays)
  const { totals, loading: nutritionLoading } = useDailyNutrition()
  const { targets, goalMode } = useNutritionTargets()
  const { currentStreak, streakBroken, loading: streakLoading, recordActivity } = useStreaks()
  const {
    latestWeight,
    lastSleep,
    todaySteps,
    amSkinDone,
    pmSkinDone,
    workoutDoneToday,
    loading: dashLoading,
  } = useDashboardData()

  const weekNum = getWeekNumber(activePlan?.start_date ?? null)
  const expectation = getExpectationCard(weekNum)

  const usesTretinoin = profile?.sex === 'female'
    ? weekNum >= 3
    : true
  const skinExpectation = getSkinExpectation(weekNum, usesTretinoin)

  const now = new Date()
  const hour = now.getHours()
  const isPast2pm = hour >= 14
  const proteinPct = targets.protein_g > 0 ? totals.protein_g / targets.protein_g : 0

  useEffect(() => {
    if (!user || dashLoading || streakLoading) return
    const today = new Date().toISOString().slice(0, 10)
    checkTodayActivity(user.id, today, isRestDay).then(active => {
      if (active) recordActivity()
    })
  }, [user, dashLoading, streakLoading, isRestDay, recordActivity])

  const loading = dashLoading || nutritionLoading || streakLoading

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-card" />
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-card" />)}
        </div>
        <div className="h-28 animate-pulse rounded-xl bg-card" />
        <div className="h-20 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const exerciseCount = dayPlan ? dayPlan.exercises.length : 0

  return (
    <div className="space-y-4 pb-4">
      <RecoveryWatch />

      {phaseStatus.phaseEnded && activePlan && (
        <PhaseAdvanceBanner status={phaseStatus} phase={activePlan.phase} onAdvanced={reload} />
      )}

      {/* ─── Status Bar ──────────────────────────────── */}
      <div className="rounded-xl bg-card p-4">
        <p className="text-xs text-slate-500">{dateStr}</p>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {profile?.display_name ? `Hey, ${profile.display_name.split(' ')[0]}` : 'Welcome back'}
            </h2>
            {weekNum > 0 && (
              <p className="text-[11px] text-slate-400">Week {weekNum} of your transformation</p>
            )}
            {activePlan?.plan_source === 'coach_authored' && (
              <p className="text-[11px] font-medium text-emerald-400">
                {activePlan.plan_name} · Phase {activePlan.phase} of {activePlan.total_phases}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-2.5 py-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{currentStreak}</span>
            <span className="text-[10px] text-orange-400/70">day{currentStreak !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {streakBroken && currentStreak === 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Streak reset, but your progress isn't. Every day is a fresh start.
          </p>
        )}
      </div>

      {/* ─── Quick Stats Row ─────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Protein (hero — always first) */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-card px-3 py-3 ring-1 ring-emerald-500/30">
          <CircularProgress value={totals.protein_g} max={targets.protein_g} size={52} strokeWidth={4} color="#34d399">
            <span className="text-[10px] font-bold text-emerald-400">{Math.round(totals.protein_g)}g</span>
          </CircularProgress>
          <span className="mt-1 text-[10px] font-medium text-emerald-400/80">
            / {targets.protein_g}g floor
          </span>
        </div>

        {/* Calories */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-card px-3 py-3">
          <CircularProgress value={totals.calories} max={targets.calories} size={52} strokeWidth={4} color="#10b981">
            <span className="text-[10px] font-bold text-white">{Math.round(totals.calories)}</span>
          </CircularProgress>
          <span className="mt-1 text-[10px] text-slate-400">/ {targets.calories} cal</span>
        </div>

        {/* Steps */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-card px-3 py-3">
          <div className="flex h-[52px] w-[52px] flex-col items-center justify-center">
            <Footprints size={18} className="text-blue-400" />
            <span className="mt-0.5 text-xs font-bold text-white">{todaySteps ?? '–'}</span>
          </div>
          <span className="mt-1 text-[10px] text-slate-400">steps</span>
        </div>

        {/* Weight */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-card px-3 py-3">
          <div className="flex h-[52px] w-[52px] flex-col items-center justify-center">
            <Scale size={18} className="text-amber-400" />
            <span className="mt-0.5 text-xs font-bold text-white">{latestWeight ?? '–'}</span>
          </div>
          <span className="mt-1 text-[10px] text-slate-400">kg</span>
        </div>

        {/* Sleep */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-card px-3 py-3">
          <div className="flex h-[52px] w-[52px] flex-col items-center justify-center">
            <Moon size={18} className="text-purple-400" />
            <span className="mt-0.5 text-xs font-bold text-white">{lastSleep ?? '–'}</span>
          </div>
          <span className="mt-1 text-[10px] text-slate-400">hrs sleep</span>
        </div>
      </div>

      {/* ─── Today's Workout ─────────────────────────── */}
      <button
        onClick={() => onNavigate('workouts')}
        className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left transition-colors active:bg-slate-700/50"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isRestDay ? 'bg-indigo-500/15' : workoutDoneToday ? 'bg-emerald-500/15' : 'bg-emerald-500/15'
        }`}>
          {isRestDay ? (
            <Moon size={20} className="text-indigo-400" />
          ) : (
            <Dumbbell size={20} className={workoutDoneToday ? 'text-emerald-400' : 'text-emerald-400'} />
          )}
        </div>
        <div className="flex-1">
          {isRestDay ? (
            <>
              <p className="text-sm font-semibold text-white">Rest Day</p>
              <p className="text-[11px] text-slate-400">Recovery is training too</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">
                {dayPlan?.label ?? 'Workout'}
                {workoutDoneToday && <span className="ml-2 text-emerald-400">Done</span>}
              </p>
              <p className="text-[11px] text-slate-400">{exerciseCount} exercises</p>
            </>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-600" />
      </button>

      {/* ─── Nutrition Snapshot ───────────────────────── */}
      <div className="rounded-xl bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Nutrition</h3>
          </div>
          <button
            onClick={() => onNavigate('nutrition')}
            className="rounded-lg bg-emerald-600/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 transition-colors active:bg-emerald-600/25"
          >
            Quick Add
          </button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <MiniStat label="Protein" value={Math.round(totals.protein_g)} target={targets.protein_g} unit="g" />
          <MiniStat label="Calories" value={Math.round(totals.calories)} target={targets.calories} unit="" />
          <MiniStat label="Carbs" value={Math.round(totals.carbs_g)} target={targets.carbs_g} unit="g" />
          <MiniStat label="Fat" value={Math.round(totals.fat_g)} target={targets.fat_g} unit="g" />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          {goalMode === 'recomp'
            ? `Protein floor ${targets.protein_g}g — hit this first, calories second.`
            : goalMode === 'cut'
              ? `Protein floor ${targets.protein_g}g — non-negotiable.`
              : `Target ${targets.protein_g}g protein daily.`}
        </p>
        {isPast2pm && proteinPct < 0.5 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5">
            <AlertTriangle size={12} className="shrink-0 text-amber-500" />
            <p className="text-[10px] text-amber-400">
              Protein is under 50% — prioritize protein in your remaining meals.
            </p>
          </div>
        )}
      </div>

      {/* ─── Skin Routine ────────────────────────────── */}
      <button
        onClick={() => onNavigate('skin')}
        className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left transition-colors active:bg-slate-700/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15">
          <Sparkles size={20} className="text-pink-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Skin Routine</p>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <Sun size={10} className="text-amber-400" />
              <span className={amSkinDone ? 'text-emerald-400' : 'text-slate-500'}>
                AM {amSkinDone ? 'Done' : 'Pending'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Moon size={10} className="text-indigo-400" />
              <span className={pmSkinDone ? 'text-emerald-400' : 'text-slate-500'}>
                PM {pmSkinDone ? 'Done' : 'Pending'}
              </span>
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-600" />
      </button>

      {/* ─── Expectation Card ────────────────────────── */}
      {expectation && (
        <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500/70">
            Week {weekNum} — {expectation.title}
          </p>
          <p className="text-xs leading-relaxed text-slate-300">{expectation.body}</p>
        </div>
      )}

      {/* ─── Skin Expectation ────────────────────────── */}
      {skinExpectation && (
        <div className="flex items-start gap-2 rounded-xl bg-pink-500/8 px-3 py-2.5">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-pink-400/70" />
          <p className="text-[11px] leading-relaxed text-pink-300/80">{skinExpectation}</p>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = target > 0 ? value / target : 0
  const color = pct > 1.1 ? 'text-red-400' : pct >= 0.7 ? 'text-emerald-400' : 'text-slate-300'
  const barColor = pct > 1.1 ? 'bg-red-500' : pct >= 0.7 ? 'bg-emerald-500' : 'bg-slate-600'

  return (
    <div>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-xs font-bold ${color}`}>{value}{unit}</p>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </div>
  )
}
