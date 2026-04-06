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
      game_state: {
        Row: {
          id: number;
          status: "pending" | "active" | "paused" | "ended";
          started_at: string | null;
          current_round: number;
          players_remaining: number;
          deadline: string | null;
        };
        Insert: {
          id?: number;
          status?: "pending" | "active" | "paused" | "ended";
          started_at?: string | null;
          current_round?: number;
          players_remaining?: number;
          deadline?: string | null;
        };
        Update: {
          id?: number;
          status?: "pending" | "active" | "paused" | "ended";
          started_at?: string | null;
          current_round?: number;
          players_remaining?: number;
          deadline?: string | null;
        };
      };
      player_seeds: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          photo_url: string | null;
          phone: string | null;
          claimed: boolean;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          photo_url?: string | null;
          phone?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          photo_url?: string | null;
          phone?: string | null;
          claimed?: boolean;
          claimed_at?: string | null;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          nickname: string | null;
          photo_url: string | null;
          status: "alive" | "eliminated" | "opted_out";
          kill_count: number;
          eliminated_at: string | null;
          eliminated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          full_name: string;
          nickname?: string | null;
          photo_url?: string | null;
          status?: "alive" | "eliminated" | "opted_out";
          kill_count?: number;
          eliminated_at?: string | null;
          eliminated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          full_name?: string;
          nickname?: string | null;
          photo_url?: string | null;
          status?: "alive" | "eliminated" | "opted_out";
          kill_count?: number;
          eliminated_at?: string | null;
          eliminated_by?: string | null;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          assassin_id: string;
          target_id: string;
          status: "active" | "completed" | "reassigned";
          assigned_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          assassin_id: string;
          target_id: string;
          status?: "active" | "completed" | "reassigned";
          assigned_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          assassin_id?: string;
          target_id?: string;
          status?: "active" | "completed" | "reassigned";
          assigned_at?: string;
          completed_at?: string | null;
        };
      };
      kills: {
        Row: {
          id: string;
          assassin_id: string;
          target_id: string;
          confirmed_at: string;
          confirmed_by: "app" | "sms" | "admin";
          selfie_url: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          assassin_id: string;
          target_id: string;
          confirmed_at?: string;
          confirmed_by?: "app" | "sms" | "admin";
          selfie_url?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          assassin_id?: string;
          target_id?: string;
          confirmed_at?: string;
          confirmed_by?: "app" | "sms" | "admin";
          selfie_url?: string | null;
          notes?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          sender: string;
          recipient_id: string | null;
          subject: string | null;
          body: string;
          channel: "app" | "sms" | "email" | "all";
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          sender?: string;
          recipient_id?: string | null;
          subject?: string | null;
          body: string;
          channel?: "app" | "sms" | "email" | "all";
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          sender?: string;
          recipient_id?: string | null;
          subject?: string | null;
          body?: string;
          channel?: "app" | "sms" | "email" | "all";
          sent_at?: string;
          read_at?: string | null;
        };
      };
    };
    Functions: {
      confirm_kill: {
        Args: {
          p_assassin_id: string;
          p_target_id: string;
          p_selfie_url?: string;
          p_confirmed_by?: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      generate_assignments: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_leaderboard: {
        Args: Record<string, never>;
        Returns: {
          player_id: string;
          full_name: string;
          nickname: string | null;
          photo_url: string | null;
          kill_count: number;
          status: string;
          eliminated_at: string | null;
        }[];
      };
      enforce_deadline: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
};
