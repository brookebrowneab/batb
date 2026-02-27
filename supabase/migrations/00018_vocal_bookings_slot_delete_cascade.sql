-- Allow deleting vocal slots even when students are booked in them.
-- Deleting a slot should automatically remove dependent vocal_bookings.

alter table public.vocal_bookings
  drop constraint if exists vocal_bookings_audition_slot_id_fkey;

alter table public.vocal_bookings
  add constraint vocal_bookings_audition_slot_id_fkey
  foreign key (audition_slot_id)
  references public.audition_slots(id)
  on delete cascade;
