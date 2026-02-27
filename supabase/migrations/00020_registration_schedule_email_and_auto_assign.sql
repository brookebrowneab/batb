-- Registration completion automation:
-- 1) Family-safe RPC to auto-assign vocal day from first-choice role.
-- 2) Admin-editable schedule email template.

-- ============================================================
-- RPC: auto_assign_vocal_day_for_registration (family-safe)
-- ============================================================

create or replace function public.auto_assign_vocal_day_for_registration(
  p_student_id uuid
) returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_reg_complete boolean;
  v_top_role_id uuid;
  v_assigned_date date;
begin
  select family_account_id, registration_complete
  into v_family_id, v_reg_complete
  from public.students
  where id = p_student_id;

  if v_family_id is null or v_family_id != auth.uid() then
    raise exception 'Access denied: student does not belong to your account.';
  end if;

  if v_reg_complete is not true then
    raise exception 'Registration must be complete before auto-assignment.';
  end if;

  select srp.audition_role_id
  into v_top_role_id
  from public.student_role_preferences srp
  where srp.student_id = p_student_id
  order by srp.rank_order asc
  limit 1;

  if v_top_role_id is null then
    return null;
  end if;

  select m.audition_date
  into v_assigned_date
  from public.vocal_role_day_mappings m
  where m.audition_role_id = v_top_role_id
  limit 1;

  if v_assigned_date is null then
    return null;
  end if;

  insert into public.vocal_day_assignments (student_id, audition_date, assigned_by_staff_user_id)
  values (p_student_id, v_assigned_date, auth.uid())
  on conflict (student_id)
  do update set
    audition_date = excluded.audition_date,
    assigned_by_staff_user_id = auth.uid(),
    updated_at = now();

  return v_assigned_date;
end;
$$;

-- ============================================================
-- Table: registration_email_templates (admin-editable)
-- ============================================================

create table if not exists public.registration_email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique check (template_key = 'registration_schedule'),
  show_title text not null default 'Beauty and the Beast',
  subject_template text not null,
  body_template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_staff_user_id uuid references auth.users(id)
);

alter table public.registration_email_templates enable row level security;

create policy "Authenticated users can read registration email templates"
  on public.registration_email_templates for select
  using (auth.uid() is not null);

create policy "Staff can insert registration email templates"
  on public.registration_email_templates for insert
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

create policy "Staff can update registration email templates"
  on public.registration_email_templates for update
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid()
    )
  );

insert into public.registration_email_templates (
  template_key,
  show_title,
  subject_template,
  body_template
) values (
  'registration_schedule',
  'Beauty and the Beast',
  '{{Title of the Show}} Audition Details - Please Review',
  E'Hi {{Student Name}} and Family,\n\nWe\'re excited to get auditions underway for {{Title of the Show}} - thank you for signing up!\n\nPlease review the required audition materials for:\n- Belle\n- Lumiere\n- Mrs. Potts\n- Gaston\n- Le Feu\n\nAll songs, tracks, and instructions are here:\nhttps://practice-batb.adcatheatre.com/\n\nEach student will be assigned:\n- Dance Day: {{Dance Day Date}} ({{Dance Start Time}}-{{Dance End Time}})\n- Vocal Day: {{Vocal Day Date}} ({{Vocal Start Time}}-{{Vocal End Time}})\n\nPlease also keep callback date(s) - {{Callback Date(s)}} ({{Callback Start Time}}-{{Callback End Time}}) - open in case your student is invited back.\n\nStudents should come prepared and comfortable with the posted materials. The more prepared they are, the more confident and focused they\'ll feel in the room.\n\nWe\'re looking forward to a strong, fun start to the season. Thank you for being part of it!\n\nWarmly,\n[Your Name]\n[Production Team / Organization Name]'
)
on conflict (template_key) do nothing;
