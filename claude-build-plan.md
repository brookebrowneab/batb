# Claude Code Build Plan — Secure, Gated Audition System

Use this plan to drive Claude Code iteratively. Do not skip milestones. Do not expand scope without updating decision-log.md and (if needed) deviation-report.md.

## Global Constraints (apply to all milestones)
- Static frontend deploy (GitHub Pages compatible).
- Supabase is DB + Auth + Storage.
- No public roster or public export links.
- Families can access only their own student(s).
- Gating: no Dance/Vocal actions until registration + photo + both typed signatures complete.
- Dance: sign-up required (attendance/session), exactly one per student.
- Vocal: 15-minute blocks, cap 7, exactly one slot per student.
- Callbacks: invite-only window; no booking/sign-up.
- Lock time: 2:00 PM local time day-of audition; families cannot change after lock; admin override only.
- Capacity and uniqueness enforced server-side (RLS + transactional RPC).

---

## Milestone 0 — Repo Scaffold & Local Dev Setup
### Objective
Create project structure and local development workflow (static frontend + Supabase client). Establish coding conventions and baseline test runner.

### Constraints
- No service role keys in frontend.
- Include env template for Supabase URL + anon key.

### Required Work
- Create folder structure:
  - /domain (rules)
  - /adapters (supabase, storage, email)
  - /ui (components)
  - /pages (routes)
  - /exports (PDF/CSV)
  - /tests
- Add linting/formatting.
- Add test framework (unit + integration placeholder).

### Required Automated Tests
- One trivial unit test to confirm test runner works.

### Manual Validation
- App starts locally.
- Can load a landing page.

### Documentation Updates
- None (unless you change defaults).

### Rollback
- Revert to initial commit tag `m0-init`.

#### Claude Prompt (M0)
Implement a minimal static SPA scaffold suitable for GitHub Pages deployment and Supabase integration later. 
Include:
- Folder structure described above
- Environment variable template for SUPABASE_URL and SUPABASE_ANON_KEY
- A minimal router with pages: Home, Family Login, Staff Login (placeholders)
- A working test runner with one sample test
Do NOT implement any auth flows yet.
Output: code changes only, plus a short HOW TO RUN + HOW TO TEST section in the PR/commit message.

---

## Milestone 1 — Auth + Roles + RLS Skeleton
### Objective
Implement Supabase Auth flows:
- Families: magic link login
- Staff: staff login
- Create staff profile/role model and enforce basic route gating in UI. Establish RLS skeleton and confirm “no public roster”.

### Constraints
- Treat frontend as untrusted; do not rely solely on route guards.
- Ensure no roster endpoints exist yet.

### Required Work
- Implement Family magic link login UI + session handling.
- Implement Staff login UI + session handling.
- Create StaffUser/Profile concept and seed at least one admin and one director in dev.
- Implement basic role detection in client (from profile/claims).
- Add protected routes:
  - /family (requires family session)
  - /staff (requires staff role)
  - /admin (requires admin role)

### Required Automated Tests
- Unit: role parsing/guard logic.
- Integration (conceptual, if possible in your stack): attempt to fetch “students list” as anon → must fail (or be absent).

### Manual Validation Gate
- Magic link sign-in works for a test family email.
- Staff sign-in works for seeded director/admin.
- Non-staff cannot reach /staff pages.
- No endpoints/pages show any roster.

### Documentation Updates
- If you choose a specific approach for roles (profile table vs JWT claims), record in decision-log.md.

### Rollback
- Tag before RLS changes; rollback by reverting policies and auth UI routes.

### Claude Prompt (M1)
Implement Supabase Auth for:
1. Family users via magic link
2. Staff users via staff login
  - Add:
    - A StaffUser/Profile model in Supabase (conceptual + client integration; if migrations are used, add them)
     - Client-side route guards for /family, /staff, /admin (but note RLS will enforce real security later)
   - Provide:
     - minimal UI for login + session state + logout
     - seed/dev instructions to create an admin and director profile
     - Add tests for guard logic and a basic “no roster access” check.
     - Do not build registration forms yet.

---

## Milestone 2 — Contracts: Versioning + Acceptance + Gated Registration Completion
### Objective
- Implement contract versioning and acceptance capture, plus gated `registration_complete` computation.

### Constraints
- Contract versions immutable once published.
- Acceptance tied to specific contract version; never overwrite history.
- Registration is incomplete until:
  - required student+parent fields
  - photo uploaded
  - contract acceptance exists with both typed signatures

### Required Work
- Data models (conceptual implemented): Contract, ContractAcceptance, Student (minimal fields), Family ownership model.
- Admin UI:
  - create/publish new contract version
  - set active contract version
  - view acceptance history per student
- Family UI:
  - view active contract text
  - enter typed student + parent signature
  - submit acceptance

### Required Automated Tests
- Unit: contract version “active” selection logic.
- Integration: acceptance saved with correct contract_id; prior acceptances remain.
- Unit: registration completeness function returns true only when all required elements exist.

### Manual Validation Gate
- Admin can create contract v1, set active.
- Family signs v1 (two signatures).
- Admin creates v2 and activates; v1 acceptance still visible and tied to v1.
- Registration_complete remains false until photo + required fields + acceptance done.

### Documentation Updates
- decision-log.md if you choose “re-sign policy” default behavior.
- security-profile.md if you add new sensitive fields.

### Rollback
- Deactivate new contract version; revert contract UI and acceptance workflow.

#### Claude Prompt (M2)
- Implement contract versioning and acceptance:
  - Admin can create a new contract version (immutable snapshot), set it active.
  - Family can view the active contract and submit typed student + parent signatures.
  - Store acceptance records tied to contract version, preserving history.
- Implement registration gating foundation:
  - Create minimal Student record tied to family account.
  - Implement a registration completeness evaluator that requires: required fields, photo, and acceptance of active contract version.
- Do NOT implement scheduling yet.
- Include unit/integration tests for versioning, acceptance history preservation, and completeness evaluation.

---

## Milestone 3 — Registration Forms + Photo Upload (Private Storage)
### Objective
- Collect student + parent data, upload required photo to private storage, and finalize registration_complete.

### Constraints
- Photo upload required; storage must be private.
- Families can only access their own photos via signed URLs/authenticated retrieval.
- No public roster or student list views for families (only their own).

### Required Work
- Family UI registration flow:
  - student fields
  - parent fields
  - required photo upload
  - contract signing (from M2) integrated into flow
- “Registration Status” checklist (what’s missing)
  - RLS requirements implemented:
  - families can read/write only their own student
  - staff can read all students (for later rosters)
  - Storage access patterns (signed URLs)

### Required Automated Tests
- Unit: registration checklist logic.
- Integration: photo upload path uses private bucket conventions (UUID path).
- Authz test: family cannot fetch another student photo URL.

### Manual Validation Gate
- Family completes all steps and sees registration complete.
- Attempt to access another student’s record fails.
- Photos are not publicly accessible.

### Documentation Updates
- security-profile.md: confirm storage security pattern.
- decision-log.md: record any data field schema choices.

### Rollback
- Revert storage bucket config and related code; fall back to placeholder photo (dev-only).

#### Claude Prompt (M3)
- Implement the full gated registration flow:
  - Student + parent forms
  - Required photo upload to a private Supabase Storage bucket
  - Contract signing integrated
  - Registration status checklist and final registration_complete state
- Enforce:
  - Families can only access their own student(s) and photos
  - Add tests for checklist logic and basic authz (no cross-student access).

---

## Milestone 4 — Director Scheduling Configuration (Dates + Windows)
### Objective
Enable directors (staff) to set:
- audition dates
- Dance start/end times
- Vocal start/end times (the window used to generate 15-min slots)
- Callback window start/end times
Lock time policy remains 2:00 PM day-of.

### Constraints
- Director can edit scheduling config; contracts remain admin-only.
- Changes must be audited (who changed what, when).
- If changes occur after bookings exist (later), require admin review workflow (at minimum: warning + audit entry).

### Required Work
- AuditionWindowConfig entity and UI editor for directors/admin.
- Validation: start < end.
- Store lock time policy (display only; fixed rule).

### Required Automated Tests
- Unit: window validation rules.
- Integration: staff-only access enforced; families cannot read/edit config beyond what’s needed (read-only minimal).

### Manual Validation Gate
- Director can set dates/windows and see them reflected in read-only family view (only relevant parts).
- Family cannot edit config.

### Documentation Updates
- decision-log.md: confirm director permissions scope.

### Rollback
- Revert config UI and policies; restore previous config snapshot.

#### Claude Prompt (M4)
- Implement director-editable audition scheduling configuration:
  - dates + dance window + vocal window + callback window
  - validations and staff-only access
  - audit fields for edits
- Expose read-only, minimal relevant window info to families (for display only).
- Do not generate slots/sessions yet.
- Add tests for validation and authorization.

---

## Milestone 5 — Dance Sessions + Sign-Up (Exactly One)
### Objective
Implement Dance sign-up as an attendance/session selection:
- student selects exactly one DanceSession (or “Dance Day” if only one)
- capacity optional

### Constraints
- Requires registration_complete=true.
- Exactly one dance sign-up per student.
- Lock time enforced server-side: changes allowed until 2:00 PM day-of.
- Staff roster view for Dance attendees.

### Required Work
- Generate DanceSessions from config (manual “generate” action for staff or admin).
- Family UI to select Dance session.
- Staff roster view for Dance: list attendees by session/date.
- Admin override: change student’s dance session after lock.

### Required Automated Tests
- Unit: eligibility (registration_complete required).
- Integration: uniqueness (one dance booking per student).
- Integration: lock time enforcement (family blocked after lock; admin allowed).

### Manual Validation Gate
- Registered family can sign up once, can change before lock.
- After lock, family cannot change; admin can.
- Staff can view Dance roster; family cannot.

### Documentation Updates
- Update decision-log.md if you choose capacity for dance sessions.
- Update security-profile.md if new staff views added.

### Rollback
- Remove dance bookings; restore sessions from snapshot.

#### Claude Prompt (M5)
- Implement DanceSession generation and dance sign-up:
- Staff can generate/edit dance sessions from scheduling config
- Family can select exactly one dance session if registration_complete
- Enforce lock time server-side (2:00 PM day-of) and uniqueness
- Staff roster view for dance attendees (staff-auth only)
- Include tests for eligibility, uniqueness, and lock behavior.

---

## Milestone 6 — Vocal Slot Generation + Transactional Booking (Cap 7, Exactly One)
### Objective
Implement Vocal slot scheduling:
- generate 15-min slots within configured vocal window(s)
- booking via transactional RPC
- cap 7 per slot
- exactly one vocal booking per student
- reschedule until lock time

### Constraints
- Must be transactional server-side; no client-only checks.
- Requires registration_complete=true.
- Lock time server-side.

### Required Work
- Staff/admin slot generator: from vocal window config → create 15-min AuditionSlots.
- Family UI to browse slots (show spots remaining, not names).
- Booking RPC:
  - ensures capacity <= 7
  - ensures one vocal booking per student
  - enforces lock time for family users
  - supports reschedule as atomic “move” (release old + claim new) in one transaction
- Staff roster view: vocal roster grouped by slot.

### Required Automated Tests
- Integration: capacity 7 and 8th rejected.
- Integration: uniqueness per student.
- Concurrency test: two attempts for final seat → only one succeeds.
- Integration: lock time enforcement family vs admin override.

### Manual Validation Gate
- Registered family books one slot, can move before lock.
- Slot shows full when 7 booked.
- Two browsers race for last seat; one fails.
- After lock, family can’t move; admin can.

### Documentation Updates
- security-profile.md: confirm transactional enforcement approach.
- decision-log.md if RPC design choice needs recording.

### Rollback
- Disable RPC and revert bookings; keep slots.

#### Claude Prompt (M6)
- Implement Vocal slot generation and booking with strict transactional guarantees:
  - Generate 15-minute slots from vocal window config
  - Family can book exactly one slot if registration_complete
  - Capacity max 7 per slot
  - Atomic reschedule/move supported
  - Lock time enforced server-side (2:00 PM day-of), admin override supported
- Add robust integration tests including a concurrency test for the final seat.
- Implement staff roster view grouped by slot.

---

## Milestone 7 — Callbacks: Invite Flag + Window Display + Notifications (Email)
### Objective
- Implement callbacks as invite-only attendance window with notifications:
- no booking/sign-up
- invited students see callback instructions/window
- staff can view invited list and generate callback pack

### Constraints
- No Booking records for callbacks.
- Notifications via email (MVP).
- No public link sharing.

### Required Work
- Staff UI: toggle callback_invited on Student; view invited list.
- Family UI: if invited, show callback window info + instructions; if not invited, show nothing or “not invited”.
- Email notification (triggered on invite or batch send):
- template includes callback date + start/end + instructions
- audit log entry for sends (minimum: who sent, when, to which student(s))

### Required Automated Tests
- Unit: invite gating (invited sees info; not invited doesn’t).
- Integration: no callback bookings created.
- Integration: email send is invoked and logged (mock provider).

### Manual Validation Gate
- Staff invites student; family sees callback info.
- Staff sends email; audit entry created.

### Documentation Updates
- deviation-report.md if SMS is added (should not be in MVP).
- security-profile.md: notification data handling.

### Rollback
- Revoke invite flags; disable notification trigger.

#### Claude Prompt (M7)
- Implement callback workflow as invite-only window:
- Staff can mark callback_invited on students
- Family sees callback window details only if invited
- No callback booking/sign-up exists
- Implement email notifications for invites (mock provider acceptable initially) with audit logging of sends.
- Add tests for invite gating and “no booking created” guarantee.

---

## Milestone 8 — Staff Rosters + Student Profile + Optional Evaluations (Optional Notes)
### Objective
- Deliver staff roster UI and student profiles with clear separation:
  - Dance roster (by session)
  - Vocal roster (by slot)
  - Callbacks invited list (by window)
- Provide student profile view with photo + key responses.
- Optional: evaluation notes (if time).

### Constraints
- Directors cannot edit core registration fields by default.
- Profile access staff-only; family sees only their own profile.
- No roster visible without staff auth.

### Required Work
- Staff roster filters: track/date/session/slot.
- Student profile modal/page with photo and responses.
- Optional Evaluation entity and notes UI (director write-only to notes).

### Required Automated Tests
- Authz: family cannot access staff roster endpoints.
- Authz: director cannot access admin-only pages.
- If evaluations: director can write notes only, not edit student data.

### Manual Validation Gate
- Director sees rosters and profiles.
- Family cannot see rosters.

### Documentation Updates
- decision-log.md if evaluations included in MVP scope.

### Rollback
- Disable evaluation feature flag; revert roster UI changes.

#### Claude Prompt (M8)
- Implement staff rosters and student profile views:
  - Dance roster by session
  - Vocal roster by slot
  - Callbacks invited list by window
- Add filtering and a student profile page/modal with photo + key responses.
- Ensure directors cannot edit student registration fields.
- Optionally implement evaluation notes behind a feature flag; if included, add tests.

---

## Milestone 9 — PDF Packs + CSV Exports (Staff-Only)
### Objective
Generate printable audition packs and CSV exports, grouped correctly:
- Dance: by session/day
- Vocal: by date + slot
- Callbacks: invited list + window info
Each student page: photo, student info, key responses, participation info, notes space.

### Constraints
- Staff-auth only; no public share links.
- Photos must be fetched securely (signed URLs).
- PDF generation must not leak other student data to family users.

### Required Work
Staff UI to export:
- PDF by dance session
- PDF by vocal slot
- PDF full track (dance/vocal/callbacks)
- CSV rosters
- Export format includes consistent headers/footers and notes space.
- If PDF generation is client-side, ensure it runs only under staff auth and does not store outputs publicly.

### Required Automated Tests
- Authz: family cannot call export actions.
- Export correctness smoke tests (structure/fields present).
- Photo retrieval only via signed URL and staff auth.

### Manual Validation Gate
- Generate sample PDFs for each track grouping.
- CSV exports correct and staff-only.
- No public URLs created.

### Documentation Updates
- security-profile.md: export access restrictions.
- review-schedule.md: confirm final launch checklist.

### Rollback
- Disable export feature; remove export buttons/routes.

#### Claude Prompt (M9)
- Implement staff-only PDF audition packs and CSV exports:
  - Grouping rules per track
  - Student page layout includes photo + key responses + participation info + notes area
  - Ensure exports require staff auth and do not generate public share links.
  - Use signed URLs for photos.
  - Add authz tests and basic export structure tests.

---

## Milestone 10 — Final Hardening: Audit Logs, Security Review, Launch Checklist
### Objective
Finalize auditing, tighten RLS, run security tests, and produce launch checklist.

### Constraints
- Governance Level 3 requires security review gate and rollback plan.

### Required Work
- Ensure all critical tables have created_at/updated_at and actor fields.
- Implement admin override audit log (bookings changes, contract activation, config changes).
- Run security checklist from security-profile.md.
- Add rate limiting protections where feasible (at least at UI and/or Supabase policy level).
- Produce LAUNCH.md with steps:
  - configure Supabase
  - create buckets and policies
  - seed staff users
  - deploy to GitHub Pages

### Required Automated Tests
- RLS regression tests (family cannot access other student; staff-only views protected).
- Booking RPC regression tests.

### Manual Validation Gate
- Perform “penetration-lite” checks:
  - try direct URL access to staff pages as family/anon
  - try reading other student by ID
  - try accessing photos without auth
  - concurrency booking again
- Confirm no public roster exists.

### Documentation Updates
- Update review-schedule.md with final sign-off record.
- Update decision-log.md if any final decisions made.

### Rollback
- Tag release candidate; revert to previous stable tag if any security gate fails.

#### Claude Prompt (M10)
- Perform final hardening:
  - Complete audit logging for critical actions (contracts, bookings, config, invites, exports)
  - Tighten and verify RLS policies with regression tests
  - Produce LAUNCH.md with Supabase setup + deployment steps for static hosting
- Run the full security checklist and document results.
- Do not add new features beyond MVP.
- Ongoing Operating Procedures (Post-MVP)
- Review staff roles before opening registration.
- Publish contract version before families begin.
- Generate Dance sessions and Vocal slots from config.
- Dry-run exports with test data before audition day.
- Lock-time communications: ensure families know 2:00 PM cutoff day-of.

---

