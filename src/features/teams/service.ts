import { createServiceClient } from "@/lib/supabase/admin";

export interface Team {
  id: string;
  team_name: string;
  logo_url: string | null;
  owner_name: string;
  owner_phone: string | null;
  created_at: string;
}

export interface TeamInput {
  team_name: string;
  logo_url?: string | null;
  owner_name: string;
  owner_phone?: string | null;
}

export async function listTeams(): Promise<Team[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("team_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Team[];
}

export async function getTeam(id: string): Promise<Team | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as unknown as Team | null) ?? null;
}

export async function createTeam(input: TeamInput): Promise<Team> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("teams")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Team;
}

export async function updateTeam(id: string, input: Partial<TeamInput>): Promise<Team> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Team;
}

export async function deleteTeam(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
