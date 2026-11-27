-- Trading Aggregation V2: complete initial database schema
-- Standalone bootstrap for a NEW/EMPTY Supabase public schema.
-- Review this file before running it in production. Do not run together with schema.sql.
-- No service-role key is used by browser clients. Keep role changes server-side only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity and authorization
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user','moderator','admin')),
  account_status text not null default 'active' check (account_status in ('active','suspended','banned')),
  bio text,
  preferred_locale text not null default 'zh-CN' check (preferred_locale in ('zh-CN','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Platform directory and independently verifiable research
-- ---------------------------------------------------------------------------
create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  slug text not null unique,
  category text not null check (category in ('forex','gold','stocks','futures','crypto','other')),
  region text,
  founded_info text,
  founded_info_en text,
  description_zh text not null default '',
  description_en text not null default '',
  website_url text,
  legal_entities jsonb not null default '[]'::jsonb,
  regulators jsonb not null default '[]'::jsonb,
  instruments jsonb not null default '[]'::jsonb,
  fees jsonb not null default '{}'::jsonb,
  execution_notes text,
  execution_notes_en text,
  risk_records jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','partially_verified','verified','under_review')),
  last_verified_at timestamptz,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_evidence (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  evidence_type text not null check (evidence_type in
    ('regulation','fees','spread','slippage','withdrawal','complaint','news','company','other')),
  title text not null,
  title_en text,
  source_name text,
  source_url text not null,
  published_at timestamptz,
  observed_at timestamptz not null default now(),
  summary_zh text not null default '',
  summary_en text not null default '',
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','corroborated','verified','disputed')),
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_observations (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  instrument text not null,
  account_type text,
  observation_type text not null check (observation_type in
    ('spread','commission','swap','slippage','execution','deposit','withdrawal','other')),
  value_numeric numeric,
  value_unit text,
  details text not null default '',
  market_conditions text,
  observed_at timestamptz not null default now(),
  evidence_id uuid references public.platform_evidence(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.platform_reviews (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform_id, author_id)
);

create table if not exists public.platform_history (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  change_type text not null,
  change_summary text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Community, reports and moderation
-- ---------------------------------------------------------------------------
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 3 and 200),
  body text not null check (length(body) between 1 and 30000),
  post_type text not null default 'discussion' check (post_type in ('discussion','exposure','question')),
  evidence_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  moderator_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 10000),
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','platform','review')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null,
  target_id uuid not null,
  action text not null check (action in ('approve','reject','hide','restore','suspend_user','ban_user','resolve_report')),
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learning academy and progress
-- ---------------------------------------------------------------------------
create table if not exists public.academy_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_zh text not null,
  title_en text not null,
  body_zh text not null default '',
  body_en text not null default '',
  stage integer not null check (stage between 1 and 6),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.academy_articles(id) on delete cascade,
  slug text not null,
  title_zh text not null,
  title_en text not null,
  body_zh text not null default '',
  body_en text not null default '',
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(article_id, slug)
);

create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

-- ---------------------------------------------------------------------------
-- Append-only administrative audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions. Role fields are deliberately not user-editable via RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('moderator','admin')
      and account_status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.is_email_verified()
returns boolean
language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''));
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger creation is repeatable.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
declare t text;
begin
  foreach t in array array['profiles','platforms','platform_reviews','forum_posts','academy_articles','academy_lessons','academy_progress'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists platforms_public_directory_idx on public.platforms(category, published, name);
create index if not exists platforms_verification_idx on public.platforms(verification_status, updated_at desc);
create index if not exists platform_evidence_platform_idx on public.platform_evidence(platform_id, observed_at desc);
create index if not exists platform_observations_lookup_idx on public.platform_observations(platform_id, instrument, observation_type, observed_at desc);
create index if not exists platform_reviews_public_idx on public.platform_reviews(platform_id, status, created_at desc);
create index if not exists platform_history_platform_idx on public.platform_history(platform_id, created_at desc);
create index if not exists forum_posts_feed_idx on public.forum_posts(status, created_at desc);
create index if not exists forum_posts_author_idx on public.forum_posts(author_id, created_at desc);
create index if not exists forum_comments_post_idx on public.forum_comments(post_id, status, created_at);
create index if not exists content_reports_queue_idx on public.content_reports(status, created_at);
create index if not exists academy_articles_stage_idx on public.academy_articles(published, stage, sort_order);
create index if not exists academy_lessons_article_idx on public.academy_lessons(article_id, published, sort_order);
create index if not exists academy_progress_user_idx on public.academy_progress(user_id, updated_at desc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platforms enable row level security;
alter table public.platform_evidence enable row level security;
alter table public.platform_observations enable row level security;
alter table public.platform_reviews enable row level security;
alter table public.platform_history enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.content_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.academy_articles enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_progress enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Recreate named policies so this script can be safely re-applied.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and policyname in (
        'profiles_select_self_staff','platforms_select_public_staff','platforms_staff_all',
        'evidence_select_public_staff','evidence_staff_all','observations_select_approved_staff',
        'observations_verified_insert','observations_staff_update','reviews_select_visible',
        'reviews_verified_insert','reviews_staff_update','history_select_staff',
        'posts_select_visible','posts_verified_insert_pending','posts_staff_update',
        'comments_select_visible','comments_verified_insert_pending','comments_staff_update',
        'reports_select_owner_staff','reports_verified_insert','reports_staff_update',
        'moderation_actions_staff_select','moderation_actions_staff_insert',
        'academy_articles_select_published','academy_articles_staff_all',
        'academy_lessons_select_published','academy_lessons_staff_all',
        'progress_owner_all','audit_admin_select','audit_admin_insert'
      )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy profiles_select_self_staff on public.profiles
  for select using (id=auth.uid() or public.is_staff());
-- Intentionally no client INSERT/UPDATE/DELETE policy for profiles.
create policy platforms_select_public_staff on public.platforms
  for select using (published=true or public.is_staff());
create policy platforms_staff_all on public.platforms
  for all using (public.is_staff()) with check (public.is_staff());

create policy evidence_select_public_staff on public.platform_evidence
  for select using (
    public.is_staff() or (
      verification_status in ('corroborated','verified')
      and exists(select 1 from public.platforms p where p.id=platform_id and p.published=true)
    )
  );
create policy evidence_staff_all on public.platform_evidence
  for all using (public.is_staff()) with check (public.is_staff());

create policy observations_select_approved_staff on public.platform_observations
  for select using (
    public.is_staff() or (
      status='approved'
      and exists(select 1 from public.platforms p where p.id=platform_id and p.published=true)
    )
  );
create policy observations_verified_insert on public.platform_observations
  for insert with check (
    created_by=auth.uid() and public.is_email_verified()
    and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.account_status='active')
    and status='pending'
  );
create policy observations_staff_update on public.platform_observations
  for update using (public.is_staff()) with check (public.is_staff());

create policy reviews_select_visible on public.platform_reviews
  for select using (status='approved' or author_id=auth.uid() or public.is_staff());
create policy reviews_verified_insert on public.platform_reviews
  for insert with check (
    author_id=auth.uid() and public.is_email_verified() and status='pending'
    and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.account_status='active')
  );
create policy reviews_staff_update on public.platform_reviews
  for update using (public.is_staff()) with check (public.is_staff());

create policy history_select_staff on public.platform_history
  for select using (public.is_staff());

create policy posts_select_visible on public.forum_posts
  for select using (status='approved' or author_id=auth.uid() or public.is_staff());
create policy posts_verified_insert_pending on public.forum_posts
  for insert with check (
    author_id=auth.uid() and public.is_email_verified() and status='pending'
    and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.account_status='active')
  );
create policy posts_staff_update on public.forum_posts
  for update using (public.is_staff()) with check (public.is_staff());

create policy comments_select_visible on public.forum_comments
  for select using (
    (status='approved' and exists(select 1 from public.forum_posts p where p.id=post_id and p.status='approved'))
    or author_id=auth.uid() or public.is_staff()
  );
create policy comments_verified_insert_pending on public.forum_comments
  for insert with check (
    author_id=auth.uid() and public.is_email_verified() and status='pending'
    and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.account_status='active')
    and exists(select 1 from public.forum_posts p where p.id=post_id and p.status='approved')
  );
create policy comments_staff_update on public.forum_comments
  for update using (public.is_staff()) with check (public.is_staff());

create policy reports_select_owner_staff on public.content_reports
  for select using (reporter_id=auth.uid() or public.is_staff());
create policy reports_verified_insert on public.content_reports
  for insert with check (
    reporter_id=auth.uid() and public.is_email_verified()
    and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.account_status='active')
  );
create policy reports_staff_update on public.content_reports
  for update using (public.is_staff()) with check (public.is_staff());

create policy moderation_actions_staff_select on public.moderation_actions
  for select using (public.is_staff());
create policy moderation_actions_staff_insert on public.moderation_actions
  for insert with check (moderator_id=auth.uid() and public.is_staff());

create policy academy_articles_select_published on public.academy_articles
  for select using (published=true or public.is_staff());
create policy academy_articles_staff_all on public.academy_articles
  for all using (public.is_staff()) with check (public.is_staff());
create policy academy_lessons_select_published on public.academy_lessons
  for select using (
    (published=true and exists(select 1 from public.academy_articles a where a.id=article_id and a.published=true))
    or public.is_staff()
  );
create policy academy_lessons_staff_all on public.academy_lessons
  for all using (public.is_staff()) with check (public.is_staff());

create policy progress_owner_all on public.academy_progress
  for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy audit_admin_select on public.admin_audit_logs
  for select using (public.is_admin());
create policy audit_admin_insert on public.admin_audit_logs
  for insert with check (actor_id=auth.uid() and public.is_admin());

-- Keep internal helpers unavailable to anonymous users.
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_email_verified() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_email_verified() to authenticated;

-- IMPORTANT: after registering and verifying your own account, promote the first
-- administrator manually in Supabase SQL Editor using your actual account email:
-- update public.profiles
-- set role='admin'
-- where id=(select id from auth.users where email='YOUR_LOGIN_EMAIL');
-- Do not expose or paste the service-role key in the browser or in chat.
