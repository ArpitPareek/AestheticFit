# AestheticFit — 5-Month Training Architecture

Reference spec for the workout engine. Two committed users, full commercial gym,
5 days/week, **60-minute hard cap** per session. This document is the source of
truth the deterministic plan generator encodes — not an LLM prompt.

---

## Shared principles

- **Autoregulation by RIR** (Reps In Reserve), not fixed %1RM. Novices and cutters
  both mis-estimate maxes; RIR travels better.
- **Volume landmarks per muscle/week:** MEV (minimum effective) → MAV (adaptive max)
  → MRV (recoverable max). Phases *ramp* volume toward MAV, then a deload resets.
- **Progression:** linear (add reps → add load) early; **double progression**
  (hit top of rep range on all sets → add load, reset to bottom) once technique is
  stable. The `ProgressEngine` already implements both — it just needs the rep
  ranges below as inputs.
- **Deload cadence:** every ~6 weeks *or* triggered by 2 consecutive stalled
  sessions. Deload = ~60% volume, load held.
- **60-min discipline:** ~6–7 working exercises/session, rest timers enforced
  (compounds 120–180s, isolation 60–90s), supersets on antagonists to buy time.
- **Nutrition-engine tie-in:** Person B's diet-break weeks (logged as
  `reason='diet_break'` in `nutrition_target_history`) are also training deloads —
  fatigue and adherence recover together.

---

## PERSON A — Recomposition

**Profile:** M, 28, ~172cm, 66.4kg, ~19% BF, skinny-fat, cervical/shoulder pain
(intermittent, posture-driven). Near-novice. **Nutrition: maintenance (recomp).**

**Goals:** strength foundation · body recomp · broad shoulders (side-delt bias) ·
developed upper chest.

> **Progress metric is NOT the scale.** At maintenance the bodyweight barely moves
> while fat drops and muscle builds. Track **waist + lift PRs + photos**. Wire the
> dashboard "expectation cards" to say this explicitly, or he'll think it's failing.

### Split logic
Delts recover in ~24h and respond to frequency, so the split guarantees side-delt
work **3–4×/week** and chest (incline) **2–3×/week**, with lat width for the taper.

| Phase | Weeks | Split | Intent | RIR |
|---|---|---|---|---|
| 1 — Foundation | 1–5 | Upper / Lower / Upper / Lower / Delt+Arm+Core | Pattern mastery, neck-safe, work capacity. Machine-biased. | 3–4 |
| 2 — Accumulation | 6–11 | Push / Pull / Legs / Upper / Lower | Hypertrophy; volume ramps MEV→MAV; delt frequency peaks | 2–3 |
| 3 — Intensification | 12–17 | Push / Pull / Legs / Upper / Lower | Strength foundation: double progression on primaries | 1–2 top sets |
| 4 — Peak & Reveal | 18–22 | Push / Pull / Legs / Upper / Lower | Accessories near MRV → deload; slight deficit to reveal recomp | 1–2 |

### Weekly volume targets (Phase 2, sets/week)
Side delts **16–20** · Chest (incline-weighted) **12–14** · Back **14–16** ·
Rear delts **8–10** · Quads **10–12** · Hams/glutes **8–10** · Arms **6–8 direct** ·
Calves/core to taste.

### Sample week — Phase 2 (Accumulation)
**Push** — Incline DB press 3×8–10 · Machine chest press 3×10–12 · Cable lateral raise 4×12–20 · Neutral-grip DB shoulder press 3×8–10 *(if pain-free)* · Overhead triceps ext 3×12
**Pull** — Lat pulldown 3×8–10 · Chest-supported row 3×10–12 · Face pull 3×15 · Rear-delt fly 3×15 · DB curl 3×10–12 · *Cable lateral raise 3×15 (delt frequency)*
**Legs** — Leg press 3×10–12 · RDL 3×8–10 · Seated leg curl 3×12 · Leg extension 3×15 · Standing calf 4×12 · Hanging knee raise 3×
**Upper** — Incline machine press 3×10 · **Cable lateral raise 4×15** · Chest-supported row 3×10 · Face pull 3×15 · Lateral-raise lengthened partials (finisher) · Cable curl 3×12
**Lower** — Hack squat 3×10 · Hip thrust 3×10 · Leg curl 3×12 · Leg extension 3×15 · Calf 4×15 · Core

Side delts appear on Push, Pull, and Upper → the width driver. Chest = incline 2–3×.

### Neck/shoulder safety (hard rules, tag `contraindications` `cervical`,`shoulder`)
- **Exclude:** barbell overhead press, behind-neck press/pulldown, heavy barbell
  upright rows, heavy shrugs.
- **Prefer:** neutral-grip DB/landmine pressing, cable/machine over free-weight for
  overhead patterns, chest-supported rows (no lower-back/neck bracing under load).
- **Mandatory prehab filler:** face pulls + band pull-aparts + prone Y-T-W most
  sessions. Cue: no lateral raise above ~90° early (impingement-prone shoulders).

---

## PERSON B — Aggressive Cut + Muscle Retention

**Profile:** F, 30, 157cm, 70.5kg, ~35% BF. **Returning lifter** (prior 8-mo cut,
−10kg, low of 57kg). Struggles with push-ups/pull-ups (relative strength at high BF).
**Nutrition: managed shrinking deficit, cycle-smoothed 28-day trend.**

**Goal:** −13kg committed / −15kg stretch over 5 months (~0.6kg/wk) while
retaining/building lean mass.

> **Retention is a training job, not a diet job.** The diet drives fat loss; the
> training *tells the body to keep the muscle*. Non-negotiables: keep load/intensity
> high, keep protein high, don't drop below MEV volume.

### Split logic
Moderate volume (deficit impairs recovery), compound-biased, intensity held.
Muscle memory means she can push hard early.

| Phase | Weeks | Split | Intent | RIR |
|---|---|---|---|---|
| 1 — Re-acclimation | 1–3 | Upper / Lower | Re-groove patterns, rebuild work capacity | 3 |
| 2 — Retention build | 4–11 | Upper / Lower / Push / Pull / Legs | Hard compounds; recomp window (build while cutting) | 2 |
| 3 — Deficit grind | 12–17 | Upper / Lower / Push / Pull / Legs | Hold lifts; trim a set if recovery flags; cardio ramps | 2 |
| 4 — Final push | 18–22 | Upper / Lower / Push / Pull / Legs | Maintain lifts = proof of retention; finish the cut | 1–2 |

**Diet-break/deload weeks:** ~Wk 11 and ~Wk 18 — nutrition to maintenance, volume to ~60%.

### Weekly volume targets (Phase 2, sets/week)
Back **12–14** · Chest **10–12** · Quads **10–12** · Hams/glutes **10–12** ·
Delts **10–12** · Arms **4–6 direct** · Core/calves to taste. (Lower than Person A —
this is deliberate; recovery is the constraint in a deficit.)

### Sample week — Phase 2 (Retention build)
**Upper** — Incline machine press 3×8–10 · Assisted pull-up *or* lat pulldown 3×6–10 · Seated cable row 3×10 · DB shoulder press 3×10 · Cable lateral raise 3×15 · Triceps pushdown 2×12
**Lower** — Barbell hip thrust 3×8–10 · Leg press 3×10 · Seated leg curl 3×12 · Walking lunge 2×10 · Standing calf 3×15 · Core
**Push** — Machine chest press 3×10 · Incline DB press 3×10 · Cable lateral raise 3×15 · Overhead triceps 3×12 · **Incline push-up (progression) 2×AMRAP**
**Pull** — **Lat pulldown 3×8–10 (pull-up progression)** · Chest-supported row 3×10 · Face pull 3×15 · Rear-delt fly 3×15 · DB curl 2×12
**Legs** — Goblet/hack squat 3×8–10 · RDL 3×8–10 · Leg extension 3×15 · Leg curl 3×12 · Calf · Core
**Cardio/steps:** rising step target (engine-driven, part of the deficit) + 2× short Zone-2 post-lift. Keep intensity *in the weights*, not in the cardio.

### Bodyweight-movement progression ladders
**Pull-up:** assisted-machine/band pull-up → eccentric-only negatives → banded →
bodyweight. Track by *assistance load falling* — she keeps progressing even as the
scale drops (double win). Lat pulldown builds the strength in parallel.
**Push-up:** hands-elevated (Smith bar high → bench → low box) → floor. Relative
strength rises as BF falls, so this improves "for free" through the cut.

### High-BF joint-friendly selection
Prioritize **hip thrust, leg press, goblet-to-box squat, RDL** over deep loaded
barbell back squat early (comfort + knee/hip-friendly at higher BF, and easy to load
in a deficit). Revisit barbell squat depth in Phase 3 as she leans out.

---

## Encoding into the app (bridge to the next build chunk)

1. **`workout_plans.plan_data` jsonb shape** (generator output):
   ```
   { phases: [ { name, week_start, week_end, split,
       days: [ { label, exercises: [
         { ref, sets, rep_low, rep_high, rir, rest_s, progression, note } ] } ] } ] }
   ```
   `ref` = `{type:'library'|'custom', id}` — the stable identity the ProgressEngine
   and the swap-immutability logic key off.

2. **Exercise library upgrade** — structured cues + contraindication tags + media,
   per the companion seed file. The generator *filters* by `contraindications`
   (Person A excludes `cervical`/`shoulder`-tagged movements) and *scores* by
   `sfr_rating` + preference.

3. **Generator stays deterministic.** It reads assessment + these phase templates +
   volume landmarks and emits `plan_data`. The LLM's only jobs are: parse food NL,
   *suggest* mid-session swaps ("machine busy → here are 3 same-pattern subs"), and
   explain "why this exercise." It never authors sets/reps/progression.
