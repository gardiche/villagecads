export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      alignment_history: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          new_details: Json
          new_score: number
          previous_details: Json | null
          previous_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          new_details: Json
          new_score: number
          previous_details?: Json | null
          previous_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          new_details?: Json
          new_score?: number
          previous_details?: Json | null
          previous_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      alignment_scores: {
        Row: {
          created_at: string
          details: Json
          id: string
          idea_id: string
          score_global: number
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          idea_id: string
          score_global?: number
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          idea_id?: string
          score_global?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_scores_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_path: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_path?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assessment_history: {
        Row: {
          assessment_id: string
          big_five_traits: Json | null
          changed_at: string | null
          id: string
          life_spheres: Json | null
          riasec_scores: Json | null
          schwartz_values: Json | null
          user_context: Json | null
          user_id: string
          version: number
        }
        Insert: {
          assessment_id: string
          big_five_traits?: Json | null
          changed_at?: string | null
          id?: string
          life_spheres?: Json | null
          riasec_scores?: Json | null
          schwartz_values?: Json | null
          user_context?: Json | null
          user_id: string
          version: number
        }
        Update: {
          assessment_id?: string
          big_five_traits?: Json | null
          changed_at?: string | null
          id?: string
          life_spheres?: Json | null
          riasec_scores?: Json | null
          schwartz_values?: Json | null
          user_context?: Json | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_history_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      astryd_debug_logs: {
        Row: {
          created_at: string
          error: string | null
          full_ai_response: string
          id: string
          idea_id: string | null
          model_used: string
          parsed_result: Json | null
          payload_sent: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          full_ai_response: string
          id?: string
          idea_id?: string | null
          model_used: string
          parsed_result?: Json | null
          payload_sent: Json
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          full_ai_response?: string
          id?: string
          idea_id?: string | null
          model_used?: string
          parsed_result?: Json | null
          payload_sent?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astryd_debug_logs_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      astryd_sessions: {
        Row: {
          alignment_energy: number | null
          alignment_finances: number | null
          alignment_motivation: number | null
          alignment_skills: number | null
          alignment_support: number | null
          alignment_time: number | null
          attention_zones: Json | null
          created_at: string
          decision: string | null
          id: string
          idea_documents: Json | null
          idea_id: string | null
          idea_summary: string | null
          idea_title: string
          journal_message_count: number | null
          journal_questions: Json | null
          maturity_score_current: number
          maturity_score_initial: number
          micro_actions: Json | null
          micro_actions_completed_count: number | null
          updated_at: string
          user_hash: string | null
          user_id: string
        }
        Insert: {
          alignment_energy?: number | null
          alignment_finances?: number | null
          alignment_motivation?: number | null
          alignment_skills?: number | null
          alignment_support?: number | null
          alignment_time?: number | null
          attention_zones?: Json | null
          created_at?: string
          decision?: string | null
          id?: string
          idea_documents?: Json | null
          idea_id?: string | null
          idea_summary?: string | null
          idea_title: string
          journal_message_count?: number | null
          journal_questions?: Json | null
          maturity_score_current: number
          maturity_score_initial: number
          micro_actions?: Json | null
          micro_actions_completed_count?: number | null
          updated_at?: string
          user_hash?: string | null
          user_id: string
        }
        Update: {
          alignment_energy?: number | null
          alignment_finances?: number | null
          alignment_motivation?: number | null
          alignment_skills?: number | null
          alignment_support?: number | null
          alignment_time?: number | null
          attention_zones?: Json | null
          created_at?: string
          decision?: string | null
          id?: string
          idea_documents?: Json | null
          idea_id?: string | null
          idea_summary?: string | null
          idea_title?: string
          journal_message_count?: number | null
          journal_questions?: Json | null
          maturity_score_current?: number
          maturity_score_initial?: number
          micro_actions?: Json | null
          micro_actions_completed_count?: number | null
          updated_at?: string
          user_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astryd_sessions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_history: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          label: string
          new_severity: number | null
          previous_severity: number | null
          resolved: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          label: string
          new_severity?: number | null
          previous_severity?: number | null
          resolved?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          label?: string
          new_severity?: number | null
          previous_severity?: number | null
          resolved?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      attention_zones: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string
          generation_version: number | null
          id: string
          idea_id: string
          label: string
          recommendation: string | null
          severity: number
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          generation_version?: number | null
          id?: string
          idea_id: string
          label: string
          recommendation?: string | null
          severity?: number
          user_id: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          generation_version?: number | null
          id?: string
          idea_id?: string
          label?: string
          recommendation?: string | null
          severity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_zones_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          plan: string
          revoked: boolean | null
          revoked_at: string | null
          revoked_by: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          plan?: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_by?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          plan?: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_by?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      beta_code_usage: {
        Row: {
          code_id: string | null
          id: string
          used_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          code_id?: string | null
          id?: string
          used_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          code_id?: string | null
          id?: string
          used_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_code_usage_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      big_five_traits: {
        Row: {
          agreabilite: number | null
          assessment_id: string
          conscienciosite: number | null
          extraversion: number | null
          id: string
          nevrosisme: number | null
          ouverture: number | null
        }
        Insert: {
          agreabilite?: number | null
          assessment_id: string
          conscienciosite?: number | null
          extraversion?: number | null
          id?: string
          nevrosisme?: number | null
          ouverture?: number | null
        }
        Update: {
          agreabilite?: number | null
          assessment_id?: string
          conscienciosite?: number | null
          extraversion?: number | null
          id?: string
          nevrosisme?: number | null
          ouverture?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "big_five_traits_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          cohort_id: string
          created_at: string | null
          entrepreneur_id: string
          id: string
          mentor_id: string | null
        }
        Insert: {
          cohort_id: string
          created_at?: string | null
          entrepreneur_id: string
          id?: string
          mentor_id?: string | null
        }
        Update: {
          cohort_id?: string
          created_at?: string | null
          entrepreneur_id?: string
          id?: string
          mentor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_objectives: {
        Row: {
          cohort_id: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          target_actions_per_week: number | null
          target_active_rate: number | null
          target_avg_mood: number | null
          target_usage_per_week: number | null
          title: string
          updated_at: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          target_actions_per_week?: number | null
          target_active_rate?: number | null
          target_avg_mood?: number | null
          target_usage_per_week?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          target_actions_per_week?: number | null
          target_active_rate?: number | null
          target_avg_mood?: number | null
          target_usage_per_week?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_objectives_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_months: number | null
          end_date: string | null
          id: string
          milestones: Json
          name: string
          program_objective: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          milestones?: Json
          name: string
          program_objective?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          milestones?: Json
          name?: string
          program_objective?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      commitment_history: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          status_after: string
          status_before: string | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          status_after: string
          status_before?: string | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          status_after?: string
          status_before?: string | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          clarity_level: number
          created_at: string
          energy_level: number
          id: string
          journal_entry: string | null
          mood_level: number
          shared_with_mentor: boolean
          user_id: string
        }
        Insert: {
          clarity_level: number
          created_at?: string
          energy_level: number
          id?: string
          journal_entry?: string | null
          mood_level: number
          shared_with_mentor?: boolean
          user_id: string
        }
        Update: {
          clarity_level?: number
          created_at?: string
          energy_level?: number
          id?: string
          journal_entry?: string | null
          mood_level?: number
          shared_with_mentor?: boolean
          user_id?: string
        }
        Relationships: []
      }
      daily_micro_actions: {
        Row: {
          action_type: string
          checkin_id: string | null
          created_at: string
          feeling_after: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          action_type?: string
          checkin_id?: string | null
          created_at?: string
          feeling_after?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          action_type?: string
          checkin_id?: string | null
          created_at?: string
          feeling_after?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_micro_actions_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          rationale: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          rationale?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          rationale?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      gauge_history: {
        Row: {
          created_at: string
          gauge_name: string
          id: string
          idea_id: string
          new_value: number
          previous_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gauge_name: string
          id?: string
          idea_id: string
          new_value: number
          previous_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          gauge_name?: string
          id?: string
          idea_id?: string
          new_value?: number
          previous_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      guest_results_temp: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          persona_data: Json
          retrieved: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          persona_data: Json
          retrieved?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          persona_data?: Json
          retrieved?: boolean | null
        }
        Relationships: []
      }
      idea_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          idea_id: string
          parsed_content: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          idea_id: string
          parsed_content?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          idea_id?: string
          parsed_content?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          payload?: Json
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_usage: {
        Row: {
          id: string
          invitation_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          invitation_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          invitation_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_usage_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "mentor_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ai_context: Json | null
          content: string
          created_at: string
          entry_type: Database["public"]["Enums"]["journal_entry_type"] | null
          id: string
          idea_id: string | null
          metadata: Json | null
          mood: string | null
          prompt: string | null
          psychological_distress_detected: boolean | null
          sender: string
          shared_with_mentor: boolean | null
          user_id: string
        }
        Insert: {
          ai_context?: Json | null
          content: string
          created_at?: string
          entry_type?: Database["public"]["Enums"]["journal_entry_type"] | null
          id?: string
          idea_id?: string | null
          metadata?: Json | null
          mood?: string | null
          prompt?: string | null
          psychological_distress_detected?: boolean | null
          sender?: string
          shared_with_mentor?: boolean | null
          user_id: string
        }
        Update: {
          ai_context?: Json | null
          content?: string
          created_at?: string
          entry_type?: Database["public"]["Enums"]["journal_entry_type"] | null
          id?: string
          idea_id?: string | null
          metadata?: Json | null
          mood?: string | null
          prompt?: string | null
          psychological_distress_detected?: boolean | null
          sender?: string
          shared_with_mentor?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_questions: {
        Row: {
          answered: boolean | null
          context: Json | null
          created_at: string | null
          id: string
          idea_id: string | null
          question: string
          user_id: string
          week_start: string
        }
        Insert: {
          answered?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          question: string
          user_id: string
          week_start: string
        }
        Update: {
          answered?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          idea_id?: string | null
          question?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_questions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      life_spheres: {
        Row: {
          amis: number | null
          assessment_id: string
          couple: number | null
          famille: number | null
          id: string
          loisirs: number | null
          pro: number | null
          soi: number | null
        }
        Insert: {
          amis?: number | null
          assessment_id: string
          couple?: number | null
          famille?: number | null
          id?: string
          loisirs?: number | null
          pro?: number | null
          soi?: number | null
        }
        Update: {
          amis?: number | null
          assessment_id?: string
          couple?: number | null
          famille?: number | null
          id?: string
          loisirs?: number | null
          pro?: number | null
          soi?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "life_spheres_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      maturity_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          idea_id: string
          new_score: number
          previous_score: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          idea_id: string
          new_score: number
          previous_score?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          idea_id?: string
          new_score?: number
          previous_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      maturity_scores: {
        Row: {
          base_alignment_score: number
          created_at: string
          id: string
          idea_id: string
          progression_bonus: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_alignment_score?: number
          created_at?: string
          id?: string
          idea_id: string
          progression_bonus?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_alignment_score?: number
          created_at?: string
          id?: string
          idea_id?: string
          progression_bonus?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_invitations: {
        Row: {
          cohort_id: string
          created_at: string
          id: string
          invite_code: string
          is_active: boolean
          mentor_id: string
          used_count: number
        }
        Insert: {
          cohort_id: string
          created_at?: string
          id?: string
          invite_code: string
          is_active?: boolean
          mentor_id: string
          used_count?: number
        }
        Update: {
          cohort_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          mentor_id?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentor_invitations_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_sharing: {
        Row: {
          activated_at: string | null
          created_at: string | null
          entrepreneur_id: string
          id: string
          is_active: boolean | null
          mentor_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          entrepreneur_id: string
          id?: string
          is_active?: boolean | null
          mentor_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          entrepreneur_id?: string
          id?: string
          is_active?: boolean | null
          mentor_id?: string
        }
        Relationships: []
      }
      micro_commitments: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string
          due_date: string | null
          duree: string | null
          generation_version: number | null
          id: string
          idea_id: string
          impact_attendu: string | null
          jauge_ciblee: string | null
          objectif: string | null
          period: string
          status: string
          text: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          due_date?: string | null
          duree?: string | null
          generation_version?: number | null
          id?: string
          idea_id: string
          impact_attendu?: string | null
          jauge_ciblee?: string | null
          objectif?: string | null
          period?: string
          status?: string
          text: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          due_date?: string | null
          duree?: string | null
          generation_version?: number | null
          id?: string
          idea_id?: string
          impact_attendu?: string | null
          jauge_ciblee?: string | null
          objectif?: string | null
          period?: string
          status?: string
          text?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "micro_commitments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_exports: {
        Row: {
          created_at: string
          export_type: string
          file_path: string
          id: string
          idea_id: string | null
          insights_summary: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          export_type?: string
          file_path: string
          id?: string
          idea_id?: string | null
          insights_summary?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          export_type?: string
          file_path?: string
          id?: string
          idea_id?: string | null
          insights_summary?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      persona_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          persona_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          persona_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          persona_data?: Json
        }
        Relationships: []
      }
      posture_assessments: {
        Row: {
          aversion_risque: number | null
          created_at: string
          environment: Json
          id: string
          idea_id: string
          life_spheres: Json
          motivation: number | null
          user_id: string
        }
        Insert: {
          aversion_risque?: number | null
          created_at?: string
          environment?: Json
          id?: string
          idea_id: string
          life_spheres?: Json
          motivation?: number | null
          user_id: string
        }
        Update: {
          aversion_risque?: number | null
          created_at?: string
          environment?: Json
          id?: string
          idea_id?: string
          life_spheres?: Json
          motivation?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posture_assessments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_leads: {
        Row: {
          contacted: boolean | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          role: string
          structure_name: string
          volume_clients: string
        }
        Insert: {
          contacted?: boolean | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          role: string
          structure_name: string
          volume_clients: string
        }
        Update: {
          contacted?: boolean | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          role?: string
          structure_name?: string
          volume_clients?: string
        }
        Relationships: []
      }
      profile_shares: {
        Row: {
          created_at: string | null
          forces: Json | null
          id: string
          persona_synthese: string | null
          persona_titre: string
          persona_visual_url: string | null
          share_code: string
          user_id: string
          verrous: Json | null
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          forces?: Json | null
          id?: string
          persona_synthese?: string | null
          persona_titre: string
          persona_visual_url?: string | null
          share_code: string
          user_id: string
          verrous?: Json | null
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          forces?: Json | null
          id?: string
          persona_synthese?: string | null
          persona_titre?: string
          persona_visual_url?: string | null
          share_code?: string
          user_id?: string
          verrous?: Json | null
          views_count?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      riasec_scores: {
        Row: {
          artistique: number | null
          assessment_id: string
          conventionnel: number | null
          entreprenant: number | null
          id: string
          investigateur: number | null
          realiste: number | null
          social: number | null
        }
        Insert: {
          artistique?: number | null
          assessment_id: string
          conventionnel?: number | null
          entreprenant?: number | null
          id?: string
          investigateur?: number | null
          realiste?: number | null
          social?: number | null
        }
        Update: {
          artistique?: number | null
          assessment_id?: string
          conventionnel?: number | null
          entreprenant?: number | null
          id?: string
          investigateur?: number | null
          realiste?: number | null
          social?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "riasec_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      schwartz_values: {
        Row: {
          accomplissement: number | null
          assessment_id: string
          autonomie: number | null
          bienveillance: number | null
          conformite: number | null
          hedonisme: number | null
          id: string
          pouvoir: number | null
          securite: number | null
          stimulation: number | null
          tradition: number | null
          universalisme: number | null
        }
        Insert: {
          accomplissement?: number | null
          assessment_id: string
          autonomie?: number | null
          bienveillance?: number | null
          conformite?: number | null
          hedonisme?: number | null
          id?: string
          pouvoir?: number | null
          securite?: number | null
          stimulation?: number | null
          tradition?: number | null
          universalisme?: number | null
        }
        Update: {
          accomplissement?: number | null
          assessment_id?: string
          autonomie?: number | null
          bienveillance?: number | null
          conformite?: number | null
          hedonisme?: number | null
          id?: string
          pouvoir?: number | null
          securite?: number | null
          stimulation?: number | null
          tradition?: number | null
          universalisme?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schwartz_values_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          message: string
          read: boolean | null
          role: string | null
          session_id: string | null
          user_context: Json | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message: string
          read?: boolean | null
          role?: string | null
          session_id?: string | null
          user_context?: Json | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message?: string
          read?: boolean | null
          role?: string | null
          session_id?: string | null
          user_context?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_analytics_events: {
        Row: {
          assessment_id: string
          created_at: string
          event_data: Json
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_assessments: {
        Row: {
          chosen_project_id: string | null
          completed: boolean | null
          created_at: string
          id: string
          ready_score: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          chosen_project_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          ready_score?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          chosen_project_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          ready_score?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      user_context: {
        Row: {
          assessment_id: string
          budget_test_30j: string | null
          charge_mentale: string | null
          competences_techniques: Json | null
          energie_sociale: string | null
          experience_entrepreneuriat: string | null
          id: string
          reseau_professionnel: string | null
          situation_financiere: string | null
          situation_pro: string | null
          soutien_entourage: string | null
          temps_disponible: string | null
          tolerance_risque: string | null
        }
        Insert: {
          assessment_id: string
          budget_test_30j?: string | null
          charge_mentale?: string | null
          competences_techniques?: Json | null
          energie_sociale?: string | null
          experience_entrepreneuriat?: string | null
          id?: string
          reseau_professionnel?: string | null
          situation_financiere?: string | null
          situation_pro?: string | null
          soutien_entourage?: string | null
          temps_disponible?: string | null
          tolerance_risque?: string | null
        }
        Update: {
          assessment_id?: string
          budget_test_30j?: string | null
          charge_mentale?: string | null
          competences_techniques?: Json | null
          energie_sociale?: string | null
          experience_entrepreneuriat?: string | null
          id?: string
          reseau_professionnel?: string | null
          situation_financiere?: string | null
          situation_pro?: string | null
          soutien_entourage?: string | null
          temps_disponible?: string | null
          tolerance_risque?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_context_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "user_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_profiles: {
        Row: {
          assessment_id: string
          cv_analyzed: boolean | null
          cv_file_path: string | null
          cv_insights: Json | null
          cv_uploaded: boolean | null
          feature_preferences: Json
          id: string
          pillar_weights: Json
          projects_swiped: number | null
          uncertainty_level: number | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          cv_analyzed?: boolean | null
          cv_file_path?: string | null
          cv_insights?: Json | null
          cv_uploaded?: boolean | null
          feature_preferences?: Json
          id?: string
          pillar_weights?: Json
          projects_swiped?: number | null
          uncertainty_level?: number | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          cv_analyzed?: boolean | null
          cv_file_path?: string | null
          cv_insights?: Json | null
          cv_uploaded?: boolean | null
          feature_preferences?: Json
          id?: string
          pillar_weights?: Json
          projects_swiped?: number | null
          uncertainty_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      clean_expired_guest_results: { Args: never; Returns: undefined }
      clean_expired_persona_cache: { Args: never; Returns: undefined }
      clean_old_rate_limits: { Args: never; Returns: undefined }
      clean_why_you_scores: { Args: never; Returns: undefined }
      get_distress_alerts: {
        Args: never
        Returns: {
          created_at: string
          entry_type: Database["public"]["Enums"]["journal_entry_type"]
          id: string
          sender: string
          user_id: string
        }[]
      }
      get_profile_share: {
        Args: { p_share_code: string }
        Returns: {
          forces: Json
          id: string
          persona_synthese: string
          persona_titre: string
          persona_visual_url: string
          verrous: Json
          views_count: number
        }[]
      }
      get_user_plan: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      has_plan_access: {
        Args: {
          required_plan: Database["public"]["Enums"]["subscription_plan"]
          user_uuid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_title: { Args: { title: string }; Returns: string }
      validate_guest_result_access: {
        Args: { result_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "mentor" | "manager"
      journal_entry_type: "checkin" | "micro_action" | "note" | "ai_response"
      riasec_code: "R" | "I" | "A" | "S" | "E" | "C"
      subscription_plan: "declic" | "cap" | "elan"
      subscription_status:
        | "active"
        | "cancelled"
        | "expired"
        | "past_due"
        | "trialing"
        | "incomplete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "mentor", "manager"],
      journal_entry_type: ["checkin", "micro_action", "note", "ai_response"],
      riasec_code: ["R", "I", "A", "S", "E", "C"],
      subscription_plan: ["declic", "cap", "elan"],
      subscription_status: [
        "active",
        "cancelled",
        "expired",
        "past_due",
        "trialing",
        "incomplete",
      ],
    },
  },
} as const
