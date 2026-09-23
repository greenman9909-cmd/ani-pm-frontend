create table if not exists public.yoru_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.yoru_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  title text not null,
  image_url text,
  status text not null default 'watching' check (status in ('watching','planned','completed','paused','dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, anilist_id)
);
create table if not exists public.yoru_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  episode integer not null check (episode > 0),
  audio_mode text not null default 'sub' check (audio_mode in ('sub','dub')),
  position_seconds numeric not null default 0 check (position_seconds >= 0),
  duration_seconds numeric not null default 0 check (duration_seconds >= 0),
  updated_at timestamptz not null default now(),
  unique(user_id, anilist_id, episode, audio_mode)
);
create table if not exists public.yoru_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  episode integer not null check (episode > 0),
  audio_mode text not null default 'sub' check (audio_mode in ('sub','dub')),
  title text not null,
  image_url text,
  watched_at timestamptz not null default now()
);
create table if not exists public.yoru_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_audio text not null default 'sub' check (preferred_audio in ('sub','dub')),
  subtitle_language text not null default 'English',
  autoplay boolean not null default true,
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists yoru_library_user_updated_idx on public.yoru_library(user_id, updated_at desc);
create index if not exists yoru_progress_user_updated_idx on public.yoru_progress(user_id, updated_at desc);
create index if not exists yoru_history_user_watched_idx on public.yoru_history(user_id, watched_at desc);
alter table public.yoru_profiles enable row level security;
alter table public.yoru_library enable row level security;
alter table public.yoru_progress enable row level security;
alter table public.yoru_history enable row level security;
alter table public.yoru_settings enable row level security;
grant select,insert,update,delete on public.yoru_profiles,public.yoru_library,public.yoru_progress,public.yoru_history,public.yoru_settings to authenticated;
create policy "yoru_profiles_own_select" on public.yoru_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "yoru_profiles_own_insert" on public.yoru_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "yoru_profiles_own_update" on public.yoru_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "yoru_library_own_all" on public.yoru_library for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "yoru_progress_own_all" on public.yoru_progress for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "yoru_history_own_all" on public.yoru_history for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "yoru_settings_own_all" on public.yoru_settings for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);