create schema if not exists app_private;

create or replace function app_private.is_espace_manager(_espace_id uuid, _user_id uuid)
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

drop policy "espaces_read_public_or_member" on public.espaces;
drop policy "espaces_update_manager" on public.espaces;
drop policy "espace_members_read" on public.espace_members;
drop policy "espace_members_manage" on public.espace_members;
drop policy "espace_members_update" on public.espace_members;
drop policy "espace_members_delete" on public.espace_members;
drop policy "espace_services_manage" on public.espace_services;
drop policy "espace_services_update" on public.espace_services;
drop policy "espace_services_delete" on public.espace_services;

drop function public.is_espace_manager(uuid, uuid);

create policy "espaces_read_public_or_member" on public.espaces for select
  using (is_public or owner_id = auth.uid() or app_private.is_espace_manager(id, auth.uid()));
create policy "espaces_update_manager" on public.espaces for update to authenticated
  using (app_private.is_espace_manager(id, auth.uid())) with check (app_private.is_espace_manager(id, auth.uid()));

create policy "espace_members_read" on public.espace_members for select to authenticated
  using (user_id = auth.uid() or app_private.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_manage" on public.espace_members for insert to authenticated
  with check (app_private.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_update" on public.espace_members for update to authenticated
  using (app_private.is_espace_manager(espace_id, auth.uid())) with check (app_private.is_espace_manager(espace_id, auth.uid()));
create policy "espace_members_delete" on public.espace_members for delete to authenticated
  using (user_id = auth.uid() or app_private.is_espace_manager(espace_id, auth.uid()));

create policy "espace_services_manage" on public.espace_services for insert to authenticated
  with check (app_private.is_espace_manager(espace_id, auth.uid()));
create policy "espace_services_update" on public.espace_services for update to authenticated
  using (app_private.is_espace_manager(espace_id, auth.uid())) with check (app_private.is_espace_manager(espace_id, auth.uid()));
create policy "espace_services_delete" on public.espace_services for delete to authenticated
  using (app_private.is_espace_manager(espace_id, auth.uid()));