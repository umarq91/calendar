// Placeholder Database type. Regenerate via:
//   supabase gen types typescript --local > types/supabase.ts
// or
//   supabase gen types typescript --linked > types/supabase.ts
//
// Until then, this file declares the shape this app expects so the supabase
// client helpers are still type-safe.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      smtp_configs: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          from_name: string;
          from_email: string;
          host: string;
          port: number;
          secure: boolean;
          username: string;
          password_secret_id: string;
          reply_to: string | null;
          verified_at: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          from_name: string;
          from_email: string;
          host: string;
          port: number;
          secure?: boolean;
          username: string;
          password_secret_id: string;
          reply_to?: string | null;
          verified_at?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          from_name?: string;
          from_email?: string;
          host?: string;
          port?: number;
          secure?: boolean;
          username?: string;
          password_secret_id?: string;
          reply_to?: string | null;
          verified_at?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_smtp_config: {
        Args: {
          p_label: string;
          p_from_name: string;
          p_from_email: string;
          p_host: string;
          p_port: number;
          p_secure: boolean;
          p_username: string;
          p_password: string;
          p_reply_to?: string | null;
        };
        Returns: string;
      };
      delete_smtp_config: {
        Args: { p_config_id: string };
        Returns: undefined;
      };
      get_smtp_with_password: {
        Args: { p_config_id: string };
        Returns: {
          id: string;
          label: string;
          from_name: string;
          from_email: string;
          host: string;
          port: number;
          secure: boolean;
          username: string;
          password: string;
          reply_to: string | null;
          is_default: boolean;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
