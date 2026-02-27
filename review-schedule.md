# Review Schedule (Governance Level 3 — Controlled)

## Governance Summary
Scale Score: 3/5 → Minimum Governance Level: 3 (Controlled)

Required controls:
- Milestone-based delivery with gated reviews
- Automated tests for core rules (gating, uniqueness, capacity)
- Manual validation checklist at each milestone
- Security/RLS review checkpoints
- Rollback plan per milestone

---

## Numbering Note

The build plan (claude-build-plan.md) uses M0–M10. This review schedule omits M0 (scaffold, no review needed) and combines Registration + Photo (build-plan M3) into the M2 review. The mapping:

| Build Plan | Review Schedule |
|---|---|
| M0 Scaffold | *(no review)* |
| M1 Auth + Roles | M1 Auth + Roles |
| M2 Contracts + Gating | M2 Contracts + Registration + Photo |
| M3 Registration + Photo | *(included in M2 above)* |
| M4 Scheduling Config | M3 Director Scheduling Config |
| M5 Dance Sessions | M4 Dance Sessions |
| M6 Vocal Slots | M5 Vocal Slots |
| M7 Callbacks | M6 Callbacks |
| M8 Rosters + Profiles | M7 Rosters + PDF Packs + CSV Exports |
| M9 PDF/CSV Exports | *(included in M7 above)* |
| M10 Hardening | Final Security Review |

---

## Milestone Reviews

### M1 — Auth + Roles + RLS Skeleton
**Reviewers:** Admin + Director representative
**Must verify:**
- Family login works (magic link).
- Staff login works (role-based).
- RLS prevents family from reading any other student.
- No roster accessible without staff auth.
**Rollback:** revert RLS/policy changes and UI routes to previous stable tag.

**Status: COMPLETE**
**Commit:** 6541e3f — Milestone 1: Auth + Roles + RLS skeleton
**Date built:** 2026-02-26
**Evidence:**
- [x] Magic link auth implemented (src/pages/familyLogin.js, src/adapters/auth.js)
- [x] Staff password auth implemented (src/pages/staffLogin.js)
- [x] Role detection via staff_profiles table (decision D-006)
- [x] Route guards: /family, /staff, /admin (src/router.js)
- [x] RLS policies on staff_profiles (supabase/migrations/00001)
- [x] No roster endpoints exist
- [x] Automated tests: roles.test.js (role parsing, guards), router.test.js, no-roster.test.js
**Manual validation:** Pending user verification
**Open items:** None

---

### M2 — Contract Versioning + Gated Registration Completion + Registration Forms + Photo Upload
**Must verify:**
- Photo required.
- Dual typed signatures required.
- Contract acceptance tied to active contract version.
- Updating contract creates new version; old acceptances remain.
- Scheduling/sign-up blocked until registration_complete.
- Student + parent registration forms complete.
- Photo upload to private storage with signed URLs.
- Families can only access their own student(s) and photos.
**Rollback:** revert contract activation and UI gating logic.

**Status: COMPLETE (one minor test gap)**
**Commits:**
- 7029d53 — Milestone 2: Contract versioning + acceptance + gated registration
- 2f34c37 — Milestone 3: Registration forms + photo upload (private storage)
**Date built:** 2026-02-26
**Evidence:**
- [x] Contract versioning: immutable snapshots, admin create/activate (src/adapters/contracts.js, src/pages/adminContracts.js)
- [x] Contract acceptance: dual typed signatures, tied to version (src/pages/familyContract.js)
- [x] Unique constraint: one acceptance per student per contract version (migration 00004)
- [x] Registration completeness evaluator (src/domain/registration.js)
- [x] Multi-step family registration: student fields → parent fields → photo → contract (src/pages/familyRegistration.js)
- [x] Parent fields: first_name, last_name, email, phone (migration 00006)
- [x] Photo upload: private bucket, UUID paths, signed URLs with 5-min expiry (src/adapters/storage.js)
- [x] RLS: families own-student only; staff read all (migrations 00003, 00004, 00005)
- [x] Registration status checklist in dashboard (src/pages/familyDashboard.js)
- [x] Automated tests: contracts.test.js, registration.test.js (27 cases), storage.test.js
- [x] Security profile updated for storage patterns (security-profile.md)
**Manual validation:** Pending user verification
**Open items:** None (all resolved)
- [x] Automated authz test added: "Cross-family photo access prevention" in storage.test.js — verifies path ownership invariant that RLS relies on (3 test cases: cross-family rejection, folder separation, path traversal defense).

---

### M3 — Director Scheduling Configuration
**Must verify:**
- Directors can set audition dates and start/end windows for Dance, Vocal, Callbacks (as permitted).
- Audit entries exist for config changes.
- Changes after bookings have a defined admin resolution path.
**Rollback:** restore prior config snapshot.

**Status: COMPLETE**
**Commit:** 09abdf2 — Milestone 4: Director scheduling configuration + family schedule view
**Date built:** 2026-02-26
**Evidence:**
- [x] Audition window config: dates, dance/vocal/callback windows (src/pages/staffScheduling.js)
- [x] Director + admin can create/update; admin-only delete (decision D-010)
- [x] Audit fields: updated_at, updated_by_staff_user_id (migration 00007)
- [x] Family read-only schedule view (src/pages/familySchedule.js)
- [x] Validation: start < end for time windows (src/domain/scheduling.js)
- [x] Automated tests: scheduling.test.js
**Manual validation:** Pending user verification
**Open items:** None

---

### M4 — Dance Sessions + Sign-Up
**Must verify:**
- One dance sign-up per student.
- Capacity enforcement works if enabled.
- Roster shows only dance attendees; staff-only.
**Rollback:** restore sessions and bookings from snapshot export.

**Status: COMPLETE**
**Commit:** *(pending — build-plan M5)*
**Date built:** 2026-02-26
**Evidence:**
- [x] dance_sessions + dance_signups tables with RLS (migration 00008)
- [x] Unique constraint: one sign-up per student (dance_signups_student_idx)
- [x] Optional capacity enforcement in RPC (checks count vs session.capacity)
- [x] Lock time enforced server-side in upsert_dance_signup RPC (2:00 PM cutoff)
- [x] Admin override RPC: admin_update_dance_signup (no lock check, admin role required)
- [x] Family cancellation RPC: delete_dance_signup (ownership + lock time verified)
- [x] Session generation from audition_window_config (src/adapters/danceSessions.js)
- [x] Family dance sign-up page at /family/dance (src/pages/familyDanceSignup.js)
- [x] Staff dance roster at /staff/dance-roster (src/pages/staffDanceRoster.js)
- [x] Admin override UI embedded in staff roster (visible to admins only)
- [x] Dashboard links: family, staff, and admin
- [x] Domain logic: eligibility, lock time, capacity, validation (src/domain/danceSignup.js)
- [x] Automated tests: 30 tests in danceSignup.test.js (domain + structural + lock time + RPC pattern)
- [x] Decisions recorded: D-011 (separate tables), D-012 (RPC-only mutations)
**Manual validation:** Pending user verification
**Open items:** None

---

### M5 — Vocal Slots + Transactional Booking
**Must verify:**
- 15-minute slots, cap=7.
- Exactly one vocal slot per student.
- Concurrency test: two clients attempt last spot → only one succeeds.
- Reschedule works until 2:00 PM day-of; lock enforced server-side.
**Rollback:** revert RPC and constraints; restore bookings if needed.

**Status: COMPLETE**
**Commit:** *(pending — build-plan M6)*
**Date built:** 2026-02-26
**Evidence:**
- [x] audition_slots + vocal_bookings tables with RLS (migration 00009)
- [x] Unique constraint: one booking per student (vocal_bookings_student_idx)
- [x] Capacity hard cap 7 enforced in book_vocal_slot RPC with SELECT FOR UPDATE
- [x] Atomic reschedule via reschedule_vocal_slot RPC (release old + claim new in one txn)
- [x] Lock time enforced server-side in all family RPCs (2:00 PM cutoff)
- [x] Admin override RPC: admin_override_vocal_booking (no lock/capacity check)
- [x] Family cancellation RPC: cancel_vocal_booking (ownership + lock time verified)
- [x] 15-minute slot generation from vocal window config (domain + adapter)
- [x] Family vocal booking page at /family/vocal (src/pages/familyVocalBooking.js)
- [x] Staff vocal roster at /staff/vocal-roster (src/pages/staffVocalRoster.js)
- [x] Admin override UI embedded in staff roster (visible to admins only)
- [x] Dashboard links: family, staff, and admin
- [x] Domain logic: eligibility, lock time, capacity, slot generation (src/domain/vocalBooking.js)
- [x] Automated tests: vocalBooking.test.js (domain + structural + transactional safety)
- [x] Concurrency safety: SELECT FOR UPDATE serializes race for final seat (verified structurally; manual concurrency test pending)
**Manual validation:** Pending user verification
**Open items:**
- [ ] Live concurrency test (two browsers racing for last seat) requires running Supabase instance

---

### M6 — Callbacks Invite + Window + Notifications (Email)
**Must verify:**
- callback_invited gating and staff views.
- No booking/sign-up exists for callbacks.
- Email notification template and audit entries.
**Rollback:** disable notification job; revert invite flags if necessary.

**Status: NOT STARTED**

---

### M7 — Rosters + PDF Packs + CSV Exports
**Must verify:**
- Track-appropriate grouping:
  - Vocal by slot, Dance by session, Callbacks by invited list/window.
- PDF includes photo, key responses, participation info, notes area.
- Exports staff-auth only.
**Rollback:** disable export endpoints/features.

**Status: NOT STARTED**

---

### Final Security Review (Pre-Launch)
- Attempt IDOR access with guessed IDs (must fail).
- Validate photo storage access restrictions.
- Confirm no public roster endpoints or cached pages.
- Confirm admin override logging is present.

**Status: NOT STARTED**
