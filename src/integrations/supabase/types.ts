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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_courses: {
        Row: {
          category: string | null
          course_status: string
          created_at: string
          description: string | null
          description_es: string | null
          duration_minutes: number | null
          external_url: string | null
          featured: boolean | null
          id: string
          instructor_avatar: string | null
          instructor_name: string | null
          language: string
          path_id: string
          platform: string | null
          rating: number | null
          rating_count: number | null
          skill_level: string
          skills_learned: string[] | null
          sort_order: number | null
          submitted_by: string | null
          thumbnail_url: string | null
          title: string
          title_es: string | null
          tool: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          course_status?: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          featured?: boolean | null
          id?: string
          instructor_avatar?: string | null
          instructor_name?: string | null
          language?: string
          path_id: string
          platform?: string | null
          rating?: number | null
          rating_count?: number | null
          skill_level?: string
          skills_learned?: string[] | null
          sort_order?: number | null
          submitted_by?: string | null
          thumbnail_url?: string | null
          title: string
          title_es?: string | null
          tool?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          course_status?: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          featured?: boolean | null
          id?: string
          instructor_avatar?: string | null
          instructor_name?: string | null
          language?: string
          path_id?: string
          platform?: string | null
          rating?: number | null
          rating_count?: number | null
          skill_level?: string
          skills_learned?: string[] | null
          sort_order?: number | null
          submitted_by?: string | null
          thumbnail_url?: string | null
          title?: string
          title_es?: string | null
          tool?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_courses_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_paths: {
        Row: {
          created_at: string
          description: string | null
          description_es: string | null
          icon: string | null
          id: string
          sort_order: number | null
          title: string
          title_es: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          sort_order?: number | null
          title: string
          title_es?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          title_es?: string | null
        }
        Relationships: []
      }
      academy_shared_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          likes: number | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          likes?: number | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          likes?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_tools: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_es: string | null
          icon: string | null
          id: string
          name: string
          name_es: string | null
          url: string | null
          use_cases: string[] | null
          use_cases_es: string[] | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          name: string
          name_es?: string | null
          url?: string | null
          use_cases?: string[] | null
          use_cases_es?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_es?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_es?: string | null
          url?: string | null
          use_cases?: string[] | null
          use_cases_es?: string[] | null
        }
        Relationships: []
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      explorer_course_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explorer_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      mission_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          delivered_at: string | null
          delivery_url: string | null
          id: string
          mission_id: string
          review_note: string | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          id?: string
          mission_id: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          id?: string
          mission_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_applications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          description_es: string | null
          hourly_rate: number
          hours: number
          id: string
          project_id: string
          reward: number
          skill: string
          status: string
          title: string
          title_es: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          description_es?: string | null
          hourly_rate: number
          hours: number
          id?: string
          project_id: string
          reward: number
          skill: string
          status?: string
          title: string
          title_es?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          description_es?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          project_id?: string
          reward?: number
          skill?: string
          status?: string
          title?: string
          title_es?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          education: string[] | null
          email: string | null
          full_name: string | null
          hobbies: string[] | null
          id: string
          interests: string[] | null
          onboarding_completed: boolean | null
          skills: string[] | null
          social_links: Json | null
          talents: string[] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string[] | null
          email?: string | null
          full_name?: string | null
          hobbies?: string[] | null
          id: string
          interests?: string[] | null
          onboarding_completed?: boolean | null
          skills?: string[] | null
          social_links?: Json | null
          talents?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string[] | null
          email?: string | null
          full_name?: string | null
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          onboarding_completed?: boolean | null
          skills?: string[] | null
          social_links?: Json | null
          talents?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number
          category: string
          created_at: string
          deadline: string | null
          description: string
          id: string
          payment_screenshot_url: string | null
          payment_status: string
          priority: string
          resource_link: string | null
          status: string
          title: string
          tx_hash: string | null
          user_id: string | null
          video_link: string | null
        }
        Insert: {
          budget?: number
          category: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: string
          priority: string
          resource_link?: string | null
          status?: string
          title: string
          tx_hash?: string | null
          user_id?: string | null
          video_link?: string | null
        }
        Update: {
          budget?: number
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          payment_screenshot_url?: string | null
          payment_status?: string
          priority?: string
          resource_link?: string | null
          status?: string
          title?: string
          tx_hash?: string | null
          user_id?: string | null
          video_link?: string | null
        }
        Relationships: []
      }
      tutor_applications: {
        Row: {
          admin_note: string | null
          bio: string
          created_at: string
          expertise: string[] | null
          id: string
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          bio: string
          created_at?: string
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          bio?: string
          created_at?: string
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          created_at: string
          crypto_address: string | null
          crypto_network: string | null
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          qr_image_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          qr_image_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_network?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          qr_image_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_course_views: {
        Args: { _course_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "tutor"
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
      app_role: ["admin", "moderator", "user", "tutor"],
    },
  },
} as const
