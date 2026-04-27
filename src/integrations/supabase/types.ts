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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      b2b_partners: {
        Row: {
          address: string
          category: string | null
          city: string
          country: string | null
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
          prospecting_status: string
          reference: string | null
          registration_date: string
          remaining_points: number | null
          shop_id: string | null
          source: string | null
          total_points: number
          used_points: number
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address: string
          category?: string | null
          city?: string
          country?: string | null
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
          prospecting_status?: string
          reference?: string | null
          registration_date?: string
          remaining_points?: number | null
          shop_id?: string | null
          source?: string | null
          total_points?: number
          used_points?: number
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string
          category?: string | null
          city?: string
          country?: string | null
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
          prospecting_status?: string
          reference?: string | null
          registration_date?: string
          remaining_points?: number | null
          shop_id?: string | null
          source?: string | null
          total_points?: number
          used_points?: number
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_partners_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          shop_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          shop_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          shop_id: string
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
          shop_id: string
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
          shop_id?: string
          total_visits?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          notes: string | null
          shop_id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          notes?: string | null
          shop_id: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          notes?: string | null
          shop_id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      employee_join_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          rejection_reason: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          shop_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employee_service_overrides: {
        Row: {
          created_at: string
          employee_id: string
          enabled: boolean
          id: string
          service_id: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          enabled?: boolean
          id?: string
          service_id: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          enabled?: boolean
          id?: string
          service_id?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_service_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_service_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employees_export"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_service_overrides_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_service_overrides_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services_export"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "employee_service_overrides_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          shop_id: string
          user_id: string | null
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
          shop_id: string
          user_id?: string | null
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
          shop_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
          shop_id: string
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
          shop_id: string
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
          shop_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      face_entry_events: {
        Row: {
          branch_id: string | null
          camera_id: string | null
          confidence: number | null
          created_at: string
          event_hash: string
          event_time: string
          event_type: string
          face_track_id: string | null
          id: string
          matched_user_id: string | null
          person_type: string
          shop_id: string
          snapshot_url: string | null
        }
        Insert: {
          branch_id?: string | null
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          event_hash: string
          event_time?: string
          event_type?: string
          face_track_id?: string | null
          id?: string
          matched_user_id?: string | null
          person_type?: string
          shop_id: string
          snapshot_url?: string | null
        }
        Update: {
          branch_id?: string | null
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          event_hash?: string
          event_time?: string
          event_type?: string
          face_track_id?: string | null
          id?: string
          matched_user_id?: string | null
          person_type?: string
          shop_id?: string
          snapshot_url?: string | null
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
          shop_id: string | null
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
          shop_id?: string | null
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
          shop_id?: string | null
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
          {
            foreignKeyName: "imou_devices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: string
          shop_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: string
          shop_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: string
          shop_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
          shop_id: string
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
          shop_id: string
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
          shop_id?: string
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
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_work_entries_export"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "invoices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      message_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          language: string
          name: string
          shop_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          name: string
          shop_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          name?: string
          shop_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email: string | null
          email_enabled: boolean
          frequency: string
          id: string
          phone: string | null
          shop_id: string
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          frequency?: string
          id?: string
          phone?: string | null
          shop_id: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          frequency?: string
          id?: string
          phone?: string | null
          shop_id?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          shop_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          shop_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          shop_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          expected_end_at: string | null
          id: string
          notes: string | null
          reference: string | null
          services: string[]
          shop_id: string
          start_at: string
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
          expected_end_at?: string | null
          id?: string
          notes?: string | null
          reference?: string | null
          services?: string[]
          shop_id: string
          start_at?: string
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
          expected_end_at?: string | null
          id?: string
          notes?: string | null
          reference?: string | null
          services?: string[]
          shop_id?: string
          start_at?: string
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
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employees_export"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          max_branches: number
          max_employees: number
          monthly_price: number
          name_ar: string
          name_en: string
          name_fr: string
          sort_order: number
          trial_days: number
          updated_at: string
          yearly_price: number
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_branches?: number
          max_employees?: number
          monthly_price?: number
          name_ar: string
          name_en?: string
          name_fr?: string
          sort_order?: number
          trial_days?: number
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_branches?: number
          max_employees?: number
          monthly_price?: number
          name_ar?: string
          name_en?: string
          name_fr?: string
          sort_order?: number
          trial_days?: number
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
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
      role_audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_role: string | null
          old_role: string | null
          source_table: string
          target_user_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role?: string | null
          old_role?: string | null
          source_table: string
          target_user_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role?: string | null
          old_role?: string | null
          source_table?: string
          target_user_id?: string
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
          shop_id: string
          starting_from: boolean
          updated_at: string
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
          shop_id: string
          starting_from?: boolean
          updated_at?: string
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
          shop_id?: string
          starting_from?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          owner_id: string
          reference_code: string | null
          suspended: boolean
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          owner_id: string
          reference_code?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          owner_id?: string
          reference_code?: string | null
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          monthly_price: number
          plan: string
          shop_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          monthly_price?: number
          plan?: string
          shop_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          monthly_price?: number
          plan?: string
          shop_id?: string
          status?: string
          trial_ends_at?: string | null
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
      vehicle_plate_events: {
        Row: {
          branch_id: string | null
          camera_id: string | null
          confidence: number | null
          created_at: string
          event_hash: string
          event_time: string
          event_type: string
          id: string
          plate_number: string
          shop_id: string
          snapshot_url: string | null
          vehicle_type: string | null
        }
        Insert: {
          branch_id?: string | null
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          event_hash: string
          event_time?: string
          event_type: string
          id?: string
          plate_number: string
          shop_id: string
          snapshot_url?: string | null
          vehicle_type?: string | null
        }
        Update: {
          branch_id?: string | null
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          event_hash?: string
          event_time?: string
          event_type?: string
          id?: string
          plate_number?: string
          shop_id?: string
          snapshot_url?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      vehicle_sessions: {
        Row: {
          branch_id: string | null
          created_at: string
          entry_time: string
          exit_time: string | null
          id: string
          plate_number: string
          shop_id: string
          status: string
          stay_minutes: number | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          entry_time: string
          exit_time?: string | null
          id?: string
          plate_number: string
          shop_id: string
          status?: string
          stay_minutes?: number | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          plate_number?: string
          shop_id?: string
          status?: string
          stay_minutes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      video_scan_detections: {
        Row: {
          created_at: string
          frame_image: string | null
          has_car: boolean
          id: string
          plate: string | null
          scan_id: string
          timestamp_sec: number
        }
        Insert: {
          created_at?: string
          frame_image?: string | null
          has_car?: boolean
          id?: string
          plate?: string | null
          scan_id: string
          timestamp_sec?: number
        }
        Update: {
          created_at?: string
          frame_image?: string | null
          has_car?: boolean
          id?: string
          plate?: string | null
          scan_id?: string
          timestamp_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_scan_detections_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "video_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      video_scans: {
        Row: {
          admin_id: string
          created_at: string
          duration_sec: number
          id: string
          status: string
          total_cars: number
          video_name: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          duration_sec?: number
          id?: string
          status?: string
          total_cars?: number
          video_name: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          duration_sec?: number
          id?: string
          status?: string
          total_cars?: number
          video_name?: string
        }
        Relationships: []
      }
      visitor_stats: {
        Row: {
          id: number
          total_visits: number
          updated_at: string
        }
        Insert: {
          id?: number
          total_visits?: number
          updated_at?: string
        }
        Update: {
          id?: number
          total_visits?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_daily_face_logs: {
        Row: {
          branch_id: string | null
          date: string | null
          employees_detected: number | null
          shop_id: string | null
          total_faces: number | null
          unknown_detected: number | null
        }
        Relationships: []
      }
      v_daily_vehicle_logs: {
        Row: {
          branch_id: string | null
          currently_inside: number | null
          date: string | null
          shop_id: string | null
          total_entries: number | null
          total_exits: number | null
        }
        Relationships: []
      }
      v_employees_export: {
        Row: {
          branch_id: string | null
          branch_name: string | null
          created_at: string | null
          employee_id: string | null
          hire_date: string | null
          is_active: boolean | null
          name: string | null
          phone: string | null
          reference: string | null
          role: string | null
          role_type: string | null
          shop_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_services_export: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          is_active: boolean | null
          name: string | null
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          price: number | null
          reference: string | null
          service_id: string | null
          shop_id: string | null
          starting_from: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          is_active?: boolean | null
          name?: string | null
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          price?: number | null
          reference?: string | null
          service_id?: string | null
          shop_id?: string | null
          starting_from?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          is_active?: boolean | null
          name?: string | null
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          price?: number | null
          reference?: string | null
          service_id?: string | null
          shop_id?: string | null
          starting_from?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "services_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      v_work_entries_export: {
        Row: {
          branch_id: string | null
          car_plate: string | null
          car_type: string | null
          completed_at: string | null
          created_at: string | null
          customer_name: string | null
          employee_id: string | null
          employee_name: string | null
          expected_end_at: string | null
          notes: string | null
          order_id: string | null
          reference: string | null
          services: string[] | null
          shop_id: string | null
          start_at: string | null
          status: string | null
          total_price: number | null
        }
        Insert: {
          branch_id?: string | null
          car_plate?: string | null
          car_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          employee_id?: string | null
          employee_name?: string | null
          expected_end_at?: string | null
          notes?: string | null
          order_id?: string | null
          reference?: string | null
          services?: string[] | null
          shop_id?: string | null
          start_at?: string | null
          status?: string | null
          total_price?: number | null
        }
        Update: {
          branch_id?: string | null
          car_plate?: string | null
          car_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          employee_id?: string | null
          employee_name?: string | null
          expected_end_at?: string | null
          notes?: string | null
          order_id?: string | null
          reference?: string | null
          services?: string[] | null
          shop_id?: string | null
          start_at?: string | null
          status?: string | null
          total_price?: number | null
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
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employees_export"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite: { Args: { _token: string }; Returns: string }
      approve_join_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      can_manage_shop_team: { Args: { _shop_id: string }; Returns: boolean }
      current_employee_id: { Args: { _shop_id: string }; Returns: string }
      effective_services_for_employee: {
        Args: { _employee_id: string }
        Returns: {
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
          shop_id: string
          starting_from: boolean
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "services"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_shop_limits: {
        Args: { _shop_id: string }
        Returns: {
          max_branches: number
          max_employees: number
          plan_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor: { Args: never; Returns: number }
      is_owner: { Args: never; Returns: boolean }
      is_shop_manager: { Args: { _shop_id: string }; Returns: boolean }
      is_shop_member: { Args: { _shop_id: string }; Returns: boolean }
      is_shop_readonly: { Args: { _shop_id: string }; Returns: boolean }
      log_export_action: {
        Args: { _export_type: string; _row_count: number; _shop_id: string }
        Returns: string
      }
      log_owner_action: {
        Args: {
          _action: string
          _metadata?: Json
          _new_value?: Json
          _old_value?: Json
          _target_id: string
          _target_type: string
        }
        Returns: string
      }
      log_owner_action_v2: {
        Args: {
          _action: string
          _ip?: string
          _metadata?: Json
          _new_value?: Json
          _old_value?: Json
          _target_id: string
          _target_type: string
          _user_agent?: string
        }
        Returns: string
      }
      owner_broadcast: {
        Args: { _message: string; _scope?: string; _title: string }
        Returns: number
      }
      owner_db_health: { Args: never; Returns: Json }
      owner_recent_security_events: { Args: { _limit?: number }; Returns: Json }
      owner_set_shop_suspension: {
        Args: { _reason?: string; _shop_id: string; _suspend: boolean }
        Returns: undefined
      }
      owner_set_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      owner_tenant_integrity: { Args: never; Returns: Json }
      purge_surveillance_data: { Args: never; Returns: Json }
      reject_join_request: {
        Args: { _reason: string; _request_id: string }
        Returns: undefined
      }
      submit_join_request: {
        Args: { _full_name: string; _phone: string; _reference_code: string }
        Returns: string
      }
      user_shop_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "manager"
        | "employee"
        | "customer"
        | "supervisor"
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
      app_role: [
        "owner",
        "admin",
        "manager",
        "employee",
        "customer",
        "supervisor",
      ],
    },
  },
} as const
