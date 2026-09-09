export interface AssessmentBasics {
  display_name: string
  age: number | null
  sex: 'male' | 'female' | null
  height_cm: number | null
  current_weight_kg: number | null
  target_weight_kg: number | null
}

export interface AssessmentGoals {
  primary: string
  secondary: string
  priorities: string[]
}

export interface AssessmentTraining {
  level: string
  gym_months: number | null
  frequency: number | null
  sports: string
}

export interface AssessmentAvailability {
  days_per_week: number
  session_minutes: number
  preferred_days: string[]
  time: string
}

export interface AssessmentPreferences {
  enjoy: string[]
  cannot_do: string[]
  injuries: string
  preference: 'machines' | 'free-weights' | 'bodyweight' | 'mixed'
}

export interface AssessmentLifestyle {
  cardio_preference: string[]
  daily_steps: number | null
  sleep_hours: number | null
  job_type: string
}

export interface AssessmentResponses {
  basics: AssessmentBasics
  goals: AssessmentGoals
  training: AssessmentTraining
  availability: AssessmentAvailability
  equipment: string[]
  preferences: AssessmentPreferences
  lifestyle: AssessmentLifestyle
}

export const EMPTY_ASSESSMENT: AssessmentResponses = {
  basics: {
    display_name: '',
    age: null,
    sex: null,
    height_cm: null,
    current_weight_kg: null,
    target_weight_kg: null,
  },
  goals: {
    primary: '',
    secondary: '',
    priorities: [],
  },
  training: {
    level: '',
    gym_months: null,
    frequency: null,
    sports: '',
  },
  availability: {
    days_per_week: 4,
    session_minutes: 60,
    preferred_days: [],
    time: '',
  },
  equipment: [],
  preferences: {
    enjoy: [],
    cannot_do: [],
    injuries: '',
    preference: 'mixed',
  },
  lifestyle: {
    cardio_preference: [],
    daily_steps: null,
    sleep_hours: null,
    job_type: '',
  },
}

export const PRIMARY_GOALS = [
  'Fat Loss',
  'Muscle Gain',
  'Recomposition',
  'Strength',
  'General Fitness',
] as const

export const EXPERIENCE_LEVELS = [
  'Complete Beginner',
  'Some Experience',
  'Intermediate',
  'Advanced',
] as const

export const SESSION_DURATIONS = [30, 45, 60, 75, 90] as const

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'] as const

export const EQUIPMENT_OPTIONS = [
  'Full Commercial Gym',
  'Dumbbells',
  'Barbells',
  'Cables',
  'Smith Machine',
  'Machines',
  'Pull-up Bar',
  'Bench',
  'Cardio Machines',
  'Resistance Bands',
  'Swimming Pool',
  'Badminton Court',
] as const

export const COMMON_EXERCISES = [
  'Bench Press',
  'Squats',
  'Deadlifts',
  'Overhead Press',
  'Pull-ups',
  'Rows',
  'Lunges',
  'Dips',
  'Curls',
  'Lateral Raises',
  'Leg Press',
  'Cable Flyes',
  'Face Pulls',
  'Planks',
  'Hip Thrusts',
] as const

export const CARDIO_OPTIONS = [
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Sports',
  'None',
] as const

export const JOB_TYPES = [
  'Sedentary',
  'Lightly Active',
  'Active',
] as const

export const PRIORITY_OPTIONS = [
  'Fat Loss',
  'Muscle Gain',
  'Strength',
  'Conditioning',
] as const

export const STEP_LABELS = [
  'Basics',
  'Goals',
  'Training',
  'Availability',
  'Equipment',
  'Preferences',
  'Lifestyle',
  'Review',
] as const
