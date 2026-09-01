-- ============ helpers ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  avatar_url text,
  city text,
  locale text not null default 'fr',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'first_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ zones ============
create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  description text,
  lat double precision,
  lng double precision,
  radius_m integer not null default 1000,
  pulse integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.zones to authenticated;
grant select on public.zones to anon;
grant all on public.zones to service_role;
alter table public.zones enable row level security;
create policy "zones_public_read" on public.zones for select using (true);
create policy "zones_insert_authenticated" on public.zones for insert to authenticated with check (auth.uid() = created_by);
create policy "zones_update_owner" on public.zones for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create trigger zones_updated_at before update on public.zones for each row execute function public.set_updated_at();

create table public.zone_members (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (zone_id, user_id)
);
grant select, insert, delete on public.zone_members to authenticated;
grant all on public.zone_members to service_role;
alter table public.zone_members enable row level security;
create policy "zone_members_read" on public.zone_members for select to authenticated using (true);
create policy "zone_members_join" on public.zone_members for insert to authenticated with check (auth.uid() = user_id);
create policy "zone_members_leave" on public.zone_members for delete to authenticated using (auth.uid() = user_id);
create index zone_members_zone_idx on public.zone_members(zone_id);

-- ============ flashes ============
create table public.flashes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete set null,
  body text not null,
  category text not null,
  status text not null default 'active',
  lat double precision,
  lng double precision,
  reply_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.flashes to authenticated;
grant select on public.flashes to anon;
grant all on public.flashes to service_role;
alter table public.flashes enable row level security;
create policy "flashes_read_active_or_own" on public.flashes for select using (status = 'active' and expires_at > now());
create policy "flashes_read_own" on public.flashes for select to authenticated using (auth.uid() = author_id);
create policy "flashes_insert_own" on public.flashes for insert to authenticated with check (auth.uid() = author_id);
create policy "flashes_update_own" on public.flashes for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "flashes_delete_own" on public.flashes for delete to authenticated using (auth.uid() = author_id);
create trigger flashes_updated_at before update on public.flashes for each row execute function public.set_updated_at();
create index flashes_active_idx on public.flashes(status, expires_at desc);
create index flashes_zone_idx on public.flashes(zone_id);

create table public.flash_replies (
  id uuid primary key default gen_random_uuid(),
  flash_id uuid not null references public.flashes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.flash_replies to authenticated;
grant all on public.flash_replies to service_role;
alter table public.flash_replies enable row level security;
create policy "flash_replies_read_involved" on public.flash_replies for select to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.flashes f where f.id = flash_id and f.author_id = auth.uid()));
create policy "flash_replies_insert_own" on public.flash_replies for insert to authenticated with check (auth.uid() = author_id);
create policy "flash_replies_delete_own" on public.flash_replies for delete to authenticated using (auth.uid() = author_id);
create index flash_replies_flash_idx on public.flash_replies(flash_id);

create or replace function public.sync_flash_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.flashes set reply_count = reply_count + 1 where id = new.flash_id;
    return new;
  else
    update public.flashes set reply_count = greatest(reply_count - 1, 0) where id = old.flash_id;
    return old;
  end if;
end;
$$;
create trigger flash_replies_count after insert or delete on public.flash_replies for each row execute function public.sync_flash_reply_count();

-- ============ espaces ============
create table public.espaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  public_code text not null unique,
  name text not null,
  type text not null,
  description text,
  city text,
  address text,
  lat double precision,
  lng double precision,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.espaces to authenticated;
grant select on public.espaces to anon;
grant all on public.espaces to service_role;
alter table public.espaces enable row level security;
create trigger espaces_updated_at before update on public.espaces for each row execute function public.set_updated_at();

create table public.espace_members (
  id uuid primary key default gen_random_uuid(),
  espace_id uuid not null references public.espaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (espace_id, user_id)
);
grant select, insert, update, delete on public.espace_members to authenticated;
grant all on public.espace_members to service_role;
alter table public.espace_members enable row level security;
create index espace_members_espace_idx on public.espace_members(espace_id);

create or replace function public.is_espace_manager(_espace_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.espaces e where e.id = _espace_id and e.owner_id = _user_id
  ) or exists (
    select 1 from public.espace_members m
    where m.espace_id = _espace_id and m.user_id = _user_id and m.role in ('admin','moderator')
  );
$$;

create policy "espaces_read_public_or_member" on public.espaces for select
  using (is_public or owner_id = auth.uid() or public.is_espace_manager(id, auth.uid()));
create policy "espaces_insert_own" on public.espaces for insert to authenticated with check (auth.uid() = owner_id);
create policy "espaces_update_manager" on public.espaces for update to authenticated using (public.is_espace_manager(id, auth.uid())) with check (public.is_espace_manager(id, auth.uid()));
create policy "espaces_delete_owner" on public.espaces for delete to authenticated using (auth.uid() = owner_id);

create policy "espace_members_read" on public.espace_members for select to authenticated
  using (user_id = auth.uid() or public.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_manage" on public.espace_members for insert to authenticated
  with check (public.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_update" on public.espace_members for update to authenticated
  using (public.is_espace_manager(espace_id, auth.uid())) with check (public.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_delete" on public.espace_members for delete to authenticated
  using (user_id = auth.uid() or public.is_espace_manager(espace_id, auth.uid()));

create table public.espace_services (
  id uuid primary key default gen_random_uuid(),
  espace_id uuid not null references public.espaces(id) on delete cascade,
  name text not null,
  description text,
  price_label text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.espace_services to authenticated;
grant select on public.espace_services to anon;
grant all on public.espace_services to service_role;
alter table public.espace_services enable row level security;
create index espace_services_espace_idx on public.espace_services(espace_id);
create trigger espace_services_updated_at before update on public.espace_services for each row execute function public.set_updated_at();
create policy "espace_services_read" on public.espace_services for select
  using (exists (select 1 from public.espaces e where e.id = espace_id and (e.is_public or e.owner_id = auth.uid())));
create policy "espace_services_manage" on public.espace_services for insert to authenticated
  with check (public.is_espace_manager(espace_id, auth.uid()));
create policy "espace_services_update" on public.espace_services for update to authenticated
  using (public.is_espace_manager(espace_id, auth.uid())) with check (public.is_espace_manager(espace_id, auth.uid()));
create policy "espace_services_delete" on public.espace_services for delete to authenticated
  using (public.is_espace_manager(espace_id, auth.uid()));

-- ============ radar ============
create table public.radar_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  categories text[] not null default '{}',
  radius_m integer not null default 2000,
  zone_id uuid references public.zones(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.radar_watches to authenticated;
grant all on public.radar_watches to service_role;
alter table public.radar_watches enable row level security;
create trigger radar_watches_updated_at before update on public.radar_watches for each row execute function public.set_updated_at();
create policy "radar_watches_own" on public.radar_watches for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.radar_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid references public.radar_watches(id) on delete cascade,
  title text not null,
  source_type text not null,
  source_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.radar_alerts to authenticated;
grant all on public.radar_alerts to service_role;
alter table public.radar_alerts enable row level security;
create index radar_alerts_user_idx on public.radar_alerts(user_id, created_at desc);
create policy "radar_alerts_own" on public.radar_alerts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);