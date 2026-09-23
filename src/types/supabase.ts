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
        Relationships: []
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
          id?: string
          user_id: string
          version: number
          responses: Json
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          version?: number
          responses?: Json
          completed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          type: string
          minutes: number
          intensity: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          type: string
          minutes: number
          intensity: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          type?: string
          minutes?: number
          intensity?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "custom_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "custom_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          steps: number | null
          sleep_hours: number | null
          water_glasses: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          steps?: number | null
          sleep_hours?: number | null
          water_glasses?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          steps?: number | null
          sleep_hours?: number | null
          water_glasses?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
          library_exercise_id: string | null
          custom_exercise_id: string | null
          swapped_from_ref: string | null
          swap_reason: string | null
          is_ad_hoc: boolean
          plan_version_id: string | null
          ladder_assist_kg: number | null
          ladder_surface_level: number | null
        }
        Insert: {
          id?: string
          user_id: string
          workout_log_id: string
          exercise_id?: string
          exercise_name: string
          order_index: number
          sets: Json
          created_at?: string
          library_exercise_id?: string | null
          custom_exercise_id?: string | null
          swapped_from_ref?: string | null
          swap_reason?: string | null
          is_ad_hoc: boolean
          plan_version_id?: string | null
          ladder_assist_kg?: number | null
          ladder_surface_level?: number | null
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
          library_exercise_id?: string | null
          custom_exercise_id?: string | null
          swapped_from_ref?: string | null
          swap_reason?: string | null
          is_ad_hoc?: boolean
          plan_version_id?: string | null
          ladder_assist_kg?: number | null
          ladder_surface_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_library_exercise_id_fkey"
            columns: ["library_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_custom_exercise_id_fkey"
            columns: ["custom_exercise_id"]
            isOneToOne: false
            referencedRelation: "custom_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "food_aliases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: string
          food_id: string | null
          food_name: string
          servings: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          notes: string | null
          created_at: string
          custom_food_id: string | null
          item_label: string | null
          fiber_g: number
          source: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          meal_type: string
          food_id?: string | null
          food_name: string
          servings: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          notes?: string | null
          created_at?: string
          custom_food_id?: string | null
          item_label?: string | null
          fiber_g?: number
          source?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          meal_type?: string
          food_id?: string | null
          food_name?: string
          servings?: number
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          notes?: string | null
          created_at?: string
          custom_food_id?: string | null
          item_label?: string | null
          fiber_g?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "nutrition_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "nutrition_target_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "nutrition_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "portion_conversions_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          age: number | null
          sex: string | null
          height_cm: number | null
          current_weight_kg: number | null
          target_weight_kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          age?: number | null
          sex?: string | null
          height_cm?: number | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          age?: number | null
          sex?: string | null
          height_cm?: number | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          id?: string
          user_id: string
          taken_on: string
          pose: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          taken_on?: string
          pose?: string
          storage_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "rate_limit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_library_food_id_fkey"
            columns: ["library_food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_custom_food_id_fkey"
            columns: ["custom_food_id"]
            isOneToOne: false
            referencedRelation: "custom_foods"
            referencedColumns: ["id"]
          },
        ]
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
          id?: string
          user_id: string
          checkin_date: string
          texture_score: number
          evenness_score: number
          hydration_score: number
          breakout_level: string
          notes?: string
          created_at?: string
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
        Relationships: [
          {
            foreignKeyName: "skin_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id?: string
          user_id: string
          log_date: string
          routine_type: string
          steps_done: Json
          notes?: string
          created_at?: string
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
        Relationships: [
          {
            foreignKeyName: "skin_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id?: string
          user_id: string
          streak_type: string
          current_count: number
          longest_count: number
          last_active_date?: string
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tdee_estimates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          weight_kg: number
          waist_cm: number | null
          notes: string | null
          created_at: string
          hip_cm: number | null
          bust_cm: number | null
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          weight_kg: number
          waist_cm?: number | null
          notes?: string | null
          created_at?: string
          hip_cm?: number | null
          bust_cm?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          weight_kg?: number
          waist_cm?: number | null
          notes?: string | null
          created_at?: string
          hip_cm?: number | null
          bust_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id?: string
          user_id: string
          plan_id?: string
          plan_version?: number
          workout_date: string
          day_label?: string
          started_at: string
          completed_at?: string
          notes?: string
          created_at?: string
          prehab_skipped?: boolean
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
        Relationships: [
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
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
          id?: string
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
          created_at?: string
          plan_source?: string
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
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      weight_trend: {
        Row: {
          user_id: string
          log_date: string
          ma_7d: number | null
          ma_14d: number | null
          ma_28d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_plan: {
        Args: { p_user: string; p_plan: string }
        Returns: undefined
      }
      advance_to_coach_phase: {
        Args: { target_phase: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
