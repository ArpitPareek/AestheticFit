export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_food_estimates: {
        Row: {
          id: number
          normalized_name: string
          name: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          serving_size: string
          serving_grams: number
          source: string
          created_at: string
        }
        Insert: {
          id: number
          normalized_name: string
          name: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          serving_size: string
          serving_grams: number
          source: string
          created_at: string
        }
        Update: {
          id?: number
          normalized_name?: string
          name?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          serving_size?: string
          serving_grams?: number
          source?: string
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          version: number
          responses: Json
          completed_at: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          version: number
          responses: Json
          completed_at?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          version?: number
          responses?: Json
          completed_at?: string
          created_at?: string
        }
      }
      cardio_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          type: string
          minutes: number
          intensity: string
          notes: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          log_date: string
          type: string
          minutes: number
          intensity: string
          notes?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          type?: string
          minutes?: number
          intensity?: string
          notes?: string
          created_at?: string
        }
      }
      custom_exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          primary_muscle: string
          secondary_muscles: unknown[]
          movement_pattern: string
          equipment: unknown[]
          difficulty: string
          cues: Json
          youtube_id: string
          gif_url: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          primary_muscle?: string
          secondary_muscles?: unknown[]
          movement_pattern?: string
          equipment?: unknown[]
          difficulty?: string
          cues?: Json
          youtube_id?: string
          gif_url?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          primary_muscle?: string
          secondary_muscles?: unknown[]
          movement_pattern?: string
          equipment?: unknown[]
          difficulty?: string
          cues?: Json
          youtube_id?: string
          gif_url?: string
          created_at?: string
        }
      }
      custom_foods: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          aliases: unknown[]
          serving_label: string
          serving_grams: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          is_recipe: boolean
          is_veg: boolean
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          category?: string
          aliases?: unknown[]
          serving_label: string
          serving_grams?: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          is_recipe: boolean
          is_veg: boolean
          source: string
          created_at: string
          updated_at: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          aliases?: unknown[]
          serving_label?: string
          serving_grams?: number
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          is_recipe?: boolean
          is_veg?: boolean
          source?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          steps: number
          sleep_hours: number
          water_glasses: number
          notes: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          log_date: string
          steps?: number
          sleep_hours?: number
          water_glasses?: number
          notes?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          steps?: number
          sleep_hours?: number
          water_glasses?: number
          notes?: string
          created_at?: string
        }
      }
      exercise_library: {
        Row: {
          id: string
          name: string
          primary_muscle: string
          secondary_muscles: unknown[]
          movement_pattern: string
          equipment: unknown[]
          difficulty: string
          instructions: string
          form_cues: unknown[]
          common_mistakes: unknown[]
          youtube_search_url: string
          alternatives: unknown[]
          created_at: string
          cues: Json
          youtube_id: string
          gif_url: string
          stability_demand: string
          sfr_rating: number
          contraindications: unknown[]
          media_attribution: string
          media_license: string
          deprecated: boolean
        }
        Insert: {
          id: string
          name: string
          primary_muscle: string
          secondary_muscles: unknown[]
          movement_pattern: string
          equipment: unknown[]
          difficulty: string
          instructions?: string
          form_cues: unknown[]
          common_mistakes: unknown[]
          youtube_search_url?: string
          alternatives: unknown[]
          created_at: string
          cues?: Json
          youtube_id?: string
          gif_url?: string
          stability_demand?: string
          sfr_rating?: number
          contraindications?: unknown[]
          media_attribution?: string
          media_license?: string
          deprecated: boolean
        }
        Update: {
          id?: string
          name?: string
          primary_muscle?: string
          secondary_muscles?: unknown[]
          movement_pattern?: string
          equipment?: unknown[]
          difficulty?: string
          instructions?: string
          form_cues?: unknown[]
          common_mistakes?: unknown[]
          youtube_search_url?: string
          alternatives?: unknown[]
          created_at?: string
          cues?: Json
          youtube_id?: string
          gif_url?: string
          stability_demand?: string
          sfr_rating?: number
          contraindications?: unknown[]
          media_attribution?: string
          media_license?: string
          deprecated?: boolean
        }
      }
      exercise_logs: {
        Row: {
          id: string
          user_id: string
          workout_log_id: string
          exercise_id: string
          exercise_name: string
          order_index: number
          sets: Json
          created_at: string
          library_exercise_id: string
          custom_exercise_id: string
          swapped_from_ref: string
          swap_reason: string
          is_ad_hoc: boolean
          plan_version_id: string
          ladder_assist_kg: number
          ladder_surface_level: string
        }
        Insert: {
          id: string
          user_id: string
          workout_log_id: string
          exercise_id?: string
          exercise_name: string
          order_index: number
          sets: Json
          created_at: string
          library_exercise_id?: string
          custom_exercise_id?: string
          swapped_from_ref?: string
          swap_reason?: string
          is_ad_hoc: boolean
          plan_version_id?: string
          ladder_assist_kg?: number
          ladder_surface_level?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_log_id?: string
          exercise_id?: string
          exercise_name?: string
          order_index?: number
          sets?: Json
          created_at?: string
          library_exercise_id?: string
          custom_exercise_id?: string
          swapped_from_ref?: string
          swap_reason?: string
          is_ad_hoc?: boolean
          plan_version_id?: string
          ladder_assist_kg?: number
          ladder_surface_level?: string
        }
      }
      food_aliases: {
        Row: {
          id: number
          alias_text: string
          food_id: string
        }
        Insert: {
          id: number
          alias_text: string
          food_id: string
        }
        Update: {
          id?: number
          alias_text?: string
          food_id?: string
        }
      }
      food_library: {
        Row: {
          id: string
          name: string
          aliases: unknown[]
          category: string
          is_vegetarian: boolean
          serving_size: string
          serving_grams: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          source: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          aliases: unknown[]
          category: string
          is_vegetarian: boolean
          serving_size: string
          serving_grams: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          source: string
          created_at: string
        }
        Update: {
          id?: string
          name?: string
          aliases?: unknown[]
          category?: string
          is_vegetarian?: boolean
          serving_size?: string
          serving_grams?: number
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          source?: string
          created_at?: string
        }
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: string
          food_id: string
          food_name: string
          servings: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          notes: string
          created_at: string
          custom_food_id: string
          item_label: string
          fiber_g: number
          source: string
        }
        Insert: {
          id: string
          user_id: string
          log_date: string
          meal_type: string
          food_id?: string
          food_name: string
          servings: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          notes?: string
          created_at: string
          custom_food_id?: string
          item_label?: string
          fiber_g?: number
          source?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          meal_type?: string
          food_id?: string
          food_name?: string
          servings?: number
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          notes?: string
          created_at?: string
          custom_food_id?: string
          item_label?: string
          fiber_g?: number
          source?: string
        }
      }
      nutrition_config: {
        Row: {
          user_id: string
          goal_mode: string
          trend_window_days: number
          target_rate_kg_week: number
          calorie_floor: number
          calorie_cap: number
          protein_g_target: number
          activity_multiplier: number
          min_log_adherence: number
          adjust_interval_days: number
          last_adjusted_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          goal_mode: string
          trend_window_days: number
          target_rate_kg_week: number
          calorie_floor: number
          calorie_cap?: number
          protein_g_target: number
          activity_multiplier: number
          min_log_adherence: number
          adjust_interval_days: number
          last_adjusted_at?: string
          updated_at: string
        }
        Update: {
          user_id?: string
          goal_mode?: string
          trend_window_days?: number
          target_rate_kg_week?: number
          calorie_floor?: number
          calorie_cap?: number
          protein_g_target?: number
          activity_multiplier?: number
          min_log_adherence?: number
          adjust_interval_days?: number
          last_adjusted_at?: string
          updated_at?: string
        }
      }
      nutrition_target_history: {
        Row: {
          id: string
          user_id: string
          effective_date: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          deficit_kcal: number
          goal_mode: string
          reason: string
          source: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          effective_date: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g?: number
          deficit_kcal?: number
          goal_mode?: string
          reason?: string
          source?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          effective_date?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          deficit_kcal?: number
          goal_mode?: string
          reason?: string
          source?: string
          created_at?: string
        }
      }
      nutrition_targets: {
        Row: {
          user_id: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          updated_at: string
        }
        Insert: {
          user_id: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g?: number
          updated_at: string
        }
        Update: {
          user_id?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          updated_at?: string
        }
      }
      portion_conversions: {
        Row: {
          food_id: string
          unit: string
          grams_equivalent: number
        }
        Insert: {
          food_id: string
          unit: string
          grams_equivalent: number
        }
        Update: {
          food_id?: string
          unit?: string
          grams_equivalent?: number
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          age: number
          sex: string
          height_cm: number
          current_weight_kg: number
          target_weight_kg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          age?: number
          sex?: string
          height_cm?: number
          current_weight_kg?: number
          target_weight_kg?: number
          created_at: string
          updated_at: string
        }
        Update: {
          id?: string
          display_name?: string
          age?: number
          sex?: string
          height_cm?: number
          current_weight_kg?: number
          target_weight_kg?: number
          created_at?: string
          updated_at?: string
        }
      }
      progress_photos: {
        Row: {
          id: string
          user_id: string
          taken_on: string
          pose: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          taken_on: string
          pose: string
          storage_path: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          taken_on?: string
          pose?: string
          storage_path?: string
          created_at?: string
        }
      }
      rate_limit: {
        Row: {
          user_id: string
          bucket: string
          window_start: string
          count: number
        }
        Insert: {
          user_id: string
          bucket: string
          window_start: string
          count: number
        }
        Update: {
          user_id?: string
          bucket?: string
          window_start?: string
          count?: number
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          library_food_id: string
          custom_food_id: string
          quantity_servings: number
        }
        Insert: {
          id: string
          recipe_id: string
          library_food_id?: string
          custom_food_id?: string
          quantity_servings: number
        }
        Update: {
          id?: string
          recipe_id?: string
          library_food_id?: string
          custom_food_id?: string
          quantity_servings?: number
        }
      }
      skin_checkins: {
        Row: {
          id: string
          user_id: string
          checkin_date: string
          texture_score: number
          evenness_score: number
          hydration_score: number
          breakout_level: string
          notes: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          checkin_date: string
          texture_score: number
          evenness_score: number
          hydration_score: number
          breakout_level: string
          notes?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          checkin_date?: string
          texture_score?: number
          evenness_score?: number
          hydration_score?: number
          breakout_level?: string
          notes?: string
          created_at?: string
        }
      }
      skin_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          routine_type: string
          steps_done: Json
          notes: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          log_date: string
          routine_type: string
          steps_done: Json
          notes?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          routine_type?: string
          steps_done?: Json
          notes?: string
          created_at?: string
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          streak_type: string
          current_count: number
          longest_count: number
          last_active_date: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          streak_type: string
          current_count: number
          longest_count: number
          last_active_date?: string
          updated_at: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_type?: string
          current_count?: number
          longest_count?: number
          last_active_date?: string
          updated_at?: string
        }
      }
      tdee_estimates: {
        Row: {
          id: string
          user_id: string
          calc_date: string
          method: string
          window_days: number
          avg_intake_kcal: number
          trend_weight_start_kg: number
          trend_weight_end_kg: number
          weight_delta_kg: number
          estimated_tdee_kcal: number
          log_adherence: number
          confidence: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          calc_date: string
          method: string
          window_days?: number
          avg_intake_kcal?: number
          trend_weight_start_kg?: number
          trend_weight_end_kg?: number
          weight_delta_kg?: number
          estimated_tdee_kcal?: number
          log_adherence?: number
          confidence?: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          calc_date?: string
          method?: string
          window_days?: number
          avg_intake_kcal?: number
          trend_weight_start_kg?: number
          trend_weight_end_kg?: number
          weight_delta_kg?: number
          estimated_tdee_kcal?: number
          log_adherence?: number
          confidence?: string
          created_at?: string
        }
      }
      weight_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          weight_kg: number
          waist_cm: number
          notes: string
          created_at: string
          hip_cm: number
          bust_cm: number
        }
        Insert: {
          id: string
          user_id: string
          log_date: string
          weight_kg: number
          waist_cm?: number
          notes?: string
          created_at: string
          hip_cm?: number
          bust_cm?: number
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          weight_kg?: number
          waist_cm?: number
          notes?: string
          created_at?: string
          hip_cm?: number
          bust_cm?: number
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          plan_version: number
          workout_date: string
          day_label: string
          started_at: string
          completed_at: string
          notes: string
          created_at: string
          prehab_skipped: boolean
        }
        Insert: {
          id: string
          user_id: string
          plan_id?: string
          plan_version?: number
          workout_date: string
          day_label?: string
          started_at: string
          completed_at?: string
          notes?: string
          created_at: string
          prehab_skipped: boolean
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          plan_version?: number
          workout_date?: string
          day_label?: string
          started_at?: string
          completed_at?: string
          notes?: string
          created_at?: string
          prehab_skipped?: boolean
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          plan_version: number
          plan_name: string
          plan_data: Json
          phase: number
          total_phases: number
          weeks_per_phase: number
          start_date: string
          is_active: boolean
          created_at: string
          plan_source: string
          sort_order: number
          phase_weeks: number
        }
        Insert: {
          id: string
          user_id: string
          assessment_id?: string
          plan_version: number
          plan_name: string
          plan_data: Json
          phase: number
          total_phases: number
          weeks_per_phase: number
          start_date?: string
          is_active: boolean
          created_at: string
          plan_source: string
          sort_order?: number
          phase_weeks?: number
        }
        Update: {
          id?: string
          user_id?: string
          assessment_id?: string
          plan_version?: number
          plan_name?: string
          plan_data?: Json
          phase?: number
          total_phases?: number
          weeks_per_phase?: number
          start_date?: string
          is_active?: boolean
          created_at?: string
          plan_source?: string
          sort_order?: number
          phase_weeks?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']