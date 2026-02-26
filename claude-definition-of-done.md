# Definition of Done (Per Milestone)

A milestone is “Done” only when:
1. All requirements for that milestone are implemented.
2. Automated tests exist for the milestone’s critical rules.
3. Manual test checklist is written and passes.
4. Security checks for the milestone pass (RLS, role checks, no unauthorized reads).
5. Any new config or workflow is documented.

## Critical Automated Test Areas (Minimum)
- Registration gating:
  - incomplete registration cannot access Dance/Vocal actions
  - completed registration can
- Contract versioning:
  - new contract version doesn’t overwrite old acceptances
  - acceptance ties to version
- Booking rules:
  - exactly one vocal booking per student
  - exactly one dance sign-up per student
  - capacity enforcement (vocal cap 7; dance optional)
  - lock time enforced server-side (2:00 PM day-of)
- Authorization:
  - family cannot access other students’ records
  - non-staff cannot access rosters/exports
  - directors cannot access admin-only controls

## Required Manual Validation (Minimum)
- Family completes registration and sees scheduling open.
- Family tries to book vocal slot when full → blocked.
- Two browsers attempt last vocal seat → one fails.
- After 2:00 PM day-of, family cannot change booking.
- Staff can see rosters; family cannot.
- Staff can generate PDF pack and CSV export; links are not public.