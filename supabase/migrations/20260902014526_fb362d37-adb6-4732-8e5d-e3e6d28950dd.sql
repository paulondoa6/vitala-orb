-- Public, screen-scoped read views. security_invoker keeps RLS of base tables.

create view public.v_profile_public
with (security_invoker = true) as
select p.id, p.first_name, p.avatar_url, p.city
from public.profiles p;
grant select on public.v_profile_public to anon, authenticated;

create view public.v_flash_feed
with (security_invoker = true) as
select
  f.id,
  f.body,
  f.category,
  f.zone_id,
  f.lat,
  f.lng,
  f.reply_count,
  f.created_at,
  f.expires_at,
  f.author_id,
  p.first_name as author_first_name,
  p.avatar_url as author_avatar_url
from public.flashes f
left join public.profiles p on p.id = f.author_id
where f.status = 'active' and f.expires_at > now();
grant select on public.v_flash_feed to anon, authenticated;

create view public.v_zone_list
with (security_invoker = true) as
select
  z.id,
  z.name,
  z.city,
  z.pulse,
  z.lat,
  z.lng,
  z.radius_m,
  (select count(*) from public.flashes f
     where f.zone_id = z.id and f.status = 'active' and f.expires_at > now()) as active_flash_count,
  (select count(*) from public.zone_members m where m.zone_id = z.id) as member_count
from public.zones z;
grant select on public.v_zone_list to anon, authenticated;

create view public.v_espace_public
with (security_invoker = true) as
select
  e.id,
  e.public_code,
  e.name,
  e.type,
  e.city,
  e.description,
  e.lat,
  e.lng,
  (select count(*) from public.espace_services s where s.espace_id = e.id) as service_count
from public.espaces e
where e.is_public;
grant select on public.v_espace_public to anon, authenticated;