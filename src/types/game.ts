export type PlayerStatus = "alive" | "eliminated" | "opted_out";
export type GameStatus = "pending" | "active" | "paused" | "ended";
export type AssignmentStatus = "active" | "completed" | "reassigned";
export type KillConfirmedBy = "app" | "sms" | "admin";
export type MessageChannel = "app" | "sms" | "email" | "all";

export type Player = {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  nickname: string | null;
  photo_url: string | null;
  status: PlayerStatus;
  kill_count: number;
  eliminated_at: string | null;
  eliminated_by: string | null;
  created_at: string;
  onboarding_complete: boolean;
  rules_accepted_at: string | null;
  spoon_collected: boolean;
};

export type Assignment = {
  id: string;
  assassin_id: string;
  target_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at: string | null;
};

export type Kill = {
  id: string;
  assassin_id: string;
  target_id: string;
  confirmed_at: string;
  confirmed_by: KillConfirmedBy;
  selfie_url: string | null;
  notes: string | null;
};

export type GameState = {
  id: number;
  status: GameStatus;
  started_at: string | null;
  current_round: number;
  players_remaining: number;
  deadline: string | null;
};

export type Message = {
  id: string;
  sender: string;
  recipient_id: string | null;
  subject: string | null;
  body: string;
  channel: MessageChannel;
  sent_at: string;
  read_at: string | null;
};
