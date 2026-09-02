revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_flash_reply_count() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_espace_manager(uuid, uuid) from public, anon;
grant execute on function public.is_espace_manager(uuid, uuid) to authenticated;