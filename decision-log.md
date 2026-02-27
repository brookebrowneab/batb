# Decision Log

## D-001 — Track Scheduling Model
**Date:** 2026-02-26  
**Decision:**  
- Dance requires sign-up (attendance/session selection), not 15-minute blocks.  
- Vocal uses 15-minute blocks with capacity 7; each student books exactly one Vocal slot.  
- Callbacks are invite-only attendance during a configured window; no sign-up and no blocks.

**Rationale:** Matches operational needs and reduces complexity where scheduling precision is unnecessary.

**Implications:**  
- Need DanceSession entity (or equivalent) and Booking constraints for one-per-student dance sign-up.  
- Need AuditionSlot entity and transactional booking RPC for Vocal.  
- Callback workflow uses invite flag + notification + window display; no Booking records.

---

## D-002 — Lock Time Policy
**Date:** 2026-02-26  
**Decision:** Families may change Dance sign-up and Vocal booking until **2:00 PM local time on the audition day**; after that, admin override only.

**Rationale:** Clear operational cutoff, predictable for families and staff.

**Implications:** Lock enforcement must be server-side (RPC/DB), not only UI.

---

## D-003 — Contract Versioning
**Date:** 2026-02-26  
**Decision:** Contracts are immutable snapshots per version; admin creates new versions. Signatures are stored in ContractAcceptance tied to a specific contract version; acceptance history is never overwritten.

**Rationale:** Preserves audit trail and prevents retroactive modification.

**Implications:** Registration completion references the active contract version at completion time; re-sign policy can be admin-triggered.

---

## D-004 — Architecture Selection
**Date:** 2026-02-26  
**Decision:** **Option A** — Static SPA + Supabase (Auth/DB/Storage) + DB-transactional RPC for Vocal booking (and Dance capacity if enabled).

**Rationale:** Best fit for static hosting; strongest guarantee against overbooking; minimal infrastructure.

**Trade-offs:** Requires careful RLS and RPC design/testing.

---

## D-005 — Selected AI Build Platform
**Date:** 2026-02-26  
**Decision:** **Claude Code** will be the single AI coding platform for the build plan and prompts.

**Rationale:** User selection.

---

## D-006 — Role Detection Approach
**Date:** 2026-02-26
**Decision:** Use a `staff_profiles` table lookup for role detection rather than JWT custom claims.

**Rationale:**
- Simpler to implement with standard Supabase setup (no Edge Functions needed to set custom claims).
- Profile table is directly queryable with RLS, making it the natural enforcement boundary.
- Role changes take effect on next page load / session refresh without token reissuance.

**Trade-offs:**
- Requires an extra query on auth state change to fetch the staff profile.
- Slightly slower than reading from JWT, but acceptable for ~200-user scale.

**Implications:**
- `staff_profiles` table with RLS is the source of truth for roles.
- Client checks `staff_profiles` after auth; if no row exists, user is treated as family.
- RLS policies on other tables will reference `staff_profiles` for staff/admin checks.

---

## D-007 — Frontend Framework
**Date:** 2026-02-26
**Decision:** Vanilla JavaScript with Vite (no React/Vue/Svelte). Hash-based client-side router for GitHub Pages compatibility.

**Rationale:** Minimal dependency footprint for MVP; avoids framework lock-in; Vite provides fast dev/build; hash routing works without server-side configuration.

**Trade-offs:** More manual DOM work than a reactive framework, but acceptable at MVP scope.

---

## D-008 — Re-sign Policy for Contracts
**Date:** 2026-02-26
**Decision:** Default behavior is to **disallow** re-signing the same contract version. A unique constraint on (student_id, contract_id) enforces this at the database level. When a new contract version is activated, families must sign the new version; old acceptances remain tied to old versions.

**Rationale:** Prevents duplicate signatures, preserves audit trail, and keeps the acceptance table clean. If admin needs a family to re-sign the same version, they would need to create a new version with the same text (rare edge case).

**Implications:**
- `contract_acceptances` has a unique index on (student_id, contract_id).
- Registration completeness evaluates against the **currently active** contract version.
- Old acceptances are preserved but do not satisfy the active version requirement.

---

## D-009 — Student Registration Data Fields
**Date:** 2026-02-26
**Decision:** Student registration collects: first_name, last_name, grade (student); parent_first_name, parent_last_name, parent_email, parent_phone (parent/guardian). Photo upload is required.

**Rationale:** Minimal PII collection per compliance notes (minors). Sufficient for audition logistics, packs, and communication.

**Implications:**
- Parent fields added to students table via migration 00006.
- Registration completeness now requires all 4 parent fields in addition to student fields, photo, and contract acceptance.

---

## D-010 — Director Scheduling Permissions
**Date:** 2026-02-26
**Decision:** Both directors and admins can create and edit audition window configs. Only admins can delete configs. Families can read configs (read-only, for schedule display).

**Rationale:** Directors need operational control of scheduling. Delete is restricted to admin to prevent accidental data loss after bookings exist.

**Implications:**
- RLS policies grant INSERT/UPDATE to all staff, DELETE to admin only.
- SELECT is open to all authenticated users (families see dates/times).
- All config edits are audited via updated_at and updated_by_staff_user_id.

---

## D-011 — Separate Tables for Dance and Vocal Sign-Ups
**Date:** 2026-02-26
**Decision:** Use dedicated `dance_signups` and (future) `vocal_bookings` tables instead of the unified `Booking` table with `track` enum described in data-architecture.md.

**Rationale:**
- Simpler unique constraint: `UNIQUE(student_id)` on each table vs. partial unique index.
- Cleaner RLS policies: no track-conditional logic needed.
- Self-contained RPCs per track — dance and vocal have different constraints (dance = optional capacity, vocal = cap 7 + transactional concurrency).
- Each table's RPC handles its own lock-time, eligibility, and capacity checks independently.

**Trade-offs:**
- Two tables instead of one; slightly more schema surface area.
- Querying "all bookings for a student" requires a UNION or two queries.

**Implications:**
- `dance_signups` table with `UNIQUE(student_id)` — one dance sign-up per student.
- Vocal (M6) will use a separate `vocal_bookings` table with its own RPC.
- Roster views query each table independently (consistent with track-separated roster design).

---

## D-012 — Dance Sign-Up Mutation via RPCs Only
**Date:** 2026-02-26
**Decision:** Family dance sign-up mutations (create, update, cancel) go through Supabase SECURITY DEFINER RPCs. No direct INSERT/UPDATE/DELETE RLS policies exist on `dance_signups` for families.

**Rationale:**
- Lock time enforcement requires checking `now()` against the audition date from a joined `dance_sessions` row — awkward in an RLS policy.
- RPCs can atomically verify ownership, registration completeness, lock time, and capacity in a single transaction.
- Admin override uses a separate RPC that skips lock time, making the authorization boundary explicit and auditable.

**Implications:**
- `upsert_dance_signup` RPC for family sign-up/change.
- `delete_dance_signup` RPC for family cancellation.
- `admin_update_dance_signup` RPC for admin override (no lock time check).
- This pattern will be reused for Vocal bookings in M6.

---

## D-013 — Callback Invite Toggle via RPC
**Date:** 2026-02-26
**Decision:** Directors toggle `callback_invited` via a SECURITY DEFINER RPC (`toggle_callback_invite`) rather than direct table updates.

**Rationale:**
- Students table RLS does not grant UPDATE to directors (only families own-row and admins any-row).
- Consistent with D-012 (staff mutations via RPCs).
- RPC enforces staff check and sets audit fields atomically.

**Implications:**
- Adapter calls `supabase.rpc('toggle_callback_invite', ...)` instead of `supabase.from('students').update(...)`.
- Same pattern applies to any future staff-initiated student field updates.

---

## D-014 — Mock Email Provider for Notifications
**Date:** 2026-02-26
**Decision:** MVP uses a mock email provider (console.log) with full audit logging in `notification_sends` table. Real email provider to be added in hardening.

**Rationale:**
- No email infrastructure exists in the codebase.
- Audit logging is the critical compliance requirement; actual delivery can follow.
- Mock allows full workflow testing without third-party dependencies.

**Implications:**
- `notification_sends` table captures who sent what to whom and when.
- Replacing mock with real provider requires only changing the send step in the staff UI; the audit logging is already in place.

---

## D-015 — Include Evaluations in MVP Scope
**Date:** 2026-02-26
**Decision:** Include the optional `student_evaluations` table and notes UI in M8 (Rosters + Profiles) rather than deferring to hardening.

**Rationale:**
- M9 (PDF packs) needs a "notes area" — evaluations provide the content for this.
- Small scope: one table, RLS policies, display + form on the profile page.
- Staff can write their own notes per track (dance, vocal, callbacks, general).
- Each staff member can only edit their own notes (RLS enforced).

**Implications:**
- `student_evaluations` table with RLS: staff SELECT all, INSERT/UPDATE own, admin DELETE.
- Profile page displays all notes and provides add/edit form.
- M9 can pull evaluation content directly for PDF generation.

## D-016 — Admin Audit Log Table Design
**Date:** 2026-02-26
**Decision:** Create a dedicated `admin_audit_log` table with SECURITY DEFINER RPC (`log_admin_audit`) for appending entries. Admin override RPCs call `log_admin_audit` at the end of their transaction.

**Rationale:**
- Deferred item from Cross-Cutting Compliance Remediation.
- Centralized audit trail for all admin/staff override actions.
- Append-only design with no UPDATE/DELETE policies — tamper-resistant.
- SECURITY DEFINER insert function prevents unauthorized audit entries.

**Implications:**
- Existing RPCs (`admin_update_dance_signup`, `admin_override_vocal_booking`, `toggle_callback_invite`) replaced with versions that include audit logging (same parameter signatures).
- New `activate_contract` RPC replaces two-step client-side approach, adding atomicity and audit logging.
- Staff can view audit log; families cannot.
- Page-level audit calls for config create/update and contract creation.