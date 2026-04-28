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
      asset_passports: {
        Row: {
          asset_id: string
          birth_date: string | null
          bloodline: string | null
          color_markings: string | null
          created_at: string
          expires_at: string | null
          gender: string | null
          height_cm: number | null
          id: string
          issued_at: string | null
          issuing_authority: string | null
          microchip_id: string | null
          official_name: string | null
          passport_no: string | null
          updated_at: string
          vaccinations: Json | null
          veterinarian_id: string | null
          weight_kg: number | null
        }
        Insert: {
          asset_id: string
          birth_date?: string | null
          bloodline?: string | null
          color_markings?: string | null
          created_at?: string
          expires_at?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          issued_at?: string | null
          issuing_authority?: string | null
          microchip_id?: string | null
          official_name?: string | null
          passport_no?: string | null
          updated_at?: string
          vaccinations?: Json | null
          veterinarian_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          asset_id?: string
          birth_date?: string | null
          bloodline?: string | null
          color_markings?: string | null
          created_at?: string
          expires_at?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          issued_at?: string | null
          issuing_authority?: string | null
          microchip_id?: string | null
          official_name?: string | null
          passport_no?: string | null
          updated_at?: string
          vaccinations?: Json | null
          veterinarian_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_passports_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          birth_date: string | null
          cloudinary_id: string | null
          created_at: string
          geofence_lat: number | null
          geofence_lng: number | null
          geofence_radius_km: number | null
          id: string
          image_url: string | null
          insurance_value: number | null
          insured_value: number | null
          is_active: boolean | null
          is_insured: boolean | null
          name: string
          notes: string | null
          owner_id: string
          photo_url: string | null
          registration_no: string | null
          sensor_device_id: string | null
          serial_number: string | null
          species: Database["public"]["Enums"]["asset_species"]
          stability_index: number | null
          stable_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cloudinary_id?: string | null
          created_at?: string
          geofence_lat?: number | null
          geofence_lng?: number | null
          geofence_radius_km?: number | null
          id?: string
          image_url?: string | null
          insurance_value?: number | null
          insured_value?: number | null
          is_active?: boolean | null
          is_insured?: boolean | null
          name: string
          notes?: string | null
          owner_id: string
          photo_url?: string | null
          registration_no?: string | null
          sensor_device_id?: string | null
          serial_number?: string | null
          species: Database["public"]["Enums"]["asset_species"]
          stability_index?: number | null
          stable_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cloudinary_id?: string | null
          created_at?: string
          geofence_lat?: number | null
          geofence_lng?: number | null
          geofence_radius_km?: number | null
          id?: string
          image_url?: string | null
          insurance_value?: number | null
          insured_value?: number | null
          is_active?: boolean | null
          is_insured?: boolean | null
          name?: string
          notes?: string | null
          owner_id?: string
          photo_url?: string | null
          registration_no?: string | null
          sensor_device_id?: string | null
          serial_number?: string | null
          species?: Database["public"]["Enums"]["asset_species"]
          stability_index?: number | null
          stable_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_stable_id_fkey"
            columns: ["stable_id"]
            isOneToOne: false
            referencedRelation: "stables"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          api_key_hash: string
          asset_id: string | null
          battery_level: number | null
          created_at: string
          device_serial: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          network_type: string | null
          owner_id: string
          signal_strength: number | null
          updated_at: string
        }
        Insert: {
          api_key_hash: string
          asset_id?: string | null
          battery_level?: number | null
          created_at?: string
          device_serial: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          network_type?: string | null
          owner_id: string
          signal_strength?: number | null
          updated_at?: string
        }
        Update: {
          api_key_hash?: string
          asset_id?: string | null
          battery_level?: number | null
          created_at?: string
          device_serial?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          network_type?: string | null
          owner_id?: string
          signal_strength?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          asset_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          owner_id: string
          photo_url: string | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          asset_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          owner_id: string
          photo_url?: string | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          asset_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          owner_id?: string
          photo_url?: string | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          national_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          activity_score: number | null
          asset_id: string | null
          battery_level: number | null
          device_id: string
          env_humidity: number | null
          env_score: number | null
          env_temp: number | null
          gps_lat: number | null
          gps_lng: number | null
          heart_rate: number | null
          id: string
          is_in_zone: boolean | null
          latitude: number | null
          longitude: number | null
          raw_payload: Json | null
          recorded_at: string
          respiration_rate: number | null
          signal_strength: number | null
          smoothed_stability: number | null
          stability_score: number | null
          temperature: number | null
          vital_score: number | null
        }
        Insert: {
          activity_score?: number | null
          asset_id?: string | null
          battery_level?: number | null
          device_id: string
          env_humidity?: number | null
          env_score?: number | null
          env_temp?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          heart_rate?: number | null
          id?: string
          is_in_zone?: boolean | null
          latitude?: number | null
          longitude?: number | null
          raw_payload?: Json | null
          recorded_at?: string
          respiration_rate?: number | null
          signal_strength?: number | null
          smoothed_stability?: number | null
          stability_score?: number | null
          temperature?: number | null
          vital_score?: number | null
        }
        Update: {
          activity_score?: number | null
          asset_id?: string | null
          battery_level?: number | null
          device_id?: string
          env_humidity?: number | null
          env_score?: number | null
          env_temp?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          heart_rate?: number | null
          id?: string
          is_in_zone?: boolean | null
          latitude?: number | null
          longitude?: number | null
          raw_payload?: Json | null
          recorded_at?: string
          respiration_rate?: number | null
          signal_strength?: number | null
          smoothed_stability?: number | null
          stability_score?: number | null
          temperature?: number | null
          vital_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      stability_snapshots: {
        Row: {
          asset_id: string
          env_score: number | null
          final_index: number | null
          id: string
          snapped_at: string
          status_flag: string | null
          vital_score: number | null
        }
        Insert: {
          asset_id: string
          env_score?: number | null
          final_index?: number | null
          id?: string
          snapped_at?: string
          status_flag?: string | null
          vital_score?: number | null
        }
        Update: {
          asset_id?: string
          env_score?: number | null
          final_index?: number | null
          id?: string
          snapped_at?: string
          status_flag?: string | null
          vital_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stability_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      stables: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_stability: {
        Args: {
          p_activity: number
          p_asset_id: string
          p_env_temp: number
          p_gps_lat: number
          p_gps_lng: number
          p_heart_rate: number
          p_in_zone: boolean
          p_resp_rate: number
          p_temperature: number
        }
        Returns: Json
      }
      can_access_realtime_topic: { Args: { _topic: string }; Returns: boolean }
      compute_stability: {
        Args: {
          p_asset_id: string
          p_lat: number
          p_lng: number
          p_temp: number
        }
        Returns: number
      }
      compute_stability_v2: {
        Args: {
          p_activity_score?: number
          p_asset_id: string
          p_env_humidity?: number
          p_env_temp?: number
          p_heart_rate?: number
          p_lat: number
          p_lng: number
          p_respiration_rate?: number
          p_temp: number
        }
        Returns: {
          env_pct: number
          stability: number
          vital_pct: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      haversine_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      snapshot_all_assets: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "ceo" | "owner" | "vet" | "viewer"
      asset_species: "camel" | "horse" | "falcon"
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
      app_role: ["admin", "ceo", "owner", "vet", "viewer"],
      asset_species: ["camel", "horse", "falcon"],
    },
  },
} as const
