import { useCallback, useMemo, useState } from 'react'
import {
  Apple,
  ChevronDown,
  ChevronUp,
  CookingPot,
  Egg,
  Leaf,
  Plus,
  Search,
  Sunrise,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import { useDailyNutrition, type MealLogEntry, type MealType } from './hooks/useDailyNutrition'
import { useNutritionTargets } from './hooks/useNutritionTargets'
import {
  FOODS,
  FOOD_CATEGORIES,
  searchFoods,
  type Food,
  type FoodCategory,
} from '../../lib/constants/foods'

const PORTION_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

const MEAL_CONFIG: { type: MealType; label: string; icon: typeof Sunrise }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { type: 'lunch', label: 'Lunch', icon: CookingPot },
  { type: 'dinner', label: 'Dinner', icon: Utensils },
  { type: 'snack', label: 'Snacks', icon: Apple },
]

function statusColor(current: number, target: number): string {
  const pct = target > 0 ? current / target : 0
  if (pct > 1.1) return 'text-red-400'
  if (pct >= 0.7) return 'text-emerald-400'
  return 'text-amber-400'
}

function barColor(current: number, target: number): string {
  const pct = target > 0 ? current / target : 0
  if (pct > 1.1) return 'bg-red-500'
  if (pct >= 0.7) return 'bg-emerald-500'
  return 'bg-amber-500'
}

// ─── Macro Progress Bar ────────────────────────────────────
function MacroBar({
  label,
  current,
  target,
  unit,
  prominent,
}: {
  label: string
  current: number
  target: number
  unit: string
  prominent?: boolean
}) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={`text-xs ${prominent ? 'font-semibold text-white' : 'text-slate-400'}`}>
          {label}
        </span>
        <span className={`text-xs font-medium ${statusColor(current, target)}`}>
          {Math.round(current)} / {target}
          {unit} ({Math.round(pct)}%)
        </span>
      </div>
      <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700 ${prominent ? 'h-2' : ''}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(current, target)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Food Picker Bottom Sheet ──────────────────────────────
function FoodPicker({
  mealType,
  onAdd,
  onClose,
}: {
  mealType: MealType
  onAdd: (food: Food, servings: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [portion, setPortion] = useState(1)

  const filteredFoods = useMemo(() => {
    let results = query ? searchFoods(query) : FOODS
    if (activeCategory !== 'all') {
      results = results.filter((f) => f.category === activeCategory)
    }
    return results
  }, [query, activeCategory])

  const handleConfirm = () => {
    if (selectedFood) {
      onAdd(selectedFood, portion)
      setSelectedFood(null)
      setPortion(1)
    }
  }

  // Step 2: portion selector
  if (selectedFood) {
    const cal = Math.round(selectedFood.calories * portion)
    const pro = Math.round(selectedFood.protein_g * portion * 10) / 10
    const carb = Math.round(selectedFood.carbs_g * portion * 10) / 10
    const fat = Math.round(selectedFood.fat_g * portion * 10) / 10

    return (
      <div className="fixed inset-0 z-30 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-lg rounded-t-2xl bg-slate-800 p-4 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedFood(null)}
              className="text-xs text-slate-400"
            >
              ← Back
            </button>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>

          <h3 className="text-lg font-semibold text-white">{selectedFood.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {selectedFood.serving_size} per serving
          </p>

          {/* Portion buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PORTION_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPortion(p)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  portion === p
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                }`}
              >
                {p}×
              </button>
            ))}
          </div>

          {/* Macro preview */}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-700/50 p-3">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{cal}</p>
              <p className="text-[10px] text-slate-500">cal</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-400">{pro}g</p>
              <p className="text-[10px] text-slate-500">protein</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-sky-400">{carb}g</p>
              <p className="text-[10px] text-slate-500">carbs</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-amber-400">{fat}g</p>
              <p className="text-[10px] text-slate-500">fat</p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white active:bg-emerald-700"
          >
            Add to {MEAL_CONFIG.find((m) => m.type === mealType)?.label}
          </button>
        </div>
      </div>
    )
  }

  // Step 1: search + pick food
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h3 className="font-semibold text-white">
            Add to {MEAL_CONFIG.find((m) => m.type === mealType)?.label}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto px-4 py-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            All
          </button>
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {filteredFoods.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No foods found</p>
          )}
          <div className="space-y-1">
            {filteredFoods.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors active:bg-slate-700"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700">
                  {food.is_vegetarian ? (
                    <Leaf size={16} className="text-emerald-400" />
                  ) : (
                    <Egg size={14} className="text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{food.name}</p>
                  <p className="text-xs text-slate-500">{food.serving_size}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-300">{food.calories} cal</p>
                  <p className="text-[10px] text-emerald-400">{food.protein_g}g protein</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Meal Section ──────────────────────────────────────────
function MealSection({
  label,
  icon: Icon,
  entries,
  onAdd,
  onRemove,
}: {
  type: MealType
  label: string
  icon: typeof Sunrise
  entries: MealLogEntry[]
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const mealCal = entries.reduce((s, e) => s + e.calories, 0)
  const mealPro = entries.reduce((s, e) => s + e.protein_g, 0)

  return (
    <div className="rounded-2xl bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          {entries.length > 0 && (
            <span className="text-xs text-slate-500">
              {Math.round(mealCal)} cal · {Math.round(mealPro)}g pro
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {entries.length > 0 && (
            <div className="mb-2 space-y-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      {entry.food_name}
                      {entry.servings !== 1 && (
                        <span className="text-slate-500"> ×{entry.servings}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {Math.round(entry.calories)} cal · {Math.round(entry.protein_g)}g P ·{' '}
                      {Math.round(entry.carbs_g)}g C · {Math.round(entry.fat_g)}g F
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="ml-2 shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 py-2.5 text-xs font-medium text-slate-400 transition-colors active:border-emerald-600 active:text-emerald-400"
          >
            <Plus size={14} /> Add Food
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Protein Gap Alert ─────────────────────────────────────
function ProteinGap({ current, target }: { current: number; target: number }) {
  const gap = target - current
  if (gap <= 10) return null

  const suggestions: string[] = []
  if (gap >= 30) suggestions.push('2 eggs + 1 scoop whey')
  else if (gap >= 20) suggestions.push('1 scoop whey')
  if (gap >= 18) suggestions.push(`${Math.round(gap / 0.18)}g paneer`)
  if (gap >= 10 && gap < 30) suggestions.push('200g Greek yogurt')

  return (
    <div className="rounded-2xl bg-amber-500/10 p-3">
      <p className="text-xs font-medium text-amber-400">
        You need {Math.round(gap)}g more protein today
      </p>
      {suggestions.length > 0 && (
        <p className="mt-0.5 text-[10px] text-amber-400/70">
          Try: {suggestions.join(', or ')}
        </p>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export function MealLogger() {
  const { totals, mealsByType, addMeal, removeMeal, loading } = useDailyNutrition()
  const { targets, goalMode, loading: targetsLoading } = useNutritionTargets()
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null)

  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1500) }

  const handleAddFood = useCallback(
    async (food: Food, servings: number) => {
      if (!pickerMeal) return
      // TODO F1: backfill historical nulls after food reseed
      const result = await addMeal({
        meal_type: pickerMeal,
        food_id: food.id,
        food_name: food.name,
        servings,
        calories: Math.round(food.calories * servings),
        protein_g: Math.round(food.protein_g * servings * 10) / 10,
        carbs_g: Math.round(food.carbs_g * servings * 10) / 10,
        fat_g: Math.round(food.fat_g * servings * 10) / 10,
      })
      if (result?.error) { showToast('Failed to add food'); return }
      setPickerMeal(null)
    },
    [pickerMeal, addMeal],
  )

  if (loading || targetsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Protein floor — hero metric */}
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className={`text-xl font-bold ${statusColor(totals.protein_g, targets.protein_g)}`}>
              {Math.round(totals.protein_g)}g
            </span>
            <span className="text-sm text-slate-400"> / {targets.protein_g}g protein</span>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            FLOOR
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(totals.protein_g, targets.protein_g)}`}
            style={{ width: `${Math.min(100, (totals.protein_g / targets.protein_g) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          {goalMode === 'recomp'
            ? 'Hit your protein floor first — calories second. The scale may not move; trust the mirror and lifts.'
            : goalMode === 'cut'
              ? `Protein floor ${targets.protein_g}g is non-negotiable. Protect muscle while cutting.`
              : `Aim for ${targets.protein_g}g protein daily.`}
        </p>

        {/* Calories — secondary */}
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className={`text-sm font-bold ${statusColor(totals.calories, targets.calories)}`}>
              {Math.round(totals.calories)}
            </span>
            <span className="text-xs text-slate-500"> / {targets.calories} cal</span>
          </div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(totals.calories, targets.calories)}`}
            style={{ width: `${Math.min(100, (totals.calories / targets.calories) * 100)}%` }}
          />
        </div>

        {goalMode === 'cut' && (
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            IF is fine if you like it — just fuel the training slot. It's calorie-matched, no magic.
          </p>
        )}
      </div>

      {/* Protein gap alert */}
      <ProteinGap current={totals.protein_g} target={targets.protein_g} />

      {/* Meal sections */}
      {MEAL_CONFIG.map(({ type, label, icon }) => (
        <MealSection
          key={type}
          type={type}
          label={label}
          icon={icon}
          entries={mealsByType(type)}
          onAdd={() => setPickerMeal(type)}
          onRemove={removeMeal}
        />
      ))}

      {/* Daily summary */}
      <div className="rounded-2xl bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Daily Summary</h3>
        <div className="space-y-3">
          <MacroBar label="Protein" current={totals.protein_g} target={targets.protein_g} unit="g" prominent />
          <MacroBar label="Calories" current={totals.calories} target={targets.calories} unit=" cal" />
          <MacroBar label="Carbs" current={totals.carbs_g} target={targets.carbs_g} unit="g" />
          <MacroBar label="Fat" current={totals.fat_g} target={targets.fat_g} unit="g" />
        </div>
      </div>

      {/* Food picker */}
      {pickerMeal && (
        <FoodPicker
          mealType={pickerMeal}
          onAdd={handleAddFood}
          onClose={() => setPickerMeal(null)}
        />
      )}

      {toast && (
        <p className="py-1 text-center text-xs text-red-400">{toast}</p>
      )}
    </div>
  )
}
