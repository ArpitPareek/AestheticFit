import { useCallback, useEffect, useMemo, useState } from 'react'
import { Apple, CookingPot, Pencil, Sparkles, Sunrise, Utensils, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import type { MealType, NewMealLogEntry } from './hooks/useDailyNutrition'
import { useMealParser, type ParsedItem } from './hooks/useMealParser'
import { findCustomFoodId, promoteAiFood } from './promoteAiFood'

const MEAL_OPTIONS: { type: MealType; label: string; icon: typeof Sunrise }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { type: 'lunch', label: 'Lunch', icon: CookingPot },
  { type: 'dinner', label: 'Dinner', icon: Utensils },
  { type: 'snack', label: 'Snack', icon: Apple },
]

const PLACEHOLDER = '2 roti, 1 katori moong dal, small bowl dahi'

// Draft persistence — a half-typed meal must survive a tab switch or a full page
// reload (mobile PWAs routinely evict + reload the page when backgrounded, which
// wipes all in-memory React state).
const DRAFT_KEY = 'af:meal-draft'

function loadDraft(): { text: string; mealType: MealType } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return { text: '', mealType: 'breakfast' }
    const p = JSON.parse(raw) as { text?: unknown; mealType?: unknown }
    return {
      text: typeof p.text === 'string' ? p.text : '',
      mealType: MEAL_OPTIONS.some((m) => m.type === p.mealType)
        ? (p.mealType as MealType)
        : 'breakfast',
    }
  } catch {
    return { text: '', mealType: 'breakfast' }
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

interface EditableItem {
  key: string
  name: string
  // Canonical library name when matched (e.g. 'Peanuts'); used for display + logging.
  matchedName: string | null
  unit: string
  quantity: number
  // Per-single-unit macros — the invariant we scale by quantity for display + logging.
  perUnit: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  }
  // Grams for a single unit, so displayed grams track quantity edits.
  perUnitGrams: number
  food_id: string | null
  custom_food_id: string | null
  source: ParsedItem['source']
  matched: boolean
}

function toEditable(raw: ParsedItem, index: number): EditableItem {
  const q = raw.quantity > 0 ? raw.quantity : 1
  return {
    key: `${index}-${raw.name}`,
    name: raw.name,
    matchedName: raw.matched_name ?? null,
    unit: raw.unit,
    quantity: q,
    perUnit: {
      calories: raw.calories / q,
      protein_g: raw.protein_g / q,
      carbs_g: raw.carbs_g / q,
      fat_g: raw.fat_g / q,
      fiber_g: raw.fiber_g / q,
    },
    perUnitGrams: (raw.grams ?? 0) / q,
    food_id: raw.food_id ?? null,
    custom_food_id: raw.custom_food_id ?? null,
    source: raw.source,
    matched: raw.matched,
  }
}

// What the app understood — the canonical name when matched, else the raw text.
function displayName(it: EditableItem): string {
  return it.matched && it.matchedName ? it.matchedName : it.name
}

// Human portion string, e.g. "500 ml", "2 katori", "8 piece (≈4 g)".
function portionLabel(it: EditableItem): string {
  const unit = it.unit.trim()
  const base = unit ? `${round1(it.quantity)} ${unit}` : `${round1(it.quantity)}`
  const grams = Math.round(it.perUnitGrams * it.quantity)
  // Only append grams when the unit isn't already a weight/volume.
  const isWeight = ['g', 'kg', 'ml', 'gram', 'grams'].includes(unit.toLowerCase())
  return grams > 0 && !isWeight ? `${base} (≈${grams} g)` : base
}

function scaled(it: EditableItem) {
  return {
    calories: it.perUnit.calories * it.quantity,
    protein_g: it.perUnit.protein_g * it.quantity,
    carbs_g: it.perUnit.carbs_g * it.quantity,
    fat_g: it.perUnit.fat_g * it.quantity,
    fiber_g: it.perUnit.fiber_g * it.quantity,
  }
}

export function NaturalMealEntry({
  addMeals,
  onManual,
}: {
  addMeals: (entries: NewMealLogEntry[]) => Promise<{ error: unknown } | undefined>
  onManual: (mealType: MealType) => void
}) {
  const { user } = useAuth()
  const { status, parse, reset } = useMealParser()

  const [mealType, setMealType] = useState<MealType>(() => loadDraft().mealType)
  const [text, setText] = useState(() => loadDraft().text)
  const [items, setItems] = useState<EditableItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Persist the in-progress draft so a background tab-discard / reload doesn't
  // lose a half-typed meal. Cleared once the text is emptied (after logging).
  useEffect(() => {
    try {
      if (text.trim()) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, mealType }))
      } else {
        localStorage.removeItem(DRAFT_KEY)
      }
    } catch {
      /* private mode / quota — draft persistence is best-effort */
    }
  }, [text, mealType])

  const parsing = status === 'parsing'

  const totals = useMemo(() => {
    if (!items) return null
    return items.reduce(
      (acc, it) => {
        const s = scaled(it)
        return {
          calories: acc.calories + s.calories,
          protein_g: acc.protein_g + s.protein_g,
          carbs_g: acc.carbs_g + s.carbs_g,
          fat_g: acc.fat_g + s.fat_g,
        }
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )
  }, [items])

  const handleParse = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || parsing) return
    setError(null)
    const outcome = await parse(trimmed)
    if (outcome.ok) {
      setItems(outcome.data.items.map(toEditable))
      return
    }
    if (outcome.kind === 'empty') {
      // Parsed fine but recognised nothing — keep the text, let them retry.
      setError(
        outcome.warnings[0] ??
          "Couldn't recognise those items. Try rephrasing, or enter manually.",
      )
      return
    }
    // AI unavailable / hard failure → never block logging, drop to manual.
    onManual(mealType)
  }, [text, parsing, parse, onManual, mealType])

  const handleQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        ? prev.map((it) => (it.key === key ? { ...it, quantity: quantity > 0 ? quantity : 0 } : it))
        : prev,
    )
  }, [])

  const handleRemove = useCallback((key: string) => {
    setItems((prev) => (prev ? prev.filter((it) => it.key !== key) : prev))
  }, [])

  const handleCancel = useCallback(() => {
    setItems(null)
    setError(null)
    reset()
  }, [reset])

  const handleEditAll = useCallback(() => {
    // Back to the textarea, keeping the typed text so it can be tweaked + re-parsed.
    setItems(null)
    setError(null)
    reset()
  }, [reset])

  const handleConfirm = useCallback(async () => {
    if (!user || !items || items.length === 0 || saving) return
    setSaving(true)
    setError(null)

    const entries: NewMealLogEntry[] = []
    for (const it of items) {
      const s = scaled(it)

      let foodId: string | null = it.food_id
      let customFoodId: string | null = it.custom_food_id

      // Resolve a library reference when the parse didn't hand us an id.
      if (!foodId && !customFoodId) {
        if (it.source === 'ai_estimated') {
          // F4: promote to the user's custom_foods (idempotent).
          customFoodId = await promoteAiFood(user.id, {
            name: it.name,
            unit: it.unit,
            perUnit: it.perUnit,
          })
        } else if (it.source === 'custom') {
          customFoodId = await findCustomFoodId(user.id, it.name)
        }
      }

      // Two constraints on meal_logs:
      //  - meal_log_identity: source='quick_add' OR exactly one of
      //    (food_id, custom_food_id) is set.
      //  - meal_logs_source_check: source ∈ (library, custom, recipe,
      //    ai_parsed, quick_add) — NOT the parser's 'ifct'/'ai_estimated'.
      // Enforce a single identity and map to a valid source enum.
      let source: string
      if (foodId) {
        customFoodId = null
        source = 'library'
      } else if (customFoodId) {
        foodId = null
        source = it.source === 'custom' ? 'custom' : 'ai_parsed'
      } else {
        foodId = null
        customFoodId = null
        source = 'quick_add'
      }

      entries.push({
        meal_type: mealType,
        food_id: foodId,
        custom_food_id: customFoodId,
        // Canonical name when matched, so the log reads 'Peanuts' not 'moongfali'.
        food_name: displayName(it),
        servings: it.quantity,
        calories: Math.round(s.calories),
        protein_g: round1(s.protein_g),
        carbs_g: round1(s.carbs_g),
        fat_g: round1(s.fat_g),
        fiber_g: round1(s.fiber_g),
        source,
        // item_label carries the human portion for the logged-row display.
        item_label: portionLabel(it),
      })
    }

    const result = await addMeals(entries)
    setSaving(false)

    if (result?.error) {
      setError('Failed to log meal — try again')
      return
    }

    setText('')
    setItems(null)
    reset()
  }, [user, items, saving, mealType, addMeals, reset])

  return (
    <div className="rounded-2xl bg-card p-4">
      {/* Meal type selector — applies to the whole parsed batch */}
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {MEAL_OPTIONS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors ${
              mealType === type
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700/60 text-slate-400 active:bg-slate-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Parsing state ─────────────────────────────── */}
      {parsing && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-700/40 px-4 py-5">
          <Sparkles size={18} className="animate-pulse text-emerald-400" />
          <div className="flex-1">
            <p className="animate-pulse text-sm font-medium text-slate-200">Parsing your meal…</p>
            <p className="text-[10px] text-slate-500">This can take a few seconds</p>
          </div>
        </div>
      )}

      {/* ── Input state ───────────────────────────────── */}
      {!parsing && !items && (
        <>
          <label className="mb-1.5 block text-sm font-semibold text-white">What did you eat?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={3}
            className="w-full resize-none rounded-xl bg-slate-700/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleParse}
              disabled={!text.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors active:bg-emerald-700 disabled:opacity-40"
            >
              <Sparkles size={15} /> Parse
            </button>
            <button
              onClick={() => onManual(mealType)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 active:bg-slate-700"
            >
              Enter manually
            </button>
          </div>
          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
        </>
      )}

      {/* ── Parsed result state ───────────────────────── */}
      {!parsing && items && (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              All items removed. Cancel to start over.
            </p>
          )}

          {items.map((it) => {
            const s = scaled(it)
            return (
              <div key={it.key} className="rounded-xl bg-slate-800/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-white">{displayName(it)}</p>
                      {it.matched ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                          ✓ matched
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                          AI estimate
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {portionLabel(it)}
                      {it.matched && it.matchedName && it.matchedName.toLowerCase() !== it.name.toLowerCase() && (
                        <span className="text-slate-600"> · you said “{it.name}”</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(it.key)}
                    className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                    aria-label={`Remove ${displayName(it)}`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">
                      {Math.round(s.calories)}
                      <span className="ml-0.5 text-[10px] font-normal text-slate-500">cal</span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {round1(s.protein_g)}
                      <span className="ml-0.5 text-[10px] font-normal text-slate-500">g P</span>
                    </span>
                  </div>

                  {/* Inline quantity edit */}
                  <div className="flex items-center gap-1">
                    <Pencil size={11} className="text-slate-600" />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.25}
                      value={it.quantity}
                      onChange={(e) => handleQuantity(it.key, Number(e.target.value))}
                      className="w-14 rounded-lg bg-slate-700 px-2 py-1 text-right text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Sticky totals bar */}
          {totals && items.length > 0 && (
            <div className="sticky bottom-0 flex items-center justify-between rounded-xl bg-slate-700/80 px-3 py-2 backdrop-blur">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Meal total
              </span>
              <span className="text-xs font-medium text-slate-200">
                {Math.round(totals.calories)} cal · {round1(totals.protein_g)}g P ·{' '}
                {round1(totals.carbs_g)}g C · {round1(totals.fat_g)}g F
              </span>
            </div>
          )}

          {error && <p className="text-center text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={saving || items.length === 0}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors active:bg-emerald-700 disabled:opacity-40"
            >
              {saving ? 'Logging…' : 'Confirm & Log'}
            </button>
            <button
              onClick={handleEditAll}
              disabled={saving}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 active:bg-slate-700 disabled:opacity-40"
            >
              Edit All
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-400 active:bg-slate-700 disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
