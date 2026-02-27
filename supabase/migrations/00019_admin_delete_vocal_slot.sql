-- Admin-safe vocal slot deletion that also removes dependent bookings.
-- This works even if an environment still has a non-cascading FK.

create or replace function public.admin_delete_vocal_slot(
  p_slot_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists(
    select 1
    from public.staff_profiles
    where id = auth.uid()
      and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admins can delete vocal slots.';
  end if;

  if not exists (select 1 from public.audition_slots where id = p_slot_id) then
    raise exception 'Vocal slot not found.';
  end if;

  delete from public.vocal_bookings
  where audition_slot_id = p_slot_id;

  delete from public.audition_slots
  where id = p_slot_id;

  perform public.log_admin_audit(
    'delete_vocal_slot',
    auth.uid(),
    'audition_slots',
    p_slot_id,
    jsonb_build_object('deleted_booking_slot_id', p_slot_id::text)
  );
end;
$$;
