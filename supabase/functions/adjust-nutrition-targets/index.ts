// supabase/functions/adjust-nutrition-targets/index.ts
//
// Adaptive TDEE + dynamic macro engine. Scheduled weekly (pg_cron or Supabase
// Scheduled Functions). SERVER-SIDE ONLY — uses the service-role key, never the
// client. For each user with a nutrition_config it:
//   1. pulls the last `trend_window_days` of weigh-ins + intake,
//   2. fits a least-squares slope to the weight (robust to daily/cycle noise),
//   3. computes adaptive TDEE = avg_intake - (delta_weight * 7700 / window),
//   4. records the estimate, then adjusts targets ONLY if all guardrails pass.
//
// Deploy:   supabase functions deploy adjust-nutrition-targets --no-verify-jwt
// Schedule: create a weekly cron (pg_cron) that invokes this function.

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const KCAL_PER_KG = 7700; // energy density of body-mass change
const STEP = 120;         // kcal nudge per adjustment
const TOL = 0.15;         // kg/week dead-band around the target rate

type Config = {
  user_id: string;
  goal_mode: "recomp" | "cut" | "lean_bulk" | "maintain";
  trend_window_days: number;
  target_rate_kg_week: number; // negative = intended loss
  calorie_floor: number;
  calorie_cap: number | null;
  protein_g_target: number;
  min_log_adherence: number;
  adjust_interval_days: number;
  last_adjusted_at: string | null;
};

const daysSince = (d: string | null) =>
  d ? (Date.now() - new Date(d).getTime()) / 86_400_000 : Infinity;

const today = () => new Date().toISOString().slice(0, 10);

// least-squares slope of weight vs day-index → kg/day (negative = losing)
function slopeKgPerDay(pts: { d: number; w: number }[]): number {
  const n = pts.length;
  if (n < 2) return 0;
  const md = pts.reduce((s, p) => s + p.d, 0) / n;
  const mw = pts.reduce((s, p) => s + p.w, 0) / n;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.d - md) * (p.w - mw); den += (p.d - md) ** 2; }
  return den === 0 ? 0 : num / den;
}

async function processUser(cfg: Config) {
  const windowStart = new Date(Date.now() - cfg.trend_window_days * 86_400_000)
    .toISOString().slice(0, 10);

  const [{ data: weights }, { data: meals }] = await Promise.all([
    supabase.from("weight_logs").select("log_date, weight_kg")
      .eq("user_id", cfg.user_id).gte("log_date", windowStart).order("log_date"),
    supabase.from("meal_logs").select("log_date, calories")
      .eq("user_id", cfg.user_id).gte("log_date", windowStart),
  ]);

  if (!weights || weights.length < 4)
    return { user: cfg.user_id, action: "skip", reason: "not_enough_weigh_ins" };

  // intake: sum per day, then average over DAYS LOGGED (not window) + adherence
  const kcalByDay = new Map<string, number>();
  for (const m of meals ?? [])
    kcalByDay.set(m.log_date, (kcalByDay.get(m.log_date) ?? 0) + Number(m.calories));
  const loggedDays = kcalByDay.size;
  const adherence  = loggedDays / cfg.trend_window_days;
  const avgIntake  = loggedDays
    ? [...kcalByDay.values()].reduce((a, b) => a + b, 0) / loggedDays : 0;

  // weight trend via regression slope
  const t0  = new Date(weights[0].log_date).getTime();
  const pts = weights.map((w) => ({
    d: (new Date(w.log_date).getTime() - t0) / 86_400_000,
    w: Number(w.weight_kg),
  }));
  const ratePerDay  = slopeKgPerDay(pts);
  const ratePerWeek = ratePerDay * 7;
  const weightDelta = ratePerDay * cfg.trend_window_days;

  const canAdapt = adherence >= cfg.min_log_adherence && avgIntake > 0;
  const adaptiveTdee = canAdapt
    ? avgIntake - (weightDelta * KCAL_PER_KG / cfg.trend_window_days) : null;
  const confidence = adherence >= 0.85 ? "high"
    : adherence >= cfg.min_log_adherence ? "medium" : "low";

  // always record the estimate
  await supabase.from("tdee_estimates").insert({
    user_id: cfg.user_id,
    method: adaptiveTdee ? "adaptive" : "seed_mifflin",
    window_days: cfg.trend_window_days,
    avg_intake_kcal: Math.round(avgIntake),
    trend_weight_start_kg: Number(pts[0].w.toFixed(2)),
    trend_weight_end_kg: Number(pts.at(-1)!.w.toFixed(2)),
    weight_delta_kg: Number(weightDelta.toFixed(2)),
    estimated_tdee_kcal: adaptiveTdee ? Math.round(adaptiveTdee) : null,
    log_adherence: Number(adherence.toFixed(2)),
    confidence,
  });

  // gates before touching targets
  if (daysSince(cfg.last_adjusted_at) < cfg.adjust_interval_days)
    return { user: cfg.user_id, action: "hold", reason: "too_soon" };
  if (adherence < cfg.min_log_adherence)
    return { user: cfg.user_id, action: "hold", reason: "log_more_to_unlock" };
  if (!adaptiveTdee)
    return { user: cfg.user_id, action: "hold", reason: "insufficient_intake_data" };

  const { data: cur } = await supabase.from("nutrition_targets")
    .select("*").eq("user_id", cfg.user_id).single();
  if (!cur) return { user: cfg.user_id, action: "skip", reason: "no_current_target" };

  // decide, mode-aware
  const target = cfg.target_rate_kg_week;
  let newCals = cur.calories;
  let reason = "no_change";

  if (cfg.goal_mode === "cut") {
    if (ratePerWeek > target + TOL) { newCals -= STEP; reason = "stall_adjust"; }
    else if (ratePerWeek < target - TOL) { newCals += STEP; reason = "too_fast_adjust"; }
  } else if (cfg.goal_mode === "recomp" || cfg.goal_mode === "maintain") {
    if (ratePerWeek < -0.25) { newCals += STEP; reason = "drifting_down"; }
    else if (ratePerWeek > 0.25) { newCals -= STEP; reason = "drifting_up"; }
  } else if (cfg.goal_mode === "lean_bulk") {
    if (ratePerWeek < 0.05) { newCals += STEP; reason = "not_gaining"; }
    else if (ratePerWeek > 0.35) { newCals -= STEP; reason = "gaining_too_fast"; }
  }

  // guardrails: hard floor, optional cap, deficit never > 30% of TDEE, round to 25
  newCals = Math.max(newCals, cfg.calorie_floor);
  if (cfg.calorie_cap) newCals = Math.min(newCals, cfg.calorie_cap);
  newCals = Math.max(newCals, Math.round(adaptiveTdee * 0.70));
  newCals = Math.round(newCals / 25) * 25;

  if (newCals === cur.calories)
    return { user: cfg.user_id, action: "hold", reason: "within_target_band" };

  // recompute macros: protein floor fixed, fat anchored, carbs fill the remainder
  const protein = Math.max(cur.protein_g, cfg.protein_g_target);
  const fat = cur.fat_g;
  const carbs = Math.max(0, Math.round((newCals - protein * 4 - fat * 9) / 4));

  await supabase.from("nutrition_target_history").insert({
    user_id: cfg.user_id, calories: newCals, protein_g: protein,
    carbs_g: carbs, fat_g: fat, goal_mode: cfg.goal_mode,
    deficit_kcal: Math.round(newCals - adaptiveTdee), reason, source: "engine",
  });
  await supabase.from("nutrition_targets")
    .update({ calories: newCals, protein_g: protein, carbs_g: carbs, fat_g: fat, updated_at: new Date().toISOString() })
    .eq("user_id", cfg.user_id);
  await supabase.from("nutrition_config")
    .update({ last_adjusted_at: today() }).eq("user_id", cfg.user_id);

  return { user: cfg.user_id, action: "adjusted", from: cur.calories, to: newCals, reason };
}

Deno.serve(async () => {
  const { data: configs } = await supabase.from("nutrition_config").select("*");
  const results: unknown[] = [];
  for (const cfg of (configs ?? []) as Config[]) {
    try { results.push(await processUser(cfg)); }
    catch (e) { results.push({ user: cfg.user_id, action: "error", error: String(e) }); }
  }
  return new Response(
    JSON.stringify({ ran_at: new Date().toISOString(), results }, null, 2),
    { headers: { "content-type": "application/json" } },
  );
});