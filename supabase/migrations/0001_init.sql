-- Extensions
create extension if not exists pgcrypto;
create extension if not exists supabase_vault cascade;

-- Profiles table (mirrors auth.users for app data)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: auto-create profile row when a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SMTP configs
create table public.smtp_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  from_name text not null,
  from_email text not null,
  host text not null,
  port int not null check (port between 1 and 65535),
  secure boolean not null default false,
  username text not null,
  password_secret_id uuid not null,
  reply_to text,
  verified_at timestamptz,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.smtp_configs(user_id);

alter table public.smtp_configs enable row level security;

create policy "smtp_configs_owner_all" on public.smtp_configs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only one default per user
create unique index smtp_configs_one_default_per_user
  on public.smtp_configs(user_id)
  where is_default = true;
