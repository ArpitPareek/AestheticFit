import { useMemo, useState } from 'react'
import { Egg, Leaf, Pencil, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useCustomFoods, type CustomFood, type CustomFoodPatch } from './hooks/useCustomFoods'
import { normalizeFoodName } from './promoteAiFood'

const round1 = (n: number) => Math.round(n * 10) / 10

// ─── Inline editor for one food ────────────────────────────
function FoodEditor({
  food,
  onSave,
  onCancel,
}: {
  food: CustomFood
  onSave: (patch: CustomFoodPatch) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(food.name)
  const [servingLabel, setServingLabel] = useState(food.serving_label)
  const [calories, setCalories] = useState(String(food.calories))
  const [protein, setProtein] = useState(String(food.protein_g))
  const [carbs, setCarbs] = useState(String(food.carbs_g))
  const [fat, setFat] = useState(String(food.fat_g))
  const [fiber, setFiber] = useState(String(food.fiber_g))
  const [isVeg, setIsVeg] = useState(food.is_veg)

  const num = (s: string) => (Number.isFinite(Number(s)) ? Number(s) : 0)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      name: trimmed,
      serving_label: servingLabel.trim() || '1 serving',
      calories: Math.round(num(calories)),
      protein_g: round1(num(protein)),
      carbs_g: round1(num(carbs)),
      fat_g: round1(num(fat)),
      fiber_g: round1(num(fiber)),
      is_veg: isVeg,
    })
  }

  const field = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="w-full rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  )

  return (
    <div className="mt-2 space-y-3 rounded-xl bg-slate-900/40 p-3">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Serving (per these macros)</span>
        <input
          value={servingLabel}
          onChange={(e) => setServingLabel(e.target.value)}
          placeholder="1 katori, 1 piece, 100 g…"
          className="w-full rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {field('Calories', calories, setCalories)}
        {field('Protein g', protein, setProtein)}
        {field('Carbs g', carbs, setCarbs)}
        {field('Fat g', fat, setFat)}
        {field('Fiber g', fiber, setFiber)}
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Type</span>
          <button
            onClick={() => setIsVeg((v) => !v)}
            className="flex items-center justify-center gap-1 rounded-lg bg-slate-700 py-1.5 text-xs font-medium text-white active:bg-slate-600"
          >
            {isVeg ? <Leaf size={13} className="text-emerald-400" /> : <Egg size={12} className="text-red-400" />}
            {isVeg ? 'Veg' : 'Non-veg'}
          </button>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white active:bg-emerald-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 active:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Source badge ──────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  if (source === 'ai_parsed') {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
        AI
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-slate-600/40 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
      {source === 'barcode' ? 'scanned' : source === 'ifct' ? 'library' : 'custom'}
    </span>
  )
}

// ─── Main sheet ────────────────────────────────────────────
export function MyFoods({ onClose }: { onClose: () => void }) {
  const { foods, loading, duplicateCount, updateFood, deleteFood, dedupe } = useCustomFoods()
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800) }

  const filtered = useMemo(() => {
    const q = normalizeFoodName(query)
    if (!q) return foods
    return foods.filter((f) => normalizeFoodName(f.name).includes(q))
  }, [foods, query])

  const handleDedupe = async () => {
    setBusy(true)
    const removed = await dedupe()
    setBusy(false)
    showToast(removed > 0 ? `Merged ${removed} duplicate${removed > 1 ? 's' : ''}` : 'No duplicates found')
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    const { error } = await deleteFood(id)
    setBusy(false)
    setConfirmDeleteId(null)
    showToast(error ? 'Could not delete' : 'Deleted')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <div>
            <h3 className="font-semibold text-white">My Foods</h3>
            <p className="text-[11px] text-slate-500">
              {foods.length} saved{duplicateCount > 0 ? ` · ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Search + dedupe */}
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-700 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your foods…"
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
          {duplicateCount > 0 && (
            <button
              onClick={handleDedupe}
              disabled={busy}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-400 active:bg-amber-500/25 disabled:opacity-40"
            >
              <Sparkles size={13} /> Clean up
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-700/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">
                {foods.length === 0 ? 'No saved foods yet' : 'No matches'}
              </p>
              {foods.length === 0 && (
                <p className="mt-1 text-[11px] text-slate-600">
                  Foods you log by name get saved here automatically, so they’re reused next time.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((food) => (
                <div key={food.id} className="rounded-xl bg-slate-800/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {food.is_veg ? (
                          <Leaf size={13} className="shrink-0 text-emerald-400" />
                        ) : (
                          <Egg size={12} className="shrink-0 text-red-400" />
                        )}
                        <p className="truncate text-sm font-medium text-white">{food.name}</p>
                        <SourceBadge source={food.source} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {food.serving_label} · {Math.round(food.calories)} cal · {round1(food.protein_g)}g P ·{' '}
                        {round1(food.carbs_g)}g C · {round1(food.fat_g)}g F
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditingId(editingId === food.id ? null : food.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-emerald-400"
                        aria-label={`Edit ${food.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(food.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                        aria-label={`Delete ${food.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {confirmDeleteId === food.id && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2">
                      <span className="text-[11px] text-red-300">Delete this food? Past logs keep their numbers.</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(food.id)}
                          disabled={busy}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white active:bg-red-700 disabled:opacity-40"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {editingId === food.id && (
                    <FoodEditor
                      food={food}
                      onCancel={() => setEditingId(null)}
                      onSave={async (patch) => {
                        const { error } = await updateFood(food.id, patch)
                        setEditingId(null)
                        showToast(error ? 'Could not save' : 'Saved')
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <span className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {toast}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
