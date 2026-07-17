-- ============================================================================
-- CrickPulse — Auth & Role Management (Phase 7)
-- ----------------------------------------------------------------------------
-- Stores each user's platform role in a public.profiles table that mirrors
-- auth.users. RLS lets users read/update only their own row; role changes for
-- other users are performed via the service-role client (admin-only flows).
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'viewer'
    check (role in ('admin', 'scorer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);

alter table public.profiles enable row level security;

-- Users can read their own profile. Reads of other profiles are not needed by
-- the client (role resolution uses the service-role key server-side).
create policy "profiles_read_self" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- New auth users get a profile row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
