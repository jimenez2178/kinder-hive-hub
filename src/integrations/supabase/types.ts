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
      agradecimientos: {
        Row: {
          autor: string
          created_at: string
          fecha: string
          id: string
          mensaje: string
        }
        Insert: {
          autor: string
          created_at?: string
          fecha?: string
          id?: string
          mensaje: string
        }
        Update: {
          autor?: string
          created_at?: string
          fecha?: string
          id?: string
          mensaje?: string
        }
        Relationships: []
      }
      alertas: {
        Row: {
          activa: boolean | null
          created_at: string
          id: string
          mensaje: string
          prioridad: string
          show_banner: boolean | null
          titulo: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string
          id?: string
          mensaje: string
          prioridad?: string
          show_banner?: boolean | null
          titulo: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string
          id?: string
          mensaje?: string
          prioridad?: string
          show_banner?: boolean | null
          titulo?: string
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          contenido: string
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          titulo: string
        }
        Insert: {
          contenido: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          titulo: string
        }
        Update: {
          contenido?: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      cumpleanos: {
        Row: {
          created_at: string
          emoji: string | null
          fecha: string
          foto_url: string | null
          id: string
          mensaje: string | null
          nombre: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          fecha: string
          foto_url?: string | null
          id?: string
          mensaje?: string | null
          nombre: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          fecha?: string
          foto_url?: string | null
          id?: string
          mensaje?: string | null
          nombre?: string
        }
        Relationships: []
      }
      estudiantes: {
        Row: {
          activo: boolean | null
          created_at: string
          cuota_mensual: number
          foto_url: string | null
          grado: string
          id: string
          nombre: string
          padre_email: string | null
          padre_nombre: string | null
          padre_telefono: string | null
          seccion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          cuota_mensual?: number
          foto_url?: string | null
          grado: string
          id?: string
          nombre: string
          padre_email?: string | null
          padre_nombre?: string | null
          padre_telefono?: string | null
          seccion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          cuota_mensual?: number
          foto_url?: string | null
          grado?: string
          id?: string
          nombre?: string
          padre_email?: string | null
          padre_nombre?: string | null
          padre_telefono?: string | null
          seccion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          fecha: string
          hora: string | null
          id: string
          titulo: string
          ubicacion: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha: string
          hora?: string | null
          id?: string
          titulo: string
          ubicacion?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha?: string
          hora?: string | null
          id?: string
          titulo?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      galeria: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          fecha: string
          foto_url: string
          id: string
          titulo: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha?: string
          foto_url: string
          id?: string
          titulo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha?: string
          foto_url?: string
          id?: string
          titulo?: string | null
        }
        Relationships: []
      }
      mensaje_dia: {
        Row: {
          contenido: string
          created_at: string
          fecha_iso: string
          id: string
          origen_dato: string | null
          tipo_mensaje: string | null
        }
        Insert: {
          contenido: string
          created_at?: string
          fecha_iso?: string
          id?: string
          origen_dato?: string | null
          tipo_mensaje?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string
          fecha_iso?: string
          id?: string
          origen_dato?: string | null
          tipo_mensaje?: string | null
        }
        Relationships: []
      }
      notas_maestras: {
        Row: {
          categoria: string
          contenido: string
          created_at: string
          estudiante_id: string
          fecha: string
          id: string
          maestro_id: string | null
          maestro_nombre: string | null
        }
        Insert: {
          categoria: string
          contenido: string
          created_at?: string
          estudiante_id: string
          fecha?: string
          id?: string
          maestro_id?: string | null
          maestro_nombre?: string | null
        }
        Update: {
          categoria?: string
          contenido?: string
          created_at?: string
          estudiante_id?: string
          fecha?: string
          id?: string
          maestro_id?: string | null
          maestro_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_maestras_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          comprobante_url: string | null
          created_at: string
          created_by: string | null
          estado: string
          estudiante_id: string
          fecha: string
          id: string
          metodo_pago: string
          monto: number
          nota: string | null
          numero_recibo: string | null
          updated_at: string
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          estudiante_id: string
          fecha?: string
          id?: string
          metodo_pago: string
          monto: number
          nota?: string | null
          numero_recibo?: string | null
          updated_at?: string
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          estudiante_id?: string
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          nota?: string | null
          numero_recibo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          pin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          pin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          pin?: string | null
          updated_at?: string
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
    }
    Enums: {
      app_role: "directora" | "maestro"
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
      app_role: ["directora", "maestro"],
    },
  },
} as const
