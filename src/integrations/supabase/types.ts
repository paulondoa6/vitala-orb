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
      espace_members: {
        Row: {
          created_at: string
          espace_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          espace_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          espace_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "espace_members_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
      espace_services: {
        Row: {
          created_at: string
          description: string | null
          espace_id: string
          id: string
          name: string
          position: number
          price_label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          espace_id: string
          id?: string
          name: string
          position?: number
          price_label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          espace_id?: string
          id?: string
          name?: string
          position?: number
          price_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espace_services_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
        ]
      }
      espaces: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          public_code: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          public_code: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          public_code?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      flash_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          flash_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          flash_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          flash_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_replies_flash_id_fkey"
            columns: ["flash_id"]
            isOneToOne: false
            referencedRelation: "flashes"
            referencedColumns: ["id"]
          },
        ]
      }
      flashes: {
        Row: {
          author_id: string
          body: string
          category: string
          created_at: string
          expires_at: string
          id: string
          lat: number | null
          lng: number | null
          reply_count: number
          status: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          author_id: string
          body: string
          category: string
          created_at?: string
          expires_at: string
          id?: string
          lat?: number | null
          lng?: number | null
          reply_count?: number
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          expires_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          reply_count?: number
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          first_name: string
          id: string
          lat: number | null
          lng: number | null
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string
          id: string
          lat?: number | null
          lng?: number | null
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          first_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      radar_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          source_id: string | null
          source_type: string
          title: string
          user_id: string
          watch_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          source_id?: string | null
          source_type: string
          title: string
          user_id: string
          watch_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          source_id?: string | null
          source_type?: string
          title?: string
          user_id?: string
          watch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radar_alerts_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "radar_watches"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_watches: {
        Row: {
          categories: string[]
          created_at: string
          id: string
          is_active: boolean
          label: string
          radius_m: number
          updated_at: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          radius_m?: number
          updated_at?: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          radius_m?: number
          updated_at?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radar_watches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_members: {
        Row: {
          id: string
          joined_at: string
          user_id: string
          zone_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          user_id: string
          zone_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_members_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          city: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          pulse: number
          radius_m: number
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          pulse?: number
          radius_m?: number
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          pulse?: number
          radius_m?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_espace_manager: {
        Args: { _espace_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
