import { createServiceClient } from "@/lib/supabase/admin";
import type { PlayerRole } from "@/types";

export interface Player {
  id: string;
  player_name: string;
  photo_url: string | null;
  role: PlayerRole;
  jersey_name: string | null;
  jersey_number: number | null;
  contact_number: string | null;
  team_id: string;
  created_at: string;
}

export interface PlayerInput {
  player_name: string;
  photo_url?: string | null;
  role: PlayerRole;
  jersey_name?: string | null;
  jersey_number?: number | null;
  contact_number?: string | null;
  team_id: string;
}

export async function listPlayers(): Promise<Player[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("player_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Player[];
}

export async function getPlayer(id: string): Promise<Player | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as unknown as Player | null) ?? null;
}

export async function createPlayer(input: PlayerInput): Promise<Player> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Player;
}

export async function updatePlayer(id: string, input: Partial<PlayerInput>): Promise<Player> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Player;
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
