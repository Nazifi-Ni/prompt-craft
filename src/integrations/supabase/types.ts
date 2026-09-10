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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bonuses: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          description: string | null
          display_order: number
          id: string
          resource_type: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          toolkit_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          resource_type?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          toolkit_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          resource_type?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          toolkit_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonuses_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      prompt_usage: {
        Row: {
          action: string
          created_at: string
          id: string
          prompt_id: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          prompt_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          prompt_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          body: string
          category_id: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          display_order: number
          example_input: string | null
          example_output: string | null
          id: string
          instructions: string | null
          is_featured: boolean
          pro_tip: string | null
          purpose: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title: string
          toolkit_id: string
          updated_at: string
          variables: Json
          warning: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          body?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          example_input?: string | null
          example_output?: string | null
          id?: string
          instructions?: string | null
          is_featured?: boolean
          pro_tip?: string | null
          purpose?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title: string
          toolkit_id: string
          updated_at?: string
          variables?: Json
          warning?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          body?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          display_order?: number
          example_input?: string | null
          example_output?: string | null
          id?: string
          instructions?: string | null
          is_featured?: boolean
          pro_tip?: string | null
          purpose?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          toolkit_id?: string
          updated_at?: string
          variables?: Json
          warning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "toolkit_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          display_order: number
          features: string[]
          grants_access: Database["public"]["Enums"]["access_level"]
          id: string
          interval: Database["public"]["Enums"]["billing_interval"]
          is_active: boolean
          name: string
          price_amount: number
          slug: string
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: string[]
          grants_access?: Database["public"]["Enums"]["access_level"]
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          name: string
          price_amount?: number
          slug: string
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: string[]
          grants_access?: Database["public"]["Enums"]["access_level"]
          id?: string
          interval?: Database["public"]["Enums"]["billing_interval"]
          is_active?: boolean
          name?: string
          price_amount?: number
          slug?: string
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          id: string
          plan_id: string | null
          provider: string | null
          provider_reference: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      toolkit_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          toolkit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          toolkit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          toolkit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolkit_categories_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      toolkit_usage: {
        Row: {
          created_at: string
          id: string
          toolkit_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          toolkit_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          toolkit_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "toolkit_usage_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
      toolkits: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          audience: string | null
          created_at: string
          description: string | null
          display_order: number
          features: string[]
          icon: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          name: string
          outcomes: string[]
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          audience?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: string[]
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name: string
          outcomes?: string[]
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          audience?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: string[]
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name?: string
          outcomes?: string[]
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          plan_id: string | null
          provider: string
          reference: string
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          plan_id?: string | null
          provider?: string
          reference: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          plan_id?: string | null
          provider?: string
          reference?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      prompt_cards: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"] | null
          category_id: string | null
          category_name: string | null
          category_order: number | null
          category_slug: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          display_order: number | null
          id: string | null
          is_featured: boolean | null
          slug: string | null
          tags: string[] | null
          title: string | null
          toolkit_id: string | null
          toolkit_name: string | null
          toolkit_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "toolkit_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_toolkit_id_fkey"
            columns: ["toolkit_id"]
            isOneToOne: false
            referencedRelation: "toolkits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      access_level: "free" | "pro"
      app_role: "admin" | "user"
      billing_interval: "free" | "monthly" | "annual"
      content_status: "draft" | "published" | "archived"
      difficulty_level: "beginner" | "intermediate" | "advanced"
      subscription_status:
        | "active"
        | "pending"
        | "expired"
        | "cancelled"
        | "failed"
      transaction_status: "pending" | "success" | "failed" | "abandoned"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      access_level: ["free", "pro"],
      app_role: ["admin", "user"],
      billing_interval: ["free", "monthly", "annual"],
      content_status: ["draft", "published", "archived"],
      difficulty_level: ["beginner", "intermediate", "advanced"],
      subscription_status: [
        "active",
        "pending",
        "expired",
        "cancelled",
        "failed",
      ],
      transaction_status: ["pending", "success", "failed", "abandoned"],
    },
  },
} as const
