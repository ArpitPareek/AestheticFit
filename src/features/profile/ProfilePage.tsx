import { useCallback, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Dumbbell,
  LogOut,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useProfile } from './ProfileContext'
import { useNutritionTargets, type NutritionTargets } from '../nutrition/hooks/useNutritionTargets'
import { localTodayISO } from '../../lib/utils'
import { AssessmentForm } from './AssessmentForm'
import type { AssessmentResponses } from './types'
import type { Database, InsertTables } from '../../types/supabase'

type ExportableTable = keyof Database['public']['Tables']
const EXPORTABLE_TABLES: ExportableTable[] = [
  'profiles', 'assessments', 'workout_plans', 'exercise_logs',
  'workout_logs', 'meal_logs', 'weight_logs', 'skin_logs',
  'skin_checkins', 'daily_logs', 'streaks',
]
const IMPORT_ORDER: ExportableTable[] = [
  'profiles', 'assessments', 'workout_plans', 'workout_logs',
  'exercise_logs', 'meal_logs', 'weight_logs', 'skin_logs',
  'skin_checkins', 'daily_logs', 'streaks',
]

const APP_VERSION = '5.0.0'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, assessment, activePlan, reload } = useProfile()
  const { targets, hasCustom, saveTargets, resetTargets } = useNutritionTargets()
  const [retaking, setRetaking] = useState(false)
  const [resettingPlan, setResettingPlan] = useState(false)
  const [editingTargets, setEditingTargets] = useState(false)
  const [draftTargets, setDraftTargets] = useState<NutritionTargets>(targets)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [showPlanDetail, setShowPlanDetail] = useState(false)
  const [weddingDate, setWeddingDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aefit_wedding_date') ?? ''
    }
    return ''
  })
  const [editingWedding, setEditingWedding] = useState(false)
  const [weddingDraft, setWeddingDraft] = useState(weddingDate)

  const responses = assessment?.responses as AssessmentResponses | undefined

  if (retaking) {
    return (
      <AssessmentForm
        version={(assessment?.version ?? 0) + 1}
        existingData={responses}
        onComplete={() => {
          setRetaking(false)
          reload()
        }}
      />
    )
  }

  const plan = activePlan?.plan_data

  const handleResetPlan = async () => {
    if (!user || !activePlan) return
    setResettingPlan(true)
    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('id', activePlan.id)
    await reload()
    setResettingPlan(false)
  }

  const handleStartEditTargets = () => {
    setDraftTargets({ ...targets })
    setEditingTargets(true)
  }

  const handleSaveTargets = async () => {
    await saveTargets(draftTargets)
    setEditingTargets(false)
  }

  const handleResetTargets = async () => {
    await resetTargets()
    setEditingTargets(false)
  }

  const handleExport = async () => {
    if (!user) return
    setExporting(true)
    try {
      const results: Record<string, unknown[]> = {}
      await Promise.all(
        EXPORTABLE_TABLES.map(async (table) => {
          // Same dynamic-table boundary as the import below: the owner column
          // name varies per table and can't be resolved to a single literal
          // across a union of all tables at the type level.
          const { data } = await supabase.from(table).select('*').eq(
            (table === 'profiles' ? 'id' : 'user_id') as never,
            user.id,
          )
          results[table] = data ?? []
        }),
      )
      const blob = new Blob(
        [JSON.stringify({ exported_at: new Date().toISOString(), user_id: user.id, data: results }, null, 2)],
        { type: 'application/json' },
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aestheticfit-export-${localTodayISO()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = useCallback(async () => {
    if (!user) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setImporting(true)
      setImportMsg(null)
      try {
        const text = await file.text()
        const json = JSON.parse(text)
        const data = json.data as Record<string, unknown[]> | undefined
        if (!data) throw new Error('Invalid export file')

        let imported = 0
        let rejected = 0
        const failures: string[] = []
        for (const table of IMPORT_ORDER) {
          const rows = data[table]
          if (!rows?.length) continue
          const ownerCol = table === 'profiles' ? 'id' : 'user_id'
          // Force ownership on every row so a tampered / cross-account file can't
          // insert rows attributed to another user (RLS would reject anyway, but
          // this makes the intent explicit and keeps the row count honest).
          const scoped = (rows as Record<string, unknown>[]).map((r) => ({
            ...r,
            [ownerCol]: user.id,
          }))
          const { error } = await supabase
            .from(table)
            .upsert(scoped as unknown as InsertTables<typeof table>[])
          if (error) {
            rejected += rows.length
            failures.push(`${table}: ${error.message}`)
          } else {
            imported += rows.length
          }
        }
        if (rejected > 0) {
          setImportMsg(
            `Import failed: ${imported} imported, ${rejected} rejected — ${failures[0]}`,
          )
        } else {
          setImportMsg(`Imported ${imported} records successfully`)
        }
        await reload()
      } catch (e) {
        setImportMsg(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }, [user, reload])

  const handleSaveWedding = () => {
    localStorage.setItem('aefit_wedding_date', weddingDraft)
    setWeddingDate(weddingDraft)
    setEditingWedding(false)
  }

  const weddingDaysLeft = weddingDate
    ? Math.max(0, Math.round((new Date(weddingDate + 'T00:00:00').getTime() - new Date(localTodayISO() + 'T00:00:00').getTime()) / 86400000))
    : null

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>

      {/* ─── Profile Summary ────────────────────────── */}
      {profile && (
        <div className="rounded-2xl border border-slate-700 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-400">Profile</h3>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={profile.display_name} />
            <Row label="Age" value={profile.age?.toString()} />
            <Row label="Sex" value={profile.sex} />
            <Row label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : undefined} />
            <Row label="Weight" value={profile.current_weight_kg ? `${profile.current_weight_kg} kg` : undefined} />
            <Row label="Target" value={profile.target_weight_kg ? `${profile.target_weight_kg} kg` : undefined} />
          </div>
        </div>
      )}

      {/* ─── Wedding Countdown ──────────────────────── */}
      <div className="rounded-2xl border border-slate-700 bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Calendar size={14} />
            Wedding Countdown
          </h3>
          <button
            onClick={() => { setWeddingDraft(weddingDate); setEditingWedding(!editingWedding) }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors active:bg-slate-700"
          >
            {editingWedding ? <X size={14} /> : <Pencil size={14} />}
          </button>
        </div>
        {editingWedding ? (
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={weddingDraft}
              onChange={(e) => setWeddingDraft(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveWedding}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors active:bg-emerald-700"
            >
              <Save size={14} />
            </button>
          </div>
        ) : weddingDate ? (
          <div className="mt-2">
            <p className="text-3xl font-bold text-white">{weddingDaysLeft}</p>
            <p className="text-xs text-slate-400">days remaining — {new Date(weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No date set. Tap edit to add one.</p>
        )}
      </div>

      {/* ─── Active Plan Summary ────────────────────── */}
      {plan && activePlan && (
        <div className="rounded-2xl border border-slate-700 bg-card p-4">
          <button
            type="button"
            onClick={() => setShowPlanDetail(!showPlanDetail)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Dumbbell size={14} />
              Active Plan
            </h3>
            {showPlanDetail ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Plan" value={activePlan.plan_name} />
            <Row label="Phase" value={`${activePlan.phase} of ${activePlan.total_phases}`} />
            <Row label="Sessions/Week" value={`${plan.days.length}`} />
            <Row label="Started" value={activePlan.start_date} />
          </div>

          {showPlanDetail && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <p className="text-[11px] font-medium text-slate-400 mb-2">This Phase</p>
              <div className="space-y-1.5">
                {plan.days.map((day, i) => (
                  <div key={`${day.label}-${i}`} className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-500 w-8 shrink-0 pt-0.5">
                      D{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200">{day.label}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {day.split} · {day.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePlan.plan_source === 'coach_authored' ? (
            <p className="mt-3 rounded-lg border border-slate-700 bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
              <span className="font-medium text-slate-300">Coach-authored plan — locked.</span> The
              &ldquo;regenerate&rdquo; reset is disabled here so a single tap can&rsquo;t drop you onto a generic
              auto-plan and lose your phases. For an injury or equipment day, use the per-exercise
              <span className="text-slate-300"> Swap</span> on the Workouts tab instead.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResetPlan}
              disabled={resettingPlan}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2.5 text-xs font-medium text-red-400 transition-colors active:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {resettingPlan ? 'Resetting…' : 'Reset & Regenerate Plan'}
            </button>
          )}
        </div>
      )}

      {/* ─── Nutrition Targets ──────────────────────── */}
      <div className="rounded-2xl border border-slate-700 bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400">Nutrition Targets</h3>
          {!editingTargets && (
            <button
              onClick={handleStartEditTargets}
              className="rounded-lg p-1.5 text-slate-400 transition-colors active:bg-slate-700"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {editingTargets ? (
          <div className="mt-3 space-y-3">
            <TargetInput label="Calories" value={draftTargets.calories} unit="kcal" onChange={(v) => setDraftTargets(p => ({ ...p, calories: v }))} />
            <TargetInput label="Protein" value={draftTargets.protein_g} unit="g" onChange={(v) => setDraftTargets(p => ({ ...p, protein_g: v }))} />
            <TargetInput label="Carbs" value={draftTargets.carbs_g} unit="g" onChange={(v) => setDraftTargets(p => ({ ...p, carbs_g: v }))} />
            <TargetInput label="Fat" value={draftTargets.fat_g} unit="g" onChange={(v) => setDraftTargets(p => ({ ...p, fat_g: v }))} />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTargets}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-medium text-white transition-colors active:bg-emerald-700"
              >
                <Save size={14} />
                Save
              </button>
              {hasCustom && (
                <button
                  onClick={handleResetTargets}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors active:bg-slate-800"
                >
                  <RotateCcw size={14} />
                  Auto
                </button>
              )}
              <button
                onClick={() => setEditingTargets(false)}
                className="rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-400 transition-colors active:bg-slate-800"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <StatCell label="Calories" value={`${targets.calories}`} sub="kcal" />
            <StatCell label="Protein" value={`${targets.protein_g}`} sub="g" />
            <StatCell label="Carbs" value={`${targets.carbs_g}`} sub="g" />
            <StatCell label="Fat" value={`${targets.fat_g}`} sub="g" />
          </div>
        )}
        {hasCustom && !editingTargets && (
          <p className="mt-2 text-[10px] text-slate-500">Custom targets active</p>
        )}
      </div>

      {/* ─── Assessment Summary ─────────────────────── */}
      {responses && (
        <div className="rounded-2xl border border-slate-700 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-400">Assessment Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Primary Goal" value={responses.goals.primary} />
            <Row label="Experience" value={responses.training.level} />
            <Row label="Days/Week" value={responses.availability.days_per_week.toString()} />
            <Row label="Session" value={`${responses.availability.session_minutes} min`} />
            <Row label="Preference" value={responses.preferences.preference} />
            <Row label="Equipment" value={responses.equipment.length > 0 ? responses.equipment.join(', ') : 'None'} />
            <Row label="Version" value={`v${assessment?.version}`} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setRetaking(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-300 transition-colors active:bg-slate-800"
      >
        <RefreshCw size={16} />
        Retake Assessment
      </button>

      {/* ─── Data Management ────────────────────────── */}
      <div className="rounded-2xl border border-slate-700 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-400">Data Management</h3>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition-colors active:bg-slate-700 disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? 'Exporting…' : 'Export All Data'}
        </button>
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition-colors active:bg-slate-700 disabled:opacity-50"
        >
          <Upload size={14} />
          {importing ? 'Importing…' : 'Import Data'}
        </button>
        {importMsg && (
          <p className={`text-xs ${importMsg.startsWith('Import failed') ? 'text-red-400' : 'text-emerald-400'}`}>
            {importMsg}
          </p>
        )}
      </div>

      {/* ─── Log out ──────────────────────────────────── */}
      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-300 transition-colors active:bg-slate-800"
      >
        <LogOut size={16} />
        Log out
      </button>

      {/* ─── App Version ────────────────────────────── */}
      <p className="text-center text-[10px] text-slate-600">
        AestheticFit v{APP_VERSION}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function TargetInput({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
      />
      <span className="w-8 text-xs text-slate-500">{unit}</span>
    </div>
  )
}

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-slate-800/50 px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-200">
        {value} <span className="text-[10px] font-normal text-slate-500">{sub}</span>
      </p>
    </div>
  )
}
