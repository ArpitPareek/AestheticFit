// Plain-English definitions for the fitness/nutrition jargon that shows up across
// the app. One source of truth — the <Term> component reads from here so a term
// is defined once and explained everywhere it appears.
//
// Keys are lowercase, no spaces (use the `terms` lookup which normalises). Keep
// definitions short (one sentence), concrete, and friendly — they render inside a
// small tap-to-open bubble on a 375px phone.

export interface GlossaryEntry {
  /** Short label shown as the bubble heading (defaults to the term itself). */
  title: string
  /** One-sentence plain-English explanation. */
  def: string
}

const RAW: Record<string, GlossaryEntry> = {
  rir: {
    title: 'RIR — Reps In Reserve',
    def: 'How many more reps you could have done before failing. RIR 2 = you stopped with about 2 reps left in the tank. Lower = harder.',
  },
  deload: {
    title: 'Deload',
    def: 'A lighter, easier week on purpose. You lift less so your body recovers and comes back stronger — not a break, just a gear-down.',
  },
  prehab: {
    title: 'Prehab',
    def: 'Small injury-prevention moves (like face-pulls) done to keep a joint healthy. Think of it as maintenance so nothing gets hurt.',
  },
  ladder: {
    title: 'Ladder',
    def: 'A way to get stronger at bodyweight moves. Instead of adding weight, you slowly need LESS help — less machine assistance, or a lower surface — until you can do it on your own.',
  },
  'total volume': {
    title: 'Total volume',
    def: 'The total weight you moved this session (weight × reps, added up across every set). A simple measure of how much work you did.',
  },
  tempo: {
    title: 'Tempo',
    def: 'How fast you lift and lower. A slow, controlled tempo (especially on the way down) builds more muscle than rushing.',
  },
  eccentric: {
    title: 'The negative (eccentric)',
    def: 'The lowering half of a rep — e.g. lowering the bar to your chest. Controlling it slowly is where a lot of the muscle growth comes from.',
  },
  rom: {
    title: 'ROM — Range of Motion',
    def: 'How far the joint travels through the rep. Full range (all the way down, all the way up) works the muscle harder than short, partial reps.',
  },
  lockout: {
    title: 'Lockout',
    def: 'The top of the rep where the joint is fully straight. "Stop just short of lockout" means don\'t fully lock the elbows/knees — keep tension on the muscle.',
  },
  supinate: {
    title: 'Supinate',
    def: 'Turn your palms to face up (like holding a bowl of soup). The opposite is pronate (palms down).',
  },
  'posterior chain': {
    title: 'Posterior chain',
    def: 'The muscles on the back of your body — glutes, hamstrings and lower back — that power hinging and pulling movements.',
  },
  'to failure': {
    title: 'To failure',
    def: 'Doing reps until you physically cannot do another one with good form. Used sparingly on the last set to push a muscle hard.',
  },
  isometric: {
    title: 'Isometric',
    def: 'Holding a position under tension without moving — like a plank. The muscle works hard even though nothing is moving.',
  },
  'progressive overload': {
    title: 'Progressive overload',
    def: 'The core rule of getting stronger: gradually do a bit more over time — more weight, more reps, or better control — so your body keeps adapting.',
  },
  deficit: {
    title: 'Calorie deficit',
    def: 'Eating slightly less than your body burns, so you lose fat over time.',
  },
  cut: {
    title: 'Cut',
    def: 'A phase where you eat in a calorie deficit to lose fat while keeping as much muscle as possible.',
  },
  recomp: {
    title: 'Recomp (body recomposition)',
    def: 'Slowly losing fat and building muscle at the same time, staying near the same body weight. The scale barely moves but you look leaner.',
  },
  maintenance: {
    title: 'Maintenance calories',
    def: 'The amount you can eat to stay at your current weight — you burn as much as you eat.',
  },
  macros: {
    title: 'Macros',
    def: 'The three nutrients that make up your calories: protein, carbs and fat. "Hitting your macros" means eating the right amount of each.',
  },
  'protein floor': {
    title: 'Protein floor',
    def: 'The minimum protein to eat every day. Hit this first — it protects your muscle, especially while losing fat.',
  },
  if: {
    title: 'IF — Intermittent fasting',
    def: 'Eating within a shorter window each day (e.g. skipping breakfast). It has no magic — it just helps some people eat fewer calories. Optional.',
  },
  refeed: {
    title: 'Refeed day',
    def: 'A planned day of eating up to maintenance calories (a bit more than your diet days) to recover energy when things feel run-down.',
  },
  'zone 2': {
    title: 'Zone 2 cardio',
    def: 'Easy, steady cardio where you can still hold a conversation. Great for building fitness and burning fat without much fatigue.',
  },
  rpe: {
    title: 'RPE — Rate of Perceived Effort',
    def: 'How hard it felt, on a scale of 1–10. 1 is a stroll, 10 is all-out. A quick way to log intensity without a heart-rate monitor.',
  },
  met: {
    title: 'MET',
    def: 'A number for how intense an activity is, used to estimate calories burned. Higher MET = harder activity. Just background math for the estimate.',
  },
  'under-recovery': {
    title: 'Under-recovery',
    def: 'When training, sleep and food aren\'t balanced and your body isn\'t bouncing back — strength stalls and you feel run-down. The fix is usually more rest or food.',
  },
  hinge: {
    title: 'Hinge',
    def: 'Bending at the hips (not the waist) by pushing your butt back, keeping your back flat — the move behind deadlifts and hip thrusts.',
  },
  negative: {
    title: 'The negative',
    def: 'The lowering half of a rep. Controlling it slowly builds more muscle than dropping the weight.',
  },
  brace: {
    title: 'Brace / bracing',
    def: 'Tightening your core as if about to be lightly punched in the stomach. It protects your spine and keeps you stable under load.',
  },
  'external rotation': {
    title: 'External rotation',
    def: 'Rotating your forearm/upper arm outward, away from your body. A small move that keeps the shoulder healthy.',
  },
  'pelvic tilt': {
    title: 'Pelvic tilt',
    def: 'Tucking your hips slightly under (rolling the belt-buckle up) so your lower back stays flat instead of arching.',
  },
  'glute medius': {
    title: 'Glute medius (side-glute)',
    def: 'The smaller glute muscle on the side of your hip. Training it rounds out the hip and reduces the "hip-dip" look.',
  },
  soleus: {
    title: 'Soleus',
    def: 'The lower calf muscle, worked with bent knees (seated calf raises).',
  },
  cervical: {
    title: 'Cervical',
    def: 'Relating to the neck (the cervical spine). "Cervical-sensitive" just means go easy on movements that strain the neck.',
  },
  isolation: {
    title: 'Isolation exercise',
    def: 'An exercise that works one muscle at a time (like a bicep curl), versus a compound move that works several at once.',
  },
  compound: {
    title: 'Compound exercise',
    def: 'An exercise that works several muscles and joints at once (like a squat or row) — the big bang-for-buck movements.',
  },
}

/** Normalise a lookup key: lowercase, collapse whitespace and dashes. */
function norm(key: string): string {
  return key.trim().toLowerCase()
}

/** Look up a glossary entry by term (case/spacing-insensitive). */
export function glossaryEntry(term: string): GlossaryEntry | undefined {
  return RAW[norm(term)]
}

export const glossary = RAW
