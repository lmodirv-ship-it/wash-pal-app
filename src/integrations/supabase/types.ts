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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          car_plate: string
          car_type: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          reference: string | null
          role: string
          total_visits: number
          user_id: string | null
        }
        Insert: {
          car_plate: string
          car_type: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          reference?: string | null
          role?: string
          total_visits?: number
          user_id?: string | null
        }
        Update: {
          car_plate?: string
          car_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          reference?: string | null
          role?: string
          total_visits?: number
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          branch_id: string
          created_at: string
          hire_date: string
          id: string
          is_active: boolean
          name: string
          phone: string
          reference: string | null
          role: string
          role_type: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          reference?: string | null
          role: string
          role_type?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          reference?: string | null
          role?: string
          role_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          title: string
        }
        Insert: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          title: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          title?: string
        }
        Relationships: []
      }
      imou_devices: {
        Row: {
          branch_id: string | null
          channel_id: string
          created_at: string
          device_id: string
          device_name: string
          id: string
          is_active: boolean
          last_snapshot_at: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          channel_id?: string
          created_at?: string
          device_id: string
          device_name: string
          id?: string
          is_active?: boolean
          last_snapshot_at?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          channel_id?: string
          created_at?: string
          device_id?: string
          device_name?: string
          id?: string
          is_active?: boolean
          last_snapshot_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imou_devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          branch_id: string
          created_at: string
          customer_name: string
          id: string
          is_paid: boolean
          order_id: string
          paid_amount: number
          services: Json
          total_amount: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_name: string
          id?: string
          is_paid?: boolean
          order_id: string
          paid_amount?: number
          services?: Json
          total_amount?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_paid?: boolean
          order_id?: string
          paid_amount?: number
          services?: Json
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          admin_email: string
          created_at: string
          id: string
          intruder_photo: string | null
          ip_address: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string
          id?: string
          intruder_photo?: string | null
          ip_address?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string
          id?: string
          intruder_photo?: string | null
          ip_address?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          branch_id: string
          car_plate: string
          car_type: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          employee_id: string | null
          employee_name: string | null
          id: string
          notes: string | null
          reference: string | null
          services: string[]
          status: string
          total_price: number
        }
        Insert: {
          branch_id: string
          car_plate: string
          car_type: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          reference?: string | null
          services?: string[]
          status?: string
          total_price?: number
        }
        Update: {
          branch_id?: string
          car_plate?: string
          car_type?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          notes?: string | null
          reference?: string | null
          services?: string[]
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          face_photo: string | null
          id: string
          name: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          face_photo?: string | null
          id?: string
          name?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          face_photo?: string | null
          id?: string
          name?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          duration: number
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          price: number
          reference: string | null
          starting_from: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          duration: number
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          price: number
          reference?: string | null
          starting_from?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          price?: number
          reference?: string | null
          starting_from?: boolean
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string | null
          expiry_date: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          owner_name: string
          package_name: string
          phone: string
          reference: string | null
          registration_date: string
          remaining_points: number | null
          total_points: number
          used_points: number
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          email?: string | null
          expiry_date?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          owner_name: string
          package_name?: string
          phone: string
          reference?: string | null
          registration_date?: string
          remaining_points?: number | null
          total_points?: number
          used_points?: number
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string | null
          expiry_date?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          owner_name?: string
          package_name?: string
          phone?: string
          reference?: string | null
          registration_date?: string
          remaining_points?: number | null
          total_points?: number
          used_points?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee" | "customer" | "supervisor"
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
      app_role: ["admin", "manager", "employee", "customer", "supervisor"],
    },
  },
} as const
