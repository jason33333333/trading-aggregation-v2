-- Trading Aggregation V2 initial schema
-- Run in Supabase SQL Editor. Review before production use.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','moderator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null check (category in ('forex','gold','stocks','futures','crypto','other')),
  region text,
  founded_info text,
  legal_entities jsonb not null default '[]'::jsonb,
  regulators jsonb not null default '[]'::jsonb,
  instruments jsonb not null default '[]'::jsonb,
  fees jsonb not null default '{}'::jsonb,
  execution_notes text,
  risk_records jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','partially_verified','verified','under_review')),
  last_verified_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  post_type text not null default 'discussion' check (post_type in ('discussion','exposure','question')),
  evidence_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  moderator_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.academy_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text not null,
  title_en text not null,
  body_zh text not null default '',
  body_en text not null default '',
  stage integer not null check (stage between 1 and 6),
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('moderator','admin')); $$;

-- Check email verification safely; authenticated clients cannot directly read auth.users.
create or replace function public.is_email_verified()
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null); $$;

alter table public.profiles enable row level security;
alter table public.platforms enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.academy_articles enable row level security;

create policy "profiles read own or staff" on public.profiles for select using (id=auth.uid() or public.is_staff());
-- No client-side profile UPDATE policy: role changes must only be made by a trusted administrator.
create policy "public read published platforms" on public.platforms for select using (published=true or public.is_staff());
create policy "staff manage platforms" on public.platforms for all using (public.is_staff()) with check (public.is_staff());
create policy "read approved posts or own or staff" on public.forum_posts for select using (status='approved' or author_id=auth.uid() or public.is_staff());
create policy "verified users submit posts" on public.forum_posts for insert with check (author_id=auth.uid() and public.is_email_verified() and status='pending');
create policy "staff moderate posts" on public.forum_posts for update using (public.is_staff()) with check (public.is_staff());
create policy "read approved comments or own or staff" on public.forum_comments for select using (status='approved' or author_id=auth.uid() or public.is_staff());
create policy "verified users submit comments" on public.forum_comments for insert with check (author_id=auth.uid() and public.is_email_verified() and status='pending');
create policy "staff moderate comments" on public.forum_comments for update using (public.is_staff()) with check (public.is_staff());
create policy "read published academy" on public.academy_articles for select using (published=true or public.is_staff());
create policy "staff manage academy" on public.academy_articles for all using (public.is_staff()) with check (public.is_staff());

-- Create a profile automatically for each new account.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- IMPORTANT: assign the first admin manually in Supabase SQL Editor after registering:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_ADMIN_EMAIL');
