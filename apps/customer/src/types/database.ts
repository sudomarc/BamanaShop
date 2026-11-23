// Database types generated from Supabase schema
// This file should be replaced with generated types from `supabase gen types typescript --local`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          full_name: string;
          avatar_url: string | null;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          full_name: string;
          avatar_url?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string;
          avatar_url?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_memberships: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_registration_number: string | null;
          tax_id: string | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_name: string | null;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_registration_number?: string | null;
          tax_id?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_registration_number?: string | null;
          tax_id?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courier_profiles: {
        Row: {
          id: string;
          user_id: string;
          partner_id: string | null;
          vehicle_type: string | null;
          vehicle_plate: string | null;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner_id?: string | null;
          vehicle_type?: string | null;
          vehicle_plate?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          partner_id?: string | null;
          vehicle_type?: string | null;
          vehicle_plate?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courier_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courier_profiles_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "delivery_partners";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_partners: {
        Row: {
          id: string;
          name: string;
          contact_phone: string;
          contact_email: string | null;
          coverage_zones: string[];
          base_fee_gnf: number;
          per_km_fee_gnf: number;
          cod_handling_fee_gnf: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_phone: string;
          contact_email?: string | null;
          coverage_zones?: string[];
          base_fee_gnf?: number;
          per_km_fee_gnf?: number;
          cod_handling_fee_gnf?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_phone?: string;
          contact_email?: string | null;
          coverage_zones?: string[];
          base_fee_gnf?: number;
          per_km_fee_gnf?: number;
          cod_handling_fee_gnf?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          address_line: string;
          commune: string;
          quartier: string;
          landmark: string | null;
          phone: string;
          email: string | null;
          opening_hours: Json;
          status: string;
          commission_rate_bps: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          address_line: string;
          commune: string;
          quartier: string;
          landmark?: string | null;
          phone: string;
          email?: string | null;
          opening_hours?: Json;
          status?: string;
          commission_rate_bps?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          address_line?: string;
          commune?: string;
          quartier?: string;
          landmark?: string | null;
          phone?: string;
          email?: string | null;
          opening_hours?: Json;
          status?: string;
          commission_rate_bps?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stores_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "seller_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price_gnf: number;
          compare_at_price_gnf: number | null;
          sku: string | null;
          barcode: string | null;
          weight_grams: number | null;
          status: string;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          price_gnf: number;
          compare_at_price_gnf?: number | null;
          sku?: string | null;
          barcode?: string | null;
          weight_grams?: number | null;
          status?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_gnf?: number;
          compare_at_price_gnf?: number | null;
          sku?: string | null;
          barcode?: string | null;
          weight_grams?: number | null;
          status?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          quantity_delta: number;
          reason: string;
          reference_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity_delta: number;
          reason: string;
          reference_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity_delta?: number;
          reason?: string;
          reference_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          commune: string;
          quartier: string;
          landmark: string | null;
          street_details: string | null;
          phone: string;
          instructions: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          commune: string;
          quartier: string;
          landmark?: string | null;
          street_details?: string | null;
          phone: string;
          instructions?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string | null;
          commune?: string;
          quartier?: string;
          landmark?: string | null;
          street_details?: string | null;
          phone?: string;
          instructions?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          store_id: string;
          status: string;
          subtotal_gnf: number;
          delivery_fee_gnf: number;
          payment_fee_gnf: number;
          total_gnf: number;
          commission_rate_bps: number;
          commission_gnf: number;
          courier_cost_gnf: number;
          seller_payable_gnf: number;
          payment_method: string;
          payment_status: string;
          delivery_status: string;
          delivery_address_id: string;
          delivery_address_snapshot: Json;
          assigned_courier_id: string | null;
          assigned_partner_id: string | null;
          prepared_at: string | null;
          ready_for_pickup_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          store_id: string;
          status?: string;
          subtotal_gnf: number;
          delivery_fee_gnf: number;
          payment_fee_gnf: number;
          total_gnf: number;
          commission_rate_bps: number;
          commission_gnf: number;
          courier_cost_gnf: number;
          seller_payable_gnf: number;
          payment_method: string;
          payment_status?: string;
          delivery_status?: string;
          delivery_address_id: string;
          delivery_address_snapshot: Json;
          assigned_courier_id?: string | null;
          assigned_partner_id?: string | null;
          prepared_at?: string | null;
          ready_for_pickup_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          store_id?: string;
          status?: string;
          subtotal_gnf?: number;
          delivery_fee_gnf?: number;
          payment_fee_gnf?: number;
          total_gnf?: number;
          commission_rate_bps?: number;
          commission_gnf?: number;
          courier_cost_gnf?: number;
          seller_payable_gnf?: number;
          payment_method?: string;
          payment_status?: string;
          delivery_status?: string;
          delivery_address_id?: string;
          delivery_address_snapshot?: Json;
          assigned_courier_id?: string | null;
          assigned_partner_id?: string | null;
          prepared_at?: string | null;
          ready_for_pickup_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey";
            columns: ["delivery_address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_assigned_courier_id_fkey";
            columns: ["assigned_courier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_assigned_partner_id_fkey";
            columns: ["assigned_partner_id"];
            isOneToOne: false;
            referencedRelation: "delivery_partners";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_sku: string | null;
          unit_price_gnf: number;
          quantity: number;
          line_total_gnf: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_sku?: string | null;
          unit_price_gnf: number;
          quantity: number;
          line_total_gnf: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          product_sku?: string | null;
          unit_price_gnf?: number;
          quantity?: number;
          line_total_gnf?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: string;
          status: string;
          amount_gnf: number;
          currency: string;
          external_reference: string | null;
          provider_response: Json | null;
          paid_at: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method: string;
          status?: string;
          amount_gnf: number;
          currency?: string;
          external_reference?: string | null;
          provider_response?: Json | null;
          paid_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          method?: string;
          status?: string;
          amount_gnf?: number;
          currency?: string;
          external_reference?: string | null;
          provider_response?: Json | null;
          paid_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_events: {
        Row: {
          id: string;
          payment_id: string;
          event_type: string;
          provider_event_id: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          event_type: string;
          provider_event_id: string;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          event_type?: string;
          provider_event_id?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_jobs: {
        Row: {
          id: string;
          order_id: string;
          partner_id: string;
          courier_id: string | null;
          status: string;
          pickup_address: Json;
          dropoff_address: Json;
          distance_km: number | null;
          estimated_fee_gnf: number;
          actual_fee_gnf: number | null;
          cod_amount_gnf: number | null;
          cod_collected_gnf: number | null;
          assigned_at: string | null;
          accepted_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          partner_id: string;
          courier_id?: string | null;
          status?: string;
          pickup_address: Json;
          dropoff_address: Json;
          distance_km?: number | null;
          estimated_fee_gnf: number;
          actual_fee_gnf?: number | null;
          cod_amount_gnf?: number | null;
          cod_collected_gnf?: number | null;
          assigned_at?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          partner_id?: string;
          courier_id?: string | null;
          status?: string;
          pickup_address?: Json;
          dropoff_address?: Json;
          distance_km?: number | null;
          estimated_fee_gnf?: number;
          actual_fee_gnf?: number | null;
          cod_amount_gnf?: number | null;
          cod_collected_gnf?: number | null;
          assigned_at?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_jobs_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "delivery_partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_jobs_courier_id_fkey";
            columns: ["courier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_events: {
        Row: {
          id: string;
          delivery_job_id: string;
          status: string;
          actor_id: string;
          location_lat: number | null;
          location_lng: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          delivery_job_id: string;
          status: string;
          actor_id: string;
          location_lat?: number | null;
          location_lng?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          delivery_job_id?: string;
          status?: string;
          actor_id?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_events_delivery_job_id_fkey";
            columns: ["delivery_job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_proofs: {
        Row: {
          id: string;
          delivery_job_id: string;
          type: string;
          url: string | null;
          otp_code: string | null;
          note: string | null;
          captured_by: string;
          captured_at: string;
        };
        Insert: {
          id?: string;
          delivery_job_id: string;
          type: string;
          url?: string | null;
          otp_code?: string | null;
          note?: string | null;
          captured_by: string;
          captured_at?: string;
        };
        Update: {
          id?: string;
          delivery_job_id?: string;
          type?: string;
          url?: string | null;
          otp_code?: string | null;
          note?: string | null;
          captured_by?: string;
          captured_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_delivery_job_id_fkey";
            columns: ["delivery_job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          id: string;
          delivery_job_id: string;
          reported_by: string;
          type: string;
          description: string;
          resolution: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          delivery_job_id: string;
          reported_by: string;
          type: string;
          description: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          delivery_job_id?: string;
          reported_by?: string;
          type?: string;
          description?: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incidents_delivery_job_id_fkey";
            columns: ["delivery_job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_rules: {
        Row: {
          id: string;
          name: string;
          scope: string;
          scope_id: string | null;
          rate_bps: number;
          min_order_gnf: number | null;
          max_commission_gnf: number | null;
          is_active: boolean;
          effective_from: string;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          scope: string;
          scope_id?: string | null;
          rate_bps: number;
          min_order_gnf?: number | null;
          max_commission_gnf?: number | null;
          is_active?: boolean;
          effective_from: string;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          scope?: string;
          scope_id?: string | null;
          rate_bps?: number;
          min_order_gnf?: number | null;
          max_commission_gnf?: number | null;
          is_active?: boolean;
          effective_from?: string;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_entries: {
        Row: {
          id: string;
          order_id: string | null;
          store_id: string | null;
          delivery_job_id: string | null;
          type: string;
          amount_gnf: number;
          currency: string;
          description: string;
          reference_id: string | null;
          reference_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          store_id?: string | null;
          delivery_job_id?: string | null;
          type: string;
          amount_gnf: number;
          currency?: string;
          description: string;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          store_id?: string | null;
          delivery_job_id?: string | null;
          type?: string;
          amount_gnf?: number;
          currency?: string;
          description?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_entries_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_entries_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_entries_delivery_job_id_fkey";
            columns: ["delivery_job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_payouts: {
        Row: {
          id: string;
          store_id: string;
          period_start: string;
          period_end: string;
          gross_sales_gnf: number;
          total_commission_gnf: number;
          total_delivery_cost_gnf: number;
          total_refunds_gnf: number;
          adjustments_gnf: number;
          net_payable_gnf: number;
          status: string;
          paid_at: string | null;
          paid_by: string | null;
          payment_reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          period_start: string;
          period_end: string;
          gross_sales_gnf: number;
          total_commission_gnf: number;
          total_delivery_cost_gnf: number;
          total_refunds_gnf: number;
          adjustments_gnf?: number;
          net_payable_gnf: number;
          status?: string;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          period_start?: string;
          period_end?: string;
          gross_sales_gnf?: number;
          total_commission_gnf?: number;
          total_delivery_cost_gnf?: number;
          total_refunds_gnf?: number;
          adjustments_gnf?: number;
          net_payable_gnf?: number;
          status?: string;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_payouts_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      refunds: {
        Row: {
          id: string;
          order_id: string;
          payment_id: string;
          amount_gnf: number;
          reason: string;
          status: string;
          approved_by: string | null;
          processed_at: string | null;
          external_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_id: string;
          amount_gnf: number;
          reason: string;
          status?: string;
          approved_by?: string | null;
          processed_at?: string | null;
          external_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_id?: string;
          amount_gnf?: number;
          reason?: string;
          status?: string;
          approved_by?: string | null;
          processed_at?: string | null;
          external_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refunds_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          subject: string;
          description: string;
          status: string;
          priority: string;
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          subject: string;
          description: string;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          subject?: string;
          description?: string;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          biometric_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          biometric_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          biometric_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string;
          data: Json;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          body: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          body?: string;
          data?: Json;
          read?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string | null;
          token: string;
          platform: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          token: string;
          platform: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          token?: string;
          platform?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: {
          p_customer_id: string;
          p_store_id: string;
          p_delivery_address_id: string;
          p_payment_method: string;
          p_courier_id?: string | null;
          p_assigned_partner_id?: string | null;
        };
        Returns: {
          o_order_id: string;
          o_subtotal_gnf: number;
          o_delivery_fee_gnf: number;
          o_payment_fee_gnf: number;
          o_total_gnf: number;
          o_commission_gnf: number;
          o_courier_cost_gnf: number;
          o_seller_payable_gnf: number;
          o_status: string;
          o_payment_status: string;
        };
      };
      confirm_payment: {
        Args: {
          p_payment_id: string;
          p_provider_event_id: string;
          p_provider_response: Json;
        };
        Returns: {
          o_payment_status: string;
          o_amount_gnf: number;
          o_seller_payable_gnf: number;
          o_refund_id: string;
        };
      };
      dispatch_delivery: {
        Args: {
          p_order_id: string;
          p_partner_id: string;
          p_courier_id?: string | null;
        };
        Returns: {
          o_delivery_job_id: string;
          o_status: string;
          o_estimated_fee_gnf: number;
          o_actual_fee_gnf: number;
        };
      };
      process_payout: {
        Args: {
          p_store_id: string;
          p_period_start: string;
          p_period_end: string;
        };
        Returns: {
          o_payout_id: string;
          o_gross_sales_gnf: number;
          o_total_commission_gnf: number;
          o_total_delivery_cost_gnf: number;
          o_total_refunds_gnf: number;
          o_net_payable_gnf: number;
          o_status: string;
        };
      };
    };
    Enums: {
      user_role:
        | "customer"
        | "seller"
        | "courier"
        | "partner_manager"
        | "admin"
        | "staff";
      role_status: "pending" | "approved" | "suspended" | "rejected";
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "completed"
        | "cancelled"
        | "returned";
      payment_status:
        | "pending"
        | "requires_action"
        | "paid"
        | "failed"
        | "cash_due"
        | "cash_collected"
        | "refunded"
        | "partially_refunded"
        | "under_review";
      payment_method: "cod" | "orange_money";
      delivery_status:
        | "unassigned"
        | "assigned"
        | "accepted"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
        | "returned";
      payout_status:
        "pending" | "payable" | "processing" | "paid" | "on_hold" | "disputed";
      store_status:
        "draft" | "pending_review" | "active" | "suspended" | "closed";
      product_status: "draft" | "active" | "out_of_stock" | "archived";
      financial_entry_type:
        | "order_revenue"
        | "delivery_fee_collected"
        | "payment_fee"
        | "platform_commission"
        | "courier_cost"
        | "seller_payout"
        | "refund_to_customer"
        | "adjustment";
      delivery_proof_type: "photo" | "signature" | "otp" | "note";
      incident_type:
        | "customer_unavailable"
        | "address_not_found"
        | "customer_refused"
        | "damaged_goods"
        | "vehicle_issue"
        | "safety_concern"
        | "other";
    };
  };
};
